'use client';

import { Camera, Crop, Focus, Sun, Square, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n/language-provider';
import type { MessageKey } from '@/i18n/messages';

const TIPS: { icon: typeof Crop; titleKey: MessageKey; textKey: MessageKey }[] = [
  { icon: Crop, titleKey: 'uncertain.tip1.title', textKey: 'uncertain.tip1.text' },
  { icon: Sun, titleKey: 'uncertain.tip2.title', textKey: 'uncertain.tip2.text' },
  { icon: Focus, titleKey: 'uncertain.tip3.title', textKey: 'uncertain.tip3.text' },
  { icon: Square, titleKey: 'uncertain.tip4.title', textKey: 'uncertain.tip4.text' },
];

export function UncertainGuidance({ onRetake, onReset }: { onRetake: () => void; onReset: () => void }) {
  const { t } = useI18n();

  return (
    <div className="animate-in fade-in slide-in-from-bottom-1 space-y-4 duration-300">
      <div>
        <p className="text-xs font-semibold tracking-wider text-amber-700 uppercase">{t('uncertain.eyebrow')}</p>
        <h2 className="mt-1 text-lg font-bold text-slate-900">{t('uncertain.title')}</h2>
        <p className="mt-1 text-sm text-slate-600">
          {t('uncertain.text')}
        </p>
      </div>

      <ul className="grid gap-2 sm:grid-cols-2">
        {TIPS.map(({ icon: Icon, titleKey, textKey }) => (
          <li key={titleKey} className="flex items-start gap-2.5 rounded-lg border border-amber-200/70 bg-card p-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber-50 text-amber-700">
              <Icon className="h-3.5 w-3.5" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-slate-900">{t(titleKey)}</span>
              <span className="block text-xs text-slate-600">{t(textKey)}</span>
            </span>
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="button" onClick={onRetake} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
          <Camera className="mr-2 h-4 w-4" />
          {t('uncertain.retake')}
        </Button>
        <Button type="button" variant="outline" onClick={onReset} className="flex-1">
          <RotateCcw className="mr-2 h-4 w-4" />
          {t('uncertain.startOver')}
        </Button>
      </div>
    </div>
  );
}
