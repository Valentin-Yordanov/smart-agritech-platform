'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Camera,
  ScanSearch,
  Microscope,
  Gauge,
  MessageSquareText,
  Pause,
  Play,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from 'cn';
import { MODEL_INFO } from '@/lib/platform-info';
import { useI18n } from '@/i18n/language-provider';
import type { MessageKey } from '@/i18n/messages';

// Numbers recorded from a real run of the v2 pipeline on the bundled banana sample (laptop CPU)
const RUN = {
  image: '/samples/banana_leaf_sigatoka.jpg',
  detection: { label: 'leaf', confidence: 0.908, ms: 45 },
  classification: { species: 'Banana', disease: 'Sigatoka', confidence: 0.998, ms: 16 },
  totalMs: 61,
};

const THRESHOLD_PCT = Math.round(MODEL_INFO.confidenceThreshold * 100);

const STEPS: { icon: typeof Camera; titleKey: MessageKey; summaryKey: MessageKey; detailKey: MessageKey }[] = [
  { icon: Camera, titleKey: 'pipeline.step1.title', summaryKey: 'pipeline.step1.summary', detailKey: 'pipeline.step1.detail' },
  { icon: ScanSearch, titleKey: 'pipeline.step2.title', summaryKey: 'pipeline.step2.summary', detailKey: 'pipeline.step2.detail' },
  { icon: Microscope, titleKey: 'pipeline.step3.title', summaryKey: 'pipeline.step3.summary', detailKey: 'pipeline.step3.detail' },
  { icon: Gauge, titleKey: 'pipeline.step4.title', summaryKey: 'pipeline.step4.summary', detailKey: 'pipeline.step4.detail' },
  { icon: MessageSquareText, titleKey: 'pipeline.step5.title', summaryKey: 'pipeline.step5.summary', detailKey: 'pipeline.step5.detail' },
];

export function PipelineWalkthrough() {
  const { t, crop, condition, part } = useI18n();
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => setStep((s) => (s + 1) % STEPS.length), 3800);
    return () => clearTimeout(t);
  }, [playing, step]);

  const go = (i: number) => {
    setPlaying(false);
    setStep((i + STEPS.length) % STEPS.length);
  };

  const current = STEPS[step];
  const vars = {
    detector: MODEL_INFO.detector,
    classifier: MODEL_INFO.classifier,
    classes: MODEL_INFO.classCount,
    percent: THRESHOLD_PCT,
    ms: RUN.classification.ms,
    species: crop(RUN.classification.species),
    disease: condition(RUN.classification.disease),
  };
  const detectorClasses = MODEL_INFO.detectorClasses.map((c) => part(c)).join(', ');
  const textFor = (key: MessageKey) =>
    key === 'pipeline.step2.summary'
      ? t(key, { detector: MODEL_INFO.detector, classes: detectorClasses })
      : key === 'pipeline.step2.detail'
        ? t(key, { percent: (RUN.detection.confidence * 100).toFixed(0), ms: RUN.detection.ms })
        : t(key, vars);

  return (
    <div className="surface grid overflow-hidden lg:grid-cols-[1.1fr_1fr]">
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-900">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={RUN.image} alt={t('pipeline.sampleAlt')} className="h-full w-full object-cover" />

        {step === 0 && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="animate-scan-sweep h-1/3 w-full bg-gradient-to-b from-transparent via-emerald-300/40 to-transparent" />
          </div>
        )}

        {step >= 1 && (
          <div className="animate-in fade-in zoom-in-95 absolute inset-2 rounded-md border-2 border-emerald-400 duration-300">
            <span className="absolute -top-px -left-px rounded-br-md bg-emerald-500 px-2 py-0.5 text-[11px] font-semibold text-white">
              {part(RUN.detection.label)} {(RUN.detection.confidence * 100).toFixed(0)}%
            </span>
          </div>
        )}

        {step >= 2 && (
          <div className="animate-in fade-in slide-in-from-bottom-2 absolute right-4 bottom-4 left-4 rounded-lg bg-white/95 p-3 shadow-lg backdrop-blur duration-300">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">{t('pipeline.diagnosis')}</p>
                <p className="text-sm font-bold text-slate-900">
                  {crop(RUN.classification.species)} · {condition(RUN.classification.disease)}
                </p>
              </div>
              <span className="text-lg font-bold text-emerald-700 tabular-nums">
                {(RUN.classification.confidence * 100).toFixed(1)}%
              </span>
            </div>
            {step >= 3 && (
              <div className="animate-in fade-in mt-2.5 duration-300">
                <div className="relative h-2 rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                    style={{ width: `${RUN.classification.confidence * 100}%` }}
                  />
                  <div className="absolute -top-1 h-4 w-0.5 bg-slate-900" style={{ left: `${THRESHOLD_PCT}%` }} />
                </div>
                <p className="mt-1 text-[11px] text-slate-600">
                  {t('pipeline.passes', { percent: THRESHOLD_PCT, ms: RUN.totalMs })}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col p-5 md:p-6">
        <ol className="space-y-1">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const active = i === step;
            return (
              <li key={s.titleKey}>
                <button
                  type="button"
                  onClick={() => go(i)}
                  aria-current={active ? 'step' : undefined}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors',
                    active ? 'bg-emerald-50' : 'hover:bg-muted'
                  )}
                >
                  <span
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition-colors',
                      active
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : i < step
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-border bg-card text-slate-400'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className={cn('block text-sm font-semibold', active ? 'text-emerald-900' : 'text-slate-800')}>
                      {i + 1}. {t(s.titleKey)}
                    </span>
                    <span className="block truncate text-xs text-slate-500">{textFor(s.summaryKey)}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        <p key={step} className="animate-in fade-in mt-4 min-h-16 text-sm leading-relaxed text-slate-600 duration-300">
          {textFor(current.detailKey)}
        </p>

        <div className="mt-auto flex items-center justify-between gap-2 pt-4">
          <div className="flex items-center gap-1">
            <IconButton label={t('pipeline.previous')} onClick={() => go(step - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </IconButton>
            <IconButton label={playing ? t('pipeline.pause') : t('pipeline.play')} onClick={() => setPlaying((p) => !p)}>
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </IconButton>
            <IconButton label={t('pipeline.next')} onClick={() => go(step + 1)}>
              <ChevronRight className="h-4 w-4" />
            </IconButton>
          </div>
          <Link href="/scan" className="text-xs font-semibold text-emerald-700 hover:text-emerald-800">
            {t('pipeline.trySample')}
          </Link>
        </div>
        <p className="mt-3 text-[11px] text-slate-400">
          {t('pipeline.footnote')}
        </p>
      </div>
    </div>
  );
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card text-slate-700 transition-colors hover:border-emerald-300 hover:text-emerald-700"
    >
      {children}
    </button>
  );
}
