'use client';

import { Globe } from 'lucide-react';
import { cn } from 'cn';
import { useI18n } from '@/i18n/language-provider';

// One button that flips the language. It shows the language you will switch to.
export function LanguageSwitcher({ className }: { className?: string }) {
  const { lang, setLang, t } = useI18n();
  const target = lang === 'bg' ? 'en' : 'bg';

  return (
    <button
      type="button"
      onClick={() => setLang(target)}
      aria-label={t('lang.switchTo')}
      title={t('lang.switchTo')}
      lang={target}
      className={cn(
        'inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md border border-border bg-card px-2 text-xs font-semibold text-slate-700 transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800',
        className
      )}
    >
      <Globe className="h-3.5 w-3.5 text-emerald-600" />
      {target === 'bg' ? 'БГ' : 'EN'}
    </button>
  );
}
