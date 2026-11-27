'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, Bug, Leaf, Apple, Wheat, Warehouse, X } from 'lucide-react';
import { cn } from 'cn';
import {
  buildCoverage,
  COVERAGE_CATEGORIES,
  CoverageCategory,
  CoverageCrop,
} from '@/data/crop-coverage';
import { cropEmoji, partEmoji, pestEmoji } from '@/data/crop-emoji';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useI18n } from '@/i18n/language-provider';
import type { MessageKey } from '@/i18n/messages';

const CATEGORY_ICON: Record<CoverageCategory, typeof Leaf> = {
  orchard: Apple,
  field: Wheat,
  greenhouse: Warehouse,
  pests: Bug,
};

export function CropCoverageExplorer() {
  const { t, crop: cropName, part: partName, condition } = useI18n();
  const [crops, setCrops] = useState<CoverageCrop[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [category, setCategory] = useState<'all' | CoverageCategory>('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/models/classes.json')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((json) => {
        if (active) setCrops(buildCoverage(json.classification_classes ?? []));
      })
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
    };
  }, []);

  const counts = useMemo(() => {
    const c: Record<CoverageCategory, number> = { orchard: 0, field: 0, greenhouse: 0, pests: 0 };
    for (const crop of crops ?? []) {
      c[crop.category] += 1;
      c.pests += crop.conditions.filter((x) => x.isPest).length;
    }
    return c;
  }, [crops]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (crops ?? []).filter((crop) => {
      if (category === 'pests' && !crop.conditions.some((c) => c.isPest)) return false;
      if (category !== 'all' && category !== 'pests' && crop.category !== category) return false;
      if (!q) return true;
      return (
        crop.name.toLowerCase().includes(q) ||
        cropName(crop.name).toLowerCase().includes(q) ||
        crop.conditions.some(
          (c) => c.label.toLowerCase().includes(q) || condition(c.label).toLowerCase().includes(q)
        )
      );
    });
  }, [crops, category, query, cropName, condition]);

  const activeCrop = visible.find((c) => c.name === selected) ?? visible[0] ?? null;
  const activeConditions = activeCrop
    ? activeCrop.conditions.filter((c) => category !== 'pests' || c.isPest)
    : [];
  const parts = [...new Set(activeConditions.map((c) => c.part))];

  return (
    <div className="surface overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-border/80 p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-1.5">
          <CategoryPill active={category === 'all'} onClick={() => setCategory('all')} label={t('coverage.all')} count={crops?.length} />
          {COVERAGE_CATEGORIES.map((cat) => {
            const Icon = CATEGORY_ICON[cat.key];
            return (
              <CategoryPill
                key={cat.key}
                active={category === cat.key}
                onClick={() => setCategory(cat.key)}
                label={t(`coverage.cat.${cat.key}` as MessageKey)}
                count={crops ? counts[cat.key] : undefined}
                icon={<Icon className="h-3.5 w-3.5" />}
                title={t(`coverage.cat.${cat.key}.desc` as MessageKey)}
              />
            );
          })}
        </div>
        <div className="relative md:w-64">
          <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('coverage.search')}
            className="h-9 pr-8 pl-8 text-sm"
            aria-label={t('coverage.searchLabel')}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label={t('coverage.clearSearch')}
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-700"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {failed ? (
        <p className="p-6 text-sm text-slate-500">{t('coverage.loadFailed')}</p>
      ) : !crops ? (
        <div className="grid gap-4 p-4 md:grid-cols-[1fr_1.2fr]">
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 18 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-24 rounded-full" />
            ))}
          </div>
          <Skeleton className="h-48 rounded-lg" />
        </div>
      ) : visible.length === 0 ? (
        <div className="p-8 text-center text-sm text-slate-500">
          {t('coverage.noMatch', { query })}
        </div>
      ) : (
        <div className="grid gap-0 md:grid-cols-[1fr_1.2fr]">
          <div className="flex max-h-80 flex-wrap content-start gap-1.5 overflow-y-auto border-b border-border/80 p-4 md:border-r md:border-b-0">
            {visible.map((crop) => {
              const isActive = activeCrop?.name === crop.name;
              return (
                <button
                  key={crop.name}
                  type="button"
                  onClick={() => setSelected(crop.name)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border py-1.5 pr-3 pl-2 text-xs font-medium transition-all duration-150',
                    isActive
                      ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                      : 'border-border bg-card text-slate-700 hover:-translate-y-px hover:border-emerald-300 hover:text-emerald-800'
                  )}
                >
                  <span aria-hidden className="text-sm leading-none">
                    {cropEmoji(crop.name)}
                  </span>
                  {cropName(crop.name)}
                  <span className={cn('tabular-nums', isActive ? 'text-emerald-100' : 'text-slate-400')}>
                    {crop.conditions.length}
                  </span>
                </button>
              );
            })}
          </div>

          {activeCrop && (
            <div key={activeCrop.name + category} className="animate-in fade-in slide-in-from-bottom-1 space-y-4 p-5 duration-300">
              <div>
                <p className="text-xs font-semibold tracking-wider text-emerald-700 uppercase">
                  {t(`coverage.cat.${activeCrop.category}` as MessageKey)}
                </p>
                <h3 className="mt-0.5 flex items-center gap-2 text-lg font-bold text-slate-900">
                  <span aria-hidden className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-xl">
                    {cropEmoji(activeCrop.name)}
                  </span>
                  {cropName(activeCrop.name)}
                </h3>
                <p className="text-xs text-slate-500">
                  {t(category === 'pests' ? 'coverage.summaryPests' : 'coverage.summary', {
                    count: activeConditions.length,
                    parts: parts.map((p) => partName(p)).join(', '),
                  })}
                </p>
              </div>
              {parts.map((part) => (
                <div key={part} className="space-y-1.5">
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                    <span aria-hidden className="text-sm">
                      {partEmoji(part, activeCrop.name)}
                    </span>
                    {partName(part)}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {activeConditions
                      .filter((c) => c.part === part)
                      .map((c) => (
                        <span
                          key={c.className}
                          className={cn(
                            'inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs',
                            c.isHealthy
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                              : c.isPest
                                ? 'border-orange-200 bg-orange-50 text-orange-800'
                                : 'border-border bg-muted/60 text-slate-700'
                          )}
                        >
                          {c.isPest && <span aria-hidden>{pestEmoji(c.className)}</span>}
                          {c.isHealthy ? t('common.healthy') : condition(c.label)}
                        </span>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CategoryPill({
  active,
  onClick,
  label,
  count,
  icon,
  title,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count?: number;
  icon?: React.ReactNode;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-pressed={active}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
        active ? 'bg-slate-900 text-white' : 'bg-muted text-slate-700 hover:bg-emerald-50 hover:text-emerald-800'
      )}
    >
      {icon}
      {label}
      {count !== undefined && (
        <span className={cn('tabular-nums', active ? 'text-slate-300' : 'text-slate-400')}>{count}</span>
      )}
    </button>
  );
}
