'use client';

import { useEffect, useState } from 'react';
import { Info } from 'lucide-react';
import { cn } from 'cn';
import { MODEL_INFO } from '@/lib/platform-info';
import { useI18n } from '@/i18n/language-provider';
import type { MessageKey } from '@/i18n/messages';

const THRESHOLD = MODEL_INFO.confidenceThreshold;

function tier(confidence: number, uncertain: boolean): {
  labelKey: MessageKey;
  textKey: MessageKey;
  tone: string;
  bar: string;
} {
  if (uncertain || confidence < THRESHOLD) {
    return {
      labelKey: 'conf.below',
      tone: 'text-amber-800 bg-amber-50 border-amber-200',
      bar: 'bg-amber-500',
      textKey: 'conf.belowText',
    };
  }
  if (confidence >= 0.9) {
    return {
      labelKey: 'conf.high',
      tone: 'text-emerald-800 bg-emerald-50 border-emerald-200',
      bar: 'bg-emerald-600',
      textKey: 'conf.highText',
    };
  }
  return {
    labelKey: 'conf.moderate',
    tone: 'text-sky-800 bg-sky-50 border-sky-200',
    bar: 'bg-sky-600',
    textKey: 'conf.moderateText',
  };
}

export function ConfidenceBreakdown({ confidence, uncertain }: { confidence: number; uncertain: boolean }) {
  const { t } = useI18n();
  const [shown, setShown] = useState(0);
  const pct = Math.min(100, Math.max(0, confidence * 100));
  const level = tier(confidence, uncertain);
  const gatePercent = Math.round(THRESHOLD * 100);

  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(pct));
    return () => cancelAnimationFrame(id);
  }, [pct]);

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-slate-700">{t('conf.label')}</span>
        <span className={cn('rounded-full border px-2 py-0.5 text-[11px] font-semibold', level.tone)}>{t(level.labelKey)}</span>
      </div>

      <div className="flex items-end gap-3">
        <span className="text-3xl font-bold tracking-tight text-slate-900 tabular-nums">{pct.toFixed(1)}%</span>
        <span className="pb-1 text-xs text-slate-500">{t('conf.gate', { percent: gatePercent })}</span>
      </div>

      <div className="relative pt-1 pb-4">
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
          <div className={cn('h-full rounded-full transition-[width] duration-700 ease-out', level.bar)} style={{ width: `${shown}%` }} />
        </div>
        <div className="absolute top-0 h-[18px] w-0.5 rounded bg-slate-900" style={{ left: `${THRESHOLD * 100}%` }} />
        <span
          className="absolute top-5 -translate-x-1/2 text-[10px] font-semibold text-slate-600"
          style={{ left: `${THRESHOLD * 100}%` }}
        >
          {THRESHOLD.toFixed(2)}
        </span>
        <span className="absolute top-5 left-0 text-[10px] text-slate-400">0</span>
        <span className="absolute top-5 right-0 text-[10px] text-slate-400">1.0</span>
      </div>

      <p className="flex items-start gap-1.5 text-xs leading-relaxed text-slate-600">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
        {t(level.textKey, { percent: gatePercent })}
      </p>
    </div>
  );
}
