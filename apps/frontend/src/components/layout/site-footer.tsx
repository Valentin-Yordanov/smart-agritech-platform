'use client';

import Link from 'next/link';
import { Sprout, Cpu, WifiOff, Layers, FileText, ScanLine, MessageSquareText, MapPin, BookOpen } from 'lucide-react';
import { MODEL_INFO, CREDITS_FILES } from '@/lib/platform-info';
import { useI18n } from '@/i18n/language-provider';
import type { MessageKey } from '@/i18n/messages';

const PLATFORM_LINKS: { href: string; labelKey: MessageKey; icon: typeof ScanLine }[] = [
  { href: '/scan', labelKey: 'nav.scanner', icon: ScanLine },
  { href: '/advisor', labelKey: 'footer.advisor', icon: MessageSquareText },
  { href: '/outbreaks', labelKey: 'footer.outbreakMap', icon: MapPin },
  { href: '/knowledge', labelKey: 'footer.encyclopedia', icon: BookOpen },
];

export function SiteFooter() {
  const { t } = useI18n();

  const modelFacts = [
    {
      icon: Cpu,
      text: t('footer.modelLine', {
        detector: MODEL_INFO.detector,
        classifier: MODEL_INFO.classifier,
        version: MODEL_INFO.version,
      }),
    },
    {
      icon: Layers,
      text: t('footer.cropsClasses', { crops: MODEL_INFO.cropCount, classes: MODEL_INFO.classCount }),
    },
    { icon: WifiOff, text: t('footer.offlineWasm') },
  ];

  return (
    <footer className="mt-16 border-t border-border/80 bg-card/70">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700">
              <Sprout className="h-4 w-4" />
            </span>
            <span className="text-sm font-bold tracking-tight text-slate-900">Smart AgriTech</span>
          </Link>
          <p className="max-w-xs text-sm leading-relaxed text-slate-600">{t('footer.tagline')}</p>
        </div>

        <FooterColumn title={t('footer.platform')}>
          {PLATFORM_LINKS.map(({ href, labelKey, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                className="group inline-flex items-center gap-2 text-sm text-slate-600 transition-colors hover:text-emerald-700"
              >
                <Icon className="h-3.5 w-3.5 text-slate-400 transition-colors group-hover:text-emerald-600" />
                {t(labelKey)}
              </Link>
            </li>
          ))}
        </FooterColumn>

        <FooterColumn title={t('footer.architecture')}>
          {modelFacts.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-start gap-2 text-sm text-slate-600">
              <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
              {text}
            </li>
          ))}
          <li className="text-xs text-slate-500">
            {t('footer.certaintyNote', { percent: Math.round(MODEL_INFO.confidenceThreshold * 100) })}
          </li>
        </FooterColumn>

        <FooterColumn title={t('footer.dataCredits')}>
          <li className="text-sm leading-relaxed text-slate-600">{t('footer.dataCreditsBody')}</li>
          {CREDITS_FILES.map(({ href, label }) => (
            <li key={href}>
              <a
                href={href}
                download
                className="inline-flex items-center gap-2 font-mono text-xs text-slate-600 transition-colors hover:text-emerald-700"
              >
                <FileText className="h-3.5 w-3.5 text-slate-400" />
                {label}
              </a>
            </li>
          ))}
        </FooterColumn>
      </div>

      <div className="border-t border-border/80">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>{t('footer.copyright', { version: MODEL_INFO.version })}</span>
          <span>{t('footer.disclaimer')}</span>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-3 text-xs font-semibold tracking-wider text-slate-900 uppercase">{title}</h2>
      <ul className="space-y-2.5">{children}</ul>
    </div>
  );
}
