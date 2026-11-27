'use client';

import { Cpu, Gauge, Wifi, WifiOff, FileText } from 'lucide-react';
import { cn } from 'cn';
import { MODEL_INFO, CREDITS_FILES } from '@/lib/platform-info';
import { useOnlineStatus } from '@/lib/use-online-status';
import { useI18n } from '@/i18n/language-provider';

export function DashboardStatusBar() {
  const isOnline = useOnlineStatus();
  const { t } = useI18n();

  return (
    <footer className="border-t border-border/80 bg-card/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-1.5 px-4 py-2 text-[11px] text-slate-500">
        <span className={cn('inline-flex items-center gap-1.5 font-medium', isOnline ? 'text-emerald-700' : 'text-amber-700')}>
          <span className="relative flex h-2 w-2">
            <span
              className={cn(
                'absolute inline-flex h-full w-full animate-ping rounded-full opacity-60',
                isOnline ? 'bg-emerald-400' : 'bg-amber-400'
              )}
            />
            <span className={cn('relative inline-flex h-2 w-2 rounded-full', isOnline ? 'bg-emerald-500' : 'bg-amber-500')} />
          </span>
          {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
          {isOnline ? t('status.online') : t('status.offline')}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Cpu className="h-3 w-3" />
          {t('status.model', {
            detector: MODEL_INFO.detector,
            classifier: MODEL_INFO.classifier,
            version: MODEL_INFO.version,
            classes: MODEL_INFO.classCount,
          })}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Gauge className="h-3 w-3" />
          {t('status.certaintyGate', { percent: Math.round(MODEL_INFO.confidenceThreshold * 100) })}
        </span>
        <a
          href={CREDITS_FILES[0].href}
          download
          className="ml-auto hidden items-center gap-1.5 transition-colors hover:text-emerald-700 sm:inline-flex"
        >
          <FileText className="h-3 w-3" />
          {t('status.dataCredits')}
        </a>
      </div>
    </footer>
  );
}
