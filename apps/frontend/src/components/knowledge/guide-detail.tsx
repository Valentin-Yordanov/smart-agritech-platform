'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  ScanLine,
  Sprout,
  FlaskConical,
  Leaf,
  ShieldCheck,
  ThermometerSun,
  MessageSquareText,
  AlertTriangle,
  Eye,
  ChevronDown,
  Microscope,
  Clock,
  Info,
} from 'lucide-react';
import { cn } from 'cn';
import { getCropGroup, type AgronomyGuide } from '@/data/knowledge-base';
import { diseaseFromTitle, localizeGuide } from '@/i18n/knowledge';
import { useI18n } from '@/i18n/language-provider';
import type { MessageKey } from '@/i18n/messages';
import { cropEmoji, PATHOGEN_EMOJI } from '@/data/crop-emoji';
import { TopNavbar } from '@/components/layout/top-navbar';
import { SiteFooter } from '@/components/layout/site-footer';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';

const SECTIONS = [
  { id: 'symptoms', labelKey: 'kb.sec.symptoms', icon: Eye },
  { id: 'treatment', labelKey: 'kb.sec.treatment', icon: FlaskConical },
  { id: 'prevention', labelKey: 'kb.sec.prevention', icon: ShieldCheck },
] as const satisfies readonly { id: string; labelKey: MessageKey; icon: typeof Eye }[];

const RISK_STYLES = {
  Critical: 'border-red-200 bg-red-50 text-red-700',
  High: 'border-amber-200 bg-amber-50 text-amber-800',
  Moderate: 'border-border bg-muted text-slate-700',
} as const;

// Collapsible section built on <details>, so it works without client JS
function GuideSection({
  id,
  icon: Icon,
  title,
  subtitle,
  count,
  children,
}: {
  id: string;
  icon: typeof Eye;
  title: string;
  subtitle: string;
  count: number;
  children: ReactNode;
}) {
  return (
    <details id={id} open className="surface group scroll-mt-24 overflow-hidden">
      <summary className="flex cursor-pointer list-none items-center gap-3 p-5 select-none hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none [&::-webkit-details-marker]:hidden">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
          <Icon className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2 text-base font-semibold text-slate-900">
            {title}
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-slate-600 tabular-nums">
              {count}
            </span>
          </span>
          <span className="block text-xs text-slate-500">{subtitle}</span>
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
      </summary>
      <div className="border-t border-border/80 p-5">{children}</div>
    </details>
  );
}

function StepList({ items, tone = 'emerald' }: { items: string[]; tone?: 'emerald' | 'slate' }) {
  return (
    <ol className="space-y-2.5">
      {items.map((item, i) => (
        <li key={item} className="flex items-start gap-3 rounded-lg border border-border/80 bg-background/60 p-3">
          <span
            className={cn(
              'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums',
              tone === 'emerald' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-white'
            )}
          >
            {i + 1}
          </span>
          <span className="pt-0.5 text-sm leading-relaxed text-slate-700">{item}</span>
        </li>
      ))}
    </ol>
  );
}

export function GuideDetail({ guide: sourceGuide, related: sourceRelated }: { guide: AgronomyGuide; related: AgronomyGuide[] }) {
  const { t, tr, lang } = useI18n();
  const guide = localizeGuide(sourceGuide, lang);
  const related = sourceRelated.map((g) => localizeGuide(g, lang));
  const group = tr(`kb.group.${getCropGroup(sourceGuide)}`, getCropGroup(sourceGuide));
  const typeLabel = (g: AgronomyGuide) => tr(`kb.type.${g.pathogenType}`, g.pathogenType);
  const riskLabel = (g: AgronomyGuide) => tr(`kb.risk.${g.severityRisk}`, g.severityRisk);
  const disease = diseaseFromTitle(guide.title);
  const advisorQuestion = t('kb.advisorQuestion', { disease, crop: guide.hostCrop });
  const advisorHref = `/advisor?q=${encodeURIComponent(advisorQuestion)}`;

  return (
    <div className="min-h-screen bg-background">
      <TopNavbar />

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <nav aria-label={t('kb.breadcrumb')} className="flex items-center gap-1.5 text-xs text-slate-500">
          <Link
            href="/knowledge"
            className="inline-flex items-center gap-1 font-medium text-slate-600 hover:text-emerald-700"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t('kb.breadcrumbRoot')}
          </Link>
          <span className="hidden sm:inline">/</span>
          <span className="hidden sm:inline">{group}</span>
          <span className="hidden sm:inline">/</span>
          <span className="hidden truncate font-medium text-slate-800 sm:inline">{guide.title}</span>
        </nav>

        {/* Hero summary with primary actions */}
        <section className="surface space-y-5 p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-emerald-200 bg-emerald-50 font-semibold text-emerald-800">
              <Sprout className="mr-1.5 h-3.5 w-3.5" />
              {guide.hostCrop}
            </Badge>
            <Badge variant="outline" className="border-border bg-muted text-slate-700">
              {group}
            </Badge>
            <Badge variant="outline" className={cn('font-semibold', RISK_STYLES[guide.severityRisk])}>
              <AlertTriangle className="mr-1.5 h-3.5 w-3.5" />
              {t('kb.riskLower', { level: riskLabel(guide) })}
            </Badge>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="space-y-2">
              <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                <span aria-hidden className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-muted text-3xl">
                  {cropEmoji(guide.hostCrop)}
                </span>
                {guide.title}
              </h1>
              <p className="text-sm font-medium text-slate-500 italic">{guide.scientificName}</p>
              <p className="max-w-3xl text-sm leading-relaxed text-slate-700 md:text-base">{guide.summary}</p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <Link href="/scan" className={cn(buttonVariants(), 'gap-2 bg-emerald-700 text-white hover:bg-emerald-800')}>
                <ScanLine className="h-4 w-4" />
                {t('kb.scanPlant')}
              </Link>
              <Link href={advisorHref} className={cn(buttonVariants({ variant: 'outline' }), 'gap-2 bg-card')}>
                <MessageSquareText className="h-4 w-4" />
                {t('kb.askAdvisor')}
              </Link>
            </div>
          </div>

          {/* At-a-glance facts */}
          <dl className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-border/80 bg-background/60 p-3">
              <dt className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                <Microscope className="h-3.5 w-3.5" /> {t('kb.pathogenType')}
              </dt>
              <dd className="mt-1 text-sm font-semibold text-slate-900">
                <span aria-hidden className="mr-1">{PATHOGEN_EMOJI[guide.pathogenType]}</span>
                {typeLabel(guide)}
              </dd>
            </div>
            <div className="rounded-lg border border-border/80 bg-background/60 p-3">
              <dt className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                <Eye className="h-3.5 w-3.5" /> {t('kb.firstSign')}
              </dt>
              <dd className="mt-1 line-clamp-2 text-sm font-medium text-slate-900">{guide.symptomsChecklist[0]}</dd>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3">
              <dt className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-amber-800 uppercase">
                <ThermometerSun className="h-3.5 w-3.5" /> {t('kb.favouredBy')}
              </dt>
              <dd className="mt-1 text-sm font-medium text-amber-950">{guide.optimalConditions}</dd>
            </div>
          </dl>
        </section>

        <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
          {/* Jump navigation: pills on mobile, sticky sidebar on desktop */}
          <nav aria-label={t('kb.onThisPage')} className="lg:sticky lg:top-20 lg:self-start">
            <p className="mb-2 hidden text-[11px] font-semibold tracking-wide text-slate-500 uppercase lg:block">
              {t('kb.onThisPage')}
            </p>
            <ul className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-1 lg:overflow-visible">
              {SECTIONS.map(({ id, labelKey, icon: Icon }) => (
                <li key={id} className="shrink-0">
                  <a
                    href={`#${id}`}
                    className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:border-emerald-300 hover:text-emerald-800 lg:rounded-lg lg:border-transparent lg:bg-transparent lg:text-sm lg:hover:bg-card"
                  >
                    <Icon className="h-4 w-4 text-emerald-600" />
                    {t(labelKey)}
                  </a>
                </li>
              ))}
            </ul>
            <Link
              href="/knowledge"
              className="mt-4 hidden items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-700 lg:inline-flex"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> {t('kb.allGuides')}
            </Link>
          </nav>

          <div className="min-w-0 space-y-4">
            <GuideSection
              id="symptoms"
              icon={Eye}
              title={t('kb.symptomsTitle')}
              subtitle={t('kb.symptomsSub')}
              count={guide.symptomsChecklist.length}
            >
              <ul className="grid gap-2.5 sm:grid-cols-2">
                {guide.symptomsChecklist.map((symptom) => (
                  <li
                    key={symptom}
                    className="flex items-start gap-2.5 rounded-lg border border-border/80 bg-background/60 p-3 text-sm text-slate-700"
                  >
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                    {symptom}
                  </li>
                ))}
              </ul>
            </GuideSection>

            <GuideSection
              id="treatment"
              icon={FlaskConical}
              title={t('kb.treatmentTitle')}
              subtitle={t('kb.treatmentSub')}
              count={guide.biologicalControls.length + guide.chemicalProtocols.length}
            >
              <div className="space-y-5">
                <div className="space-y-2.5">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <Leaf className="h-4 w-4 text-emerald-600" />
                    {t('kb.bioControls')}
                  </h3>
                  <StepList items={guide.biologicalControls} />
                </div>

                <div className="space-y-2.5">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <FlaskConical className="h-4 w-4 text-emerald-600" />
                    {t('kb.chemRotation')}
                  </h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    {guide.chemicalProtocols.map((chem, i) => (
                      <div key={chem.activeIngredient} className="rounded-lg border border-border/80 bg-background/60 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-semibold text-slate-900">
                            <span className="mr-1.5 text-slate-400 tabular-nums">{i + 1}.</span>
                            {chem.activeIngredient}
                          </p>
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-slate-600">
                            <Clock className="h-3 w-3" />
                            {t('kb.phi', { value: chem.phiDays })}
                          </span>
                        </div>
                        <Badge
                          variant="outline"
                          className="mt-2 border-emerald-200 bg-emerald-50 text-[11px] text-emerald-800"
                        >
                          {chem.fracIracGroup}
                        </Badge>
                        <p className="mt-2 text-sm leading-relaxed text-slate-600">{chem.notes}</p>
                      </div>
                    ))}
                  </div>
                  <p className="flex items-start gap-2 text-xs text-slate-500">
                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {t('kb.phiNote')}
                  </p>
                </div>
              </div>
            </GuideSection>

            <GuideSection
              id="prevention"
              icon={ShieldCheck}
              title={t('kb.preventionTitle')}
              subtitle={t('kb.preventionSub')}
              count={guide.culturalPractices.length}
            >
              <StepList items={guide.culturalPractices} tone="slate" />
            </GuideSection>

            {/* Bottom CTA */}
            <div className="flex flex-col justify-between gap-4 rounded-xl border border-emerald-200 bg-emerald-50/60 p-5 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-base font-bold text-slate-900">{t('kb.suspect', { disease })}</h2>
                <p className="text-sm text-slate-600">
                  {t('kb.suspectText')}
                </p>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <Link href="/scan" className={cn(buttonVariants(), 'gap-2 bg-emerald-700 text-white hover:bg-emerald-800')}>
                  <ScanLine className="h-4 w-4" />
                  {t('kb.scanNow')}
                </Link>
                <Link href={advisorHref} className={cn(buttonVariants({ variant: 'outline' }), 'gap-2 bg-card')}>
                  <MessageSquareText className="h-4 w-4" />
                  {t('kb.askAdvisorShort')}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-900">{t('kb.related')}</h2>
            <div className="grid gap-3 md:grid-cols-3">
              {related.map((g) => (
                <Link
                  key={g.slug}
                  href={`/knowledge/${g.slug}`}
                  className="surface lift group flex items-center justify-between gap-3 p-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900 group-hover:text-emerald-700">
                      <span aria-hidden className="mr-1.5">{cropEmoji(g.hostCrop)}</span>
                      {g.title}
                    </p>
                    <p className="text-xs text-slate-500">
                      {typeLabel(g)} · {t('kb.riskLower', { level: riskLabel(g) })}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-600" />
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
