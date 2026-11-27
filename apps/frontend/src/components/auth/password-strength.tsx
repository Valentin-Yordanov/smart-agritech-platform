'use client';

import { Check, X } from 'lucide-react';
import { cn } from 'cn';
import { useI18n } from '@/i18n/language-provider';

// Mirrors the backend RegisterDto rules so the form never submits a password the API rejects
export const PASSWORD_RULES = [
  { key: 'auth.pw.length', test: (p: string) => p.length >= 10 && p.length <= 72 },
  { key: 'auth.pw.lower', test: (p: string) => /[a-z]/.test(p) },
  { key: 'auth.pw.upper', test: (p: string) => /[A-Z]/.test(p) },
  { key: 'auth.pw.number', test: (p: string) => /\d/.test(p) },
  { key: 'auth.pw.special', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
] as const;

export function isStrongPassword(password: string): boolean {
  return PASSWORD_RULES.every((rule) => rule.test(password));
}

const LEVELS = [
  { key: 'auth.pw.weak', bar: 'bg-red-500', text: 'text-red-700' },
  { key: 'auth.pw.fair', bar: 'bg-amber-500', text: 'text-amber-700' },
  { key: 'auth.pw.good', bar: 'bg-lime-500', text: 'text-lime-700' },
  { key: 'auth.pw.strong', bar: 'bg-emerald-600', text: 'text-emerald-700' },
] as const;

export function PasswordStrength({ password, id }: { password: string; id: string }) {
  const { t } = useI18n();
  const passed = PASSWORD_RULES.filter((rule) => rule.test(password)).length;
  const level = LEVELS[passed >= 5 ? 3 : passed >= 4 ? 2 : passed >= 2 ? 1 : 0];

  return (
    <div id={id} className="space-y-2" aria-live="polite">
      {password && (
        <div className="flex items-center gap-2">
          <div className="flex flex-1 gap-1" aria-hidden>
            {[1, 2, 3, 4, 5].map((step) => (
              <span
                key={step}
                className={cn('h-1.5 flex-1 rounded-full transition-colors', step <= passed ? level.bar : 'bg-muted')}
              />
            ))}
          </div>
          <span className={cn('text-xs font-semibold', level.text)}>{t(level.key)}</span>
        </div>
      )}
      <ul className="grid gap-1 text-xs sm:grid-cols-2">
        {PASSWORD_RULES.map((rule) => {
          const ok = rule.test(password);
          return (
            <li key={rule.key} className={cn('flex items-center gap-1.5', ok ? 'text-emerald-700' : 'text-slate-500')}>
              {ok ? <Check className="h-3.5 w-3.5 shrink-0" /> : <X className="h-3.5 w-3.5 shrink-0 text-slate-400" />}
              {t(rule.key)}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
