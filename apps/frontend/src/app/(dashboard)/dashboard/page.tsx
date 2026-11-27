'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ScanLine,
  MessageSquareText,
  MapPin,
  Users,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  History,
  Cloud,
  WifiOff,
  Trash2,
  Radar,
} from 'lucide-react';
import { cn } from 'cn';
import { useAuth } from '@/context/auth-context';
import { apiFetch } from '@/lib/api';
import { useScanHistory, clearScanHistory, ScanHistoryItem } from '@/lib/scan-history';
import { MODEL_INFO } from '@/lib/platform-info';
import { buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useI18n } from '@/i18n/language-provider';
import type { MessageKey } from '@/i18n/messages';

type HistoryFilter = 'all' | 'alerts' | 'healthy' | 'uncertain';

interface OutbreakLike {
  isHealthy?: boolean;
  speciesName?: string;
  diseaseName?: string;
  properties?: { isHealthy?: boolean; speciesName?: string; diseaseName?: string };
}

interface OutbreakSummary {
  active: number;
  topThreat: { species: string | null; disease: string | null } | null;
}

function summarizeOutbreaks(payload: unknown): OutbreakSummary {
  const p = payload as { outbreaks?: OutbreakLike[]; features?: OutbreakLike[] };
  const items = (p.outbreaks ?? p.features ?? []).map((x) => x.properties ?? x);
  const active = items.filter((x) => !x.isHealthy);
  const counts = new Map<string, { species: string | null; disease: string | null; n: number }>();
  for (const x of active) {
    const species = x.speciesName ?? null;
    const disease = x.diseaseName ?? null;
    const key = `${species ?? ''}|${disease ?? ''}`;
    const entry = counts.get(key) ?? { species, disease, n: 0 };
    entry.n += 1;
    counts.set(key, entry);
  }
  const top = [...counts.values()].sort((a, b) => b.n - a.n)[0];
  return { active: active.length, topThreat: top ? { species: top.species, disease: top.disease } : null };
}

const MODULES: { href: string; icon: typeof ScanLine; id: 'scan' | 'advisor' | 'map' | 'community' | 'knowledge' }[] = [
  { href: '/scan', icon: ScanLine, id: 'scan' },
  { href: '/advisor', icon: MessageSquareText, id: 'advisor' },
  { href: '/outbreaks', icon: MapPin, id: 'map' },
  { href: '/community', icon: Users, id: 'community' },
  { href: '/knowledge', icon: BookOpen, id: 'knowledge' },
];

type Translate = (key: MessageKey, vars?: Record<string, string | number>) => string;

function timeAgo(iso: string, t: Translate): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return t('dash.time.now');
  if (s < 3600) return t('dash.time.min', { n: Math.floor(s / 60) });
  if (s < 86400) return t('dash.time.hour', { n: Math.floor(s / 3600) });
  return t('dash.time.day', { n: Math.floor(s / 86400) });
}

export default function DashboardOverviewPage() {
  const { user } = useAuth();
  const { t, crop, condition } = useI18n();
  const history = useScanHistory();
  const [filter, setFilter] = useState<HistoryFilter>('all');
  const [outbreaks, setOutbreaks] = useState<OutbreakSummary | null>(null);
  const [outbreakError, setOutbreakError] = useState(false);

  useEffect(() => {
    let active = true;
    apiFetch<unknown>('/diagnoses/outbreaks')
      .then((res) => active && setOutbreaks(summarizeOutbreaks(res)))
      .catch(() => active && setOutbreakError(true));
    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    const h = history ?? [];
    return {
      all: h.length,
      alerts: h.filter((x) => !x.uncertain && !x.isHealthy).length,
      healthy: h.filter((x) => !x.uncertain && x.isHealthy).length,
      uncertain: h.filter((x) => x.uncertain).length,
    };
  }, [history]);

  const visibleHistory = useMemo(() => {
    const h = history ?? [];
    if (filter === 'alerts') return h.filter((x) => !x.uncertain && !x.isHealthy);
    if (filter === 'healthy') return h.filter((x) => !x.uncertain && x.isHealthy);
    if (filter === 'uncertain') return h.filter((x) => x.uncertain);
    return h;
  }, [history, filter]);

  const STAT_CARDS: { key: HistoryFilter; label: string; icon: typeof ScanLine; tone: string }[] = [
    { key: 'all', label: t('dash.stat.all'), icon: History, tone: 'text-slate-700 bg-slate-100' },
    { key: 'alerts', label: t('dash.stat.alerts'), icon: AlertTriangle, tone: 'text-amber-700 bg-amber-50' },
    { key: 'healthy', label: t('dash.stat.healthy'), icon: ShieldCheck, tone: 'text-emerald-700 bg-emerald-50' },
    { key: 'uncertain', label: t('dash.stat.uncertain'), icon: HelpCircle, tone: 'text-sky-700 bg-sky-50' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="surface bg-field-grid flex flex-col justify-between gap-4 p-6 sm:flex-row sm:items-center">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {user?.fullName ? t('dash.welcomeName', { name: user.fullName.split(' ')[0] }) : t('dash.welcome')}
          </h1>
          <p className="text-sm text-slate-600">
            {t('dash.intro', { version: MODEL_INFO.version, classes: MODEL_INFO.classCount, crops: MODEL_INFO.cropCount })}
          </p>
        </div>
        <Link
          href="/scan"
          className={cn(
            buttonVariants({ size: 'default' }),
            'shrink-0 bg-emerald-700 text-white shadow-sm shadow-emerald-900/20 hover:bg-emerald-800'
          )}
        >
          <ScanLine className="mr-2 h-4 w-4" />
          {t('dash.newScan')}
        </Link>
      </div>

      {/* Interactive stat cards: click to filter the history list */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {STAT_CARDS.map(({ key, label, icon: Icon, tone }) => {
          const active = filter === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              aria-pressed={active}
              className={cn(
                'surface lift p-4 text-left',
                active && 'border-emerald-400 ring-2 ring-emerald-500/20'
              )}
            >
              <span className={cn('flex h-8 w-8 items-center justify-center rounded-lg', tone)}>
                <Icon className="h-4 w-4" />
              </span>
              {history === null ? (
                <Skeleton className="mt-3 h-7 w-10" />
              ) : (
                <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900 tabular-nums">{stats[key]}</p>
              )}
              <p className="text-xs text-slate-500">{label}</p>
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Recent scans */}
        <section className="surface flex flex-col lg:col-span-2">
          <div className="flex items-center justify-between gap-2 border-b border-border/80 px-5 py-3.5">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">{t('dash.recent')}</h2>
              <p className="text-xs text-slate-500">{t('dash.savedLocal')}</p>
            </div>
            {history && history.length > 0 && (
              <button
                type="button"
                onClick={clearScanHistory}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-500 transition-colors hover:bg-muted hover:text-slate-800"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {t('dash.clear')}
              </button>
            )}
          </div>

          {history === null ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-lg" />
              ))}
            </div>
          ) : visibleHistory.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-12 text-center">
              <ScanLine className="h-8 w-8 text-slate-300" />
              <p className="text-sm font-medium text-slate-700">
                {history.length === 0 ? t('dash.noScans') : t('dash.noMatch')}
              </p>
              <p className="max-w-xs text-xs text-slate-500">
                {history.length === 0 ? t('dash.noScansHint') : t('dash.noMatchHint')}
              </p>
              {history.length === 0 && (
                <Link href="/scan" className={cn(buttonVariants({ size: 'sm', variant: 'outline' }), 'mt-2')}>
                  {t('dash.openStudio')}
                </Link>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-border/70">
              {visibleHistory.slice(0, 8).map((item, i) => (
                <HistoryRow key={`${item.createdAt}-${i}`} item={item} />
              ))}
            </ul>
          )}
        </section>

        {/* Regional radar */}
        <section className="surface flex flex-col p-5">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600">
              <Radar className="h-4 w-4" />
            </span>
            <h2 className="text-sm font-semibold text-slate-900">{t('dash.radar')}</h2>
          </div>
          {outbreakError ? (
            <p className="mt-4 text-sm text-slate-500">{t('dash.radarUnavailable')}</p>
          ) : outbreaks === null ? (
            <div className="mt-4 space-y-2">
              <Skeleton className="h-9 w-16" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-56" />
            </div>
          ) : (
            <div className="mt-4 space-y-1">
              <p className="text-3xl font-bold tracking-tight text-slate-900 tabular-nums">{outbreaks.active}</p>
              <p className="text-xs text-slate-500">{t('dash.radarActive')}</p>
              {outbreaks.topThreat && (
                <p className="pt-2 text-sm text-slate-700">
                  {t('dash.radarTop')}{' '}
                  <span className="font-semibold">
                    {outbreaks.topThreat.species ? crop(outbreaks.topThreat.species) : t('dash.radarCrop')} —{' '}
                    {outbreaks.topThreat.disease ? condition(outbreaks.topThreat.disease) : t('dash.radarAlert')}
                  </span>
                </p>
              )}
            </div>
          )}
          <Link
            href="/outbreaks"
            className="group mt-auto inline-flex items-center gap-1 pt-5 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
          >
            {t('dash.openMap')}
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </section>
      </div>

      {/* Quick Action Modules */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {MODULES.map(({ href, icon: Icon, id }) => (
          <Link key={href} href={href} className="surface lift group flex flex-col p-4 hover:border-emerald-300">
            <Icon className="h-5 w-5 text-emerald-700" />
            <h3 className="mt-3 text-sm font-semibold text-slate-900 transition-colors group-hover:text-emerald-700">
              {t(`dash.mod.${id}.title` as MessageKey)}
            </h3>
            <p className="mt-1 flex-1 text-xs leading-relaxed text-slate-500">{t(`dash.mod.${id}.text` as MessageKey)}</p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
              {t(`dash.mod.${id}.cta` as MessageKey)}
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function HistoryRow({ item }: { item: ScanHistoryItem }) {
  const { t, crop, condition } = useI18n();
  const Icon = item.uncertain ? HelpCircle : item.isHealthy ? ShieldCheck : AlertTriangle;
  const tone = item.uncertain
    ? 'bg-sky-50 text-sky-700'
    : item.isHealthy
      ? 'bg-emerald-50 text-emerald-700'
      : 'bg-amber-50 text-amber-700';

  const body = (
    <div className="flex items-center gap-3 px-5 py-3 transition-colors group-hover:bg-muted/60">
      <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', tone)}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-900">
          {item.uncertain ? t('result.uncertain') : `${crop(item.speciesName)} — ${condition(item.diseaseName)}`}
        </p>
        <p className="flex items-center gap-1.5 text-xs text-slate-500">
          {item.mode === 'cloud' ? <Cloud className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
          {item.mode === 'cloud' ? t('dash.mode.cloud') : t('dash.mode.offline')} · {timeAgo(item.createdAt, t)}
        </p>
      </div>
      <span className="text-sm font-semibold text-slate-700 tabular-nums">{(item.confidence * 100).toFixed(0)}%</span>
      {item.id && <ArrowRight className="h-3.5 w-3.5 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-600" />}
    </div>
  );

  return (
    <li>
      {item.id ? (
        <Link href={`/advisor?diagnosisId=${item.id}`} className="group block" title={t('dash.discuss')}>
          {body}
        </Link>
      ) : (
        <div className="group">{body}</div>
      )}
    </li>
  );
}
