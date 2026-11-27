'use client';

import Link from 'next/link';
import {
  Cpu,
  Bot,
  MapPin,
  ArrowRight,
  BookOpen,
  ScanLine,
  LayoutDashboard,
  WifiOff,
  Layers,
  Gauge,
  Sprout,
} from 'lucide-react';
import { cn } from 'cn';
import { useAuth } from '@/context/auth-context';
import { TopNavbar } from '@/components/layout/top-navbar';
import { SiteFooter } from '@/components/layout/site-footer';
import { CropCoverageExplorer } from '@/components/landing/crop-coverage-explorer';
import { PipelineWalkthrough } from '@/components/landing/pipeline-walkthrough';
import { buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MODEL_INFO } from '@/lib/platform-info';
import { useI18n } from '@/i18n/language-provider';
import type { MessageKey } from '@/i18n/messages';

const FEATURES: { icon: typeof Cpu; titleKey: MessageKey; textKey: MessageKey }[] = [
  { icon: Cpu, titleKey: 'landing.feature.inferenceTitle', textKey: 'landing.feature.inferenceText' },
  { icon: Bot, titleKey: 'landing.feature.ragTitle', textKey: 'landing.feature.ragText' },
  { icon: MapPin, titleKey: 'landing.feature.mapTitle', textKey: 'landing.feature.mapText' },
];

const secondaryButton = cn(
  buttonVariants({ size: 'lg', variant: 'outline' }),
  'border-border bg-card text-slate-800 hover:border-emerald-300 hover:bg-emerald-50/50'
);
const primaryButton = cn(
  buttonVariants({ size: 'lg' }),
  'bg-emerald-700 text-white shadow-sm shadow-emerald-900/20 hover:bg-emerald-800'
);

export default function LandingPage() {
  const { user, isLoading } = useAuth();
  const { t } = useI18n();

  const stats = [
    { icon: Sprout, value: String(MODEL_INFO.cropCount), label: t('landing.stat.crops') },
    { icon: Layers, value: String(MODEL_INFO.classCount), label: t('landing.stat.classes') },
    { icon: Gauge, value: `${Math.round(MODEL_INFO.confidenceThreshold * 100)}%`, label: t('landing.stat.gate') },
    { icon: WifiOff, value: t('landing.stat.offlineValue'), label: t('landing.stat.offline') },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background text-slate-900">
      <TopNavbar />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 md:py-16">
        {/* Hero */}
        <section className="surface bg-field-grid relative overflow-hidden p-8 md:p-12">
          <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl" />
          <div className="relative max-w-2xl space-y-5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {t('landing.badge', { version: MODEL_INFO.version, crops: MODEL_INFO.cropCount })}
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-5xl md:leading-[1.1]">
              {t('landing.heroTitle')}
            </h1>
            <p className="text-base leading-relaxed text-slate-600 md:text-lg">
              {t('landing.heroText')}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              {isLoading ? (
                <Skeleton className="h-10 w-64 rounded-md" />
              ) : user ? (
                <>
                  <Link href="/dashboard" className={primaryButton}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    {t('landing.goDashboard')}
                  </Link>
                  <Link href="/scan" className={secondaryButton}>
                    <ScanLine className="mr-2 h-4 w-4" />
                    {t('landing.launchScanner')}
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/login" className={primaryButton}>
                    {t('landing.login')} <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                  <Link href="/register" className={secondaryButton}>
                    {t('landing.register')}
                  </Link>
                </>
              )}
              <Link href="/knowledge" className={secondaryButton}>
                <BookOpen className="mr-2 h-4 w-4" />
                {t('landing.browseKnowledge')}
              </Link>
            </div>
          </div>

          <dl className="relative mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
            {stats.map(({ icon: Icon, value, label }) => (
              <div key={label} className="rounded-lg border border-border/80 bg-card/80 p-3.5 backdrop-blur">
                <Icon className="h-4 w-4 text-emerald-700" />
                <dt className="sr-only">{label}</dt>
                <dd className="mt-2 text-xl font-bold tracking-tight text-slate-900 tabular-nums">{value}</dd>
                <dd className="text-xs text-slate-500">{label}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* How it works */}
        <section className="mt-16 space-y-5">
          <SectionHeading
            eyebrow={t('landing.pipelineEyebrow')}
            title={t('landing.pipelineTitle')}
            text={t('landing.pipelineText')}
          />
          <PipelineWalkthrough />
        </section>

        {/* Coverage */}
        <section className="mt-16 space-y-5">
          <SectionHeading
            eyebrow={t('landing.coverageEyebrow')}
            title={t('landing.coverageTitle', { classes: MODEL_INFO.classCount })}
            text={t('landing.coverageText')}
          />
          <CropCoverageExplorer />
        </section>

        {/* Feature Overview */}
        <section className="mt-16 grid gap-4 md:grid-cols-3">
          {FEATURES.map(({ icon: Icon, titleKey, textKey }) => (
            <div key={titleKey} className="surface lift p-6">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                <Icon className="h-4.5 w-4.5" />
              </span>
              <h2 className="mt-4 text-base font-semibold text-slate-900">{t(titleKey)}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                {t(textKey, { detector: MODEL_INFO.detector, classifier: MODEL_INFO.classifier })}
              </p>
            </div>
          ))}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function SectionHeading({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <div className="max-w-2xl">
      <p className="text-xs font-semibold tracking-wider text-emerald-700 uppercase">{eyebrow}</p>
      <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">{title}</h2>
      <p className="mt-1.5 text-sm text-slate-600">{text}</p>
    </div>
  );
}
