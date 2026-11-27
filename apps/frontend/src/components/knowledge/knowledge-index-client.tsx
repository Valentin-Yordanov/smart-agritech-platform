'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { Search, ArrowRight, AlertTriangle, X, Eye, BookOpen } from 'lucide-react';
import { cn } from 'cn';
import { AgronomyGuide, CROP_GROUPS, CropGroup, getCropGroup, PathogenCategory } from '@/data/knowledge-base';
import { cropEmoji, PATHOGEN_EMOJI } from '@/data/crop-emoji';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { localizeGuide } from '@/i18n/knowledge';
import { useI18n } from '@/i18n/language-provider';

interface KnowledgeIndexClientProps {
  guides: AgronomyGuide[];
}

const GROUPS: Array<'All' | CropGroup> = ['All', ...CROP_GROUPS];

const ISSUES: Array<'Any' | PathogenCategory> = ['Any', 'Fungal', 'Oomycete', 'Bacterial / Pest', 'Viral'];

const RISKS: Array<'Any' | AgronomyGuide['severityRisk']> = ['Any', 'Critical', 'High', 'Moderate'];

const ALL_CROPS = 'all';

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const i = text.toLowerCase().indexOf(query);
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className="rounded-sm bg-amber-100 px-0.5 text-inherit">{text.slice(i, i + query.length)}</mark>
      {text.slice(i + query.length)}
    </>
  );
}

// Label on its own column so wrapped chips line up under each other instead of under the label
function FilterRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[3.25rem_minmax(0,1fr)] items-start gap-2">
      <span className="pt-1 text-xs font-medium text-slate-500">{label}</span>
      <div className="flex min-w-0 flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs leading-none font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:outline-none',
        active ? 'border-slate-900 bg-slate-900 text-white' : 'border-border bg-card text-slate-600 hover:border-slate-400'
      )}
    >
      {children}
    </button>
  );
}

export function KnowledgeIndexClient({ guides }: KnowledgeIndexClientProps) {
  const { t, tr, lang, crop: cropName } = useI18n();
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<(typeof GROUPS)[number]>('All');
  const [selectedIssue, setSelectedIssue] = useState<(typeof ISSUES)[number]>('Any');
  const [selectedRisk, setSelectedRisk] = useState<(typeof RISKS)[number]>('Any');
  const [selectedCrop, setSelectedCrop] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // "/" focuses the search box, Escape clears it
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
      if (e.key === '/' && !typing) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Crops in the active group, with how many guides each has
  const crops = useMemo(() => {
    const counts = new Map<string, number>();
    for (const g of guides) {
      if (selectedGroup !== 'All' && getCropGroup(g) !== selectedGroup) continue;
      counts.set(g.hostCrop, (counts.get(g.hostCrop) ?? 0) + 1);
    }
    return [...counts.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [guides, selectedGroup]);

  const groupCounts = useMemo(() => {
    const counts: Record<string, number> = { All: guides.length };
    for (const g of guides) counts[getCropGroup(g)] = (counts[getCropGroup(g)] ?? 0) + 1;
    return counts;
  }, [guides]);

  const q = search.trim().toLowerCase();

  const localizedBySlug = useMemo(
    () => new Map(guides.map((g) => [g.slug, localizeGuide(g, lang)])),
    [guides, lang]
  );

  const filteredGuides = useMemo(() => {
    return guides.filter((guide) => {
      if (selectedGroup !== 'All' && getCropGroup(guide) !== selectedGroup) return false;
      if (selectedIssue !== 'Any' && guide.pathogenType !== selectedIssue) return false;
      if (selectedRisk !== 'Any' && guide.severityRisk !== selectedRisk) return false;
      if (selectedCrop && guide.hostCrop !== selectedCrop) return false;
      if (!q) return true;
      const view = localizedBySlug.get(guide.slug) ?? guide;
      return (
        view.title.toLowerCase().includes(q) ||
        view.hostCrop.toLowerCase().includes(q) ||
        view.scientificName.toLowerCase().includes(q) ||
        view.summary.toLowerCase().includes(q) ||
        view.symptomsChecklist.some((s) => s.toLowerCase().includes(q))
      );
    });
  }, [guides, q, selectedGroup, selectedIssue, selectedRisk, selectedCrop, localizedBySlug]);

  const hasFilters = q || selectedGroup !== 'All' || selectedIssue !== 'Any' || selectedRisk !== 'Any' || selectedCrop;

  const resetFilters = () => {
    setSearch('');
    setSelectedGroup('All');
    setSelectedIssue('Any');
    setSelectedRisk('Any');
    setSelectedCrop(null);
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter Controls */}
      <div className="surface z-10 space-y-3 p-3 sm:p-4 md:sticky md:top-16">
        <div className="flex flex-col gap-2.5 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Escape' && setSearch('')}
              placeholder={t('kb.searchPlaceholder')}
              title={t('kb.searchTitle')}
              className="h-9 truncate pr-8 pl-9 sm:pr-10"
              aria-label={t('kb.searchLabel')}
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label={t('kb.clearSearch')}
                className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            ) : (
              <kbd className="pointer-events-none absolute top-1/2 right-2.5 hidden -translate-y-1/2 rounded border border-border bg-muted px-1.5 font-mono text-[10px] text-slate-500 sm:block">
                /
              </kbd>
            )}
          </div>

          <Select
            value={selectedCrop ?? ALL_CROPS}
            onValueChange={(value) => setSelectedCrop(!value || value === ALL_CROPS ? null : String(value))}
          >
            <SelectTrigger aria-label={t('kb.filterCrop')} className="w-full min-w-0 bg-card data-[size=default]:h-9 sm:w-52">
              <SelectValue>
                {(value: string) =>
                  value === ALL_CROPS || !value ? (
                    <span className="truncate">🌱 {t('kb.allCrops')}</span>
                  ) : (
                    <span className="truncate">
                      {cropEmoji(value)} {cropName(value)}
                    </span>
                  )
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_CROPS}>
                <span aria-hidden>🌱</span>
                {t('kb.allCrops')}
                <span className="ml-auto text-xs text-slate-400 tabular-nums">{crops.reduce((n, [, c]) => n + c, 0)}</span>
              </SelectItem>
              {crops.map(([crop, count]) => (
                <SelectItem key={crop} value={crop}>
                  <span aria-hidden>{cropEmoji(crop)}</span>
                  {cropName(crop)}
                  <span className="ml-auto text-xs text-slate-400 tabular-nums">{count}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {GROUPS.map((group) => {
            const active = selectedGroup === group;
            return (
              <button
                key={group}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setSelectedGroup(group);
                  setSelectedCrop(null);
                }}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:outline-none',
                  active ? 'bg-emerald-600 text-white' : 'bg-muted text-slate-700 hover:bg-emerald-50 hover:text-emerald-800'
                )}
              >
                {group === 'All' ? t('kb.all') : tr(`kb.group.${group}`, group)}
                <span className={cn('tabular-nums', active ? 'text-emerald-100' : 'text-slate-400')}>
                  {groupCounts[group] ?? 0}
                </span>
              </button>
            );
          })}
        </div>

        <div className="grid gap-2 border-t border-border/80 pt-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-6">
          <FilterRow label={t('kb.filterIssue')}>
            {ISSUES.map((issue) => (
              <Chip key={issue} active={selectedIssue === issue} onClick={() => setSelectedIssue(issue)}>
                {issue !== 'Any' && <span aria-hidden>{PATHOGEN_EMOJI[issue]}</span>}
                {issue === 'Any' ? t('kb.any') : tr(`kb.type.${issue}`, issue)}
              </Chip>
            ))}
          </FilterRow>
          <FilterRow label={t('kb.filterRisk')}>
            {RISKS.map((risk) => (
              <Chip key={risk} active={selectedRisk === risk} onClick={() => setSelectedRisk(risk)}>
                {risk === 'Any' ? t('kb.any') : tr(`kb.risk.${risk}`, risk)}
              </Chip>
            ))}
          </FilterRow>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500" aria-live="polite">
        <span>
          {t('kb.showing', { shown: filteredGuides.length, total: guides.length })}
          {selectedCrop && (
            <>
              {' '}
              {t('kb.showingFor', { crop: cropName(selectedCrop) })}
            </>
          )}
        </span>
        {hasFilters && (
          <button type="button" onClick={resetFilters} className="font-semibold text-emerald-700 hover:text-emerald-800">
            {t('kb.clearFilters')}
          </button>
        )}
      </div>

      {/* Guide Cards Grid */}
      {filteredGuides.length === 0 ? (
        <Card className="border-border py-12 text-center">
          <CardContent className="space-y-3">
            <p className="text-base font-semibold text-slate-800">{t('kb.noMatch')}</p>
            <p className="text-sm text-balance text-slate-500">
              {t('kb.noMatchHint')}
            </p>
            <Button type="button" variant="outline" size="sm" onClick={resetFilters}>
              {t('kb.resetFilters')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredGuides.map((sourceGuide, i) => {
            const guide = localizedBySlug.get(sourceGuide.slug) ?? sourceGuide;
            return (
            <Link
              key={guide.slug}
              href={`/knowledge/${guide.slug}`}
              className="group animate-in fade-in slide-in-from-bottom-1 block h-full min-w-0 fill-mode-both duration-300"
              style={{ animationDelay: `${Math.min(i, 8) * 30}ms` }}
            >
              <Card className="lift flex h-full min-w-0 flex-col border-border group-hover:border-emerald-300">
                <CardHeader className="min-w-0 space-y-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      aria-hidden
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-2xl transition-transform group-hover:scale-110"
                    >
                      {cropEmoji(guide.hostCrop)}
                    </span>
                    <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-1.5">
                      <Badge
                        variant="outline"
                        className="border-emerald-200 bg-emerald-50 text-[11px] font-semibold text-emerald-800"
                      >
                        {guide.hostCrop}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[11px] font-semibold',
                          guide.severityRisk === 'Critical'
                            ? 'border-red-200 bg-red-50 text-red-700'
                            : guide.severityRisk === 'High'
                              ? 'border-amber-200 bg-amber-50 text-amber-800'
                              : 'border-border bg-slate-100 text-slate-700'
                        )}
                      >
                        <AlertTriangle className="mr-1 h-3 w-3" />
                        {t('kb.riskTag', { level: tr(`kb.risk.${sourceGuide.severityRisk}`, sourceGuide.severityRisk) })}
                      </Badge>
                    </div>
                  </div>

                  <CardTitle className="text-lg leading-snug break-words text-slate-900 transition-colors group-hover:text-emerald-700">
                    <Highlight text={guide.title} query={q} />
                  </CardTitle>
                  <p className="text-xs font-medium break-words text-slate-500">
                    <span className="italic">
                      <Highlight text={guide.scientificName} query={q} />
                    </span>{' '}
                    &middot;{' '}
                    <span className="whitespace-nowrap">
                      {PATHOGEN_EMOJI[guide.pathogenType]} {tr(`kb.type.${guide.pathogenType}`, guide.pathogenType)}
                    </span>
                  </p>
                </CardHeader>

                <CardContent className="min-w-0 flex-1 space-y-3">
                  <CardDescription className="line-clamp-3 text-sm leading-relaxed break-words text-slate-600">
                    <Highlight text={guide.summary} query={q} />
                  </CardDescription>
                  <div className="flex min-w-0 items-start gap-2 rounded-lg bg-muted/60 p-2.5 text-xs leading-relaxed text-slate-700">
                    <Eye className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                    <span className="min-w-0 break-words">
                      <span className="font-semibold">{t('kb.lookFor')} </span>
                      <Highlight text={guide.symptomsChecklist[0] ?? ''} query={q} />
                    </span>
                  </div>
                </CardContent>

                <CardFooter className="flex-wrap justify-between gap-2 border-t border-border/80 pt-3 text-xs font-semibold text-emerald-700">
                  <span className="font-medium text-slate-500">
                    {tr(`kb.group.${getCropGroup(sourceGuide)}`, getCropGroup(sourceGuide))}
                  </span>
                  <span className="inline-flex items-center gap-1.5 transition-transform group-hover:translate-x-0.5">
                    {t('kb.openGuide')}
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </CardFooter>
              </Card>
            </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function KnowledgeHeader() {
  const { t } = useI18n();

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 uppercase">
        <BookOpen className="h-3.5 w-3.5" />
        {t('kb.eyebrow')}
      </div>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">{t('kb.title')}</h1>
      <p className="mt-1.5 max-w-2xl text-sm text-slate-600">{t('kb.intro')}</p>
    </div>
  );
}
