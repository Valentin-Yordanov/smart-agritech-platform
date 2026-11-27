'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sprout, Loader2, ArrowLeft, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from 'cn';
import { useAuth } from '@/context/auth-context';
import { ApiError } from '@/lib/api';
import { safeCallbackUrl } from '@/lib/safe-redirect';
import { useI18n } from '@/i18n/language-provider';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordStrength, isStrongPassword } from '@/components/auth/password-strength';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function RegisterPage() {
  const { user, register } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // If already logged in, redirect immediately away from register
  useEffect(() => {
    if (user) {
      const params = new URLSearchParams(window.location.search);
      const callbackUrl = params.get('callbackUrl');
      const destination = safeCallbackUrl(callbackUrl);
      router.replace(destination);
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || !isStrongPassword(password)) return;
    setSubmitting(true);
    setErrors([]);
    try {
      await register({ fullName: fullName.trim(), email: email.trim(), password });
      toast.success(t('auth.register.success'));
    } catch (err) {
      // Show every field message the API returned instead of one generic toast
      const raw = err instanceof ApiError ? (err.data as { message?: unknown } | undefined)?.message : undefined;
      const list = Array.isArray(raw) ? raw.map(String) : [err instanceof ApiError ? err.message : t('auth.register.failed')];
      setErrors(list);
      toast.error(list[0] ?? t('auth.register.failed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-4">
        <Link
          href="/"
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'sm' }),
            'gap-1.5 text-slate-600 hover:text-slate-900'
          )}
        >
          <ArrowLeft className="h-4 w-4" />
          {t('auth.backHome')}
        </Link>

        <Card className="border-border bg-card">
          <CardHeader className="space-y-2 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700">
              <Sprout className="h-5 w-5" />
            </div>
            <CardTitle className="text-xl font-bold text-slate-900">
              {t('auth.register.title')}
            </CardTitle>
            <CardDescription>
              {t('auth.register.description')}
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {errors.length > 0 && (
                <div role="alert" className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-semibold">{t('auth.register.fixErrors')}</p>
                    <ul className="mt-1 list-disc space-y-0.5 pl-4">
                      {errors.map((message) => (
                        <li key={message}>{message}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="fullName">{t('auth.fullName')}</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Valentin Yordanov"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={submitting}
                  autoComplete="name"
                  minLength={2}
                  maxLength={80}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">{t('auth.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="valentin@agritech.local"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting}
                  autoComplete="email"
                  maxLength={254}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">{t('auth.password')}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={t('auth.register.passwordPlaceholder')}
                  minLength={10}
                  maxLength={72}
                  autoComplete="new-password"
                  aria-describedby="password-rules"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting}
                  required
                />
                <PasswordStrength id="password-rules" password={password} />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 pt-2">
              <Button
                type="submit"
                className="w-full bg-emerald-700 text-white hover:bg-emerald-800"
                disabled={submitting || !isStrongPassword(password)}
              >
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {submitting ? t('auth.register.submitting') : t('auth.register.submit')}
              </Button>
              <p className="text-center text-sm text-slate-600">
                {t('auth.register.already')}{' '}
                <Link
                  href="/login"
                  className="font-semibold text-emerald-700 hover:underline"
                >
                  {t('auth.register.signIn')}
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
