'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Sprout, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from 'cn';
import { useAuth } from '@/context/auth-context';
import { ApiError } from '@/lib/api';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await login({ email, password });
      toast.success('Welcome back to Smart AgriTech');
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Invalid email or password';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md space-y-4">
        <Link
          href="/"
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'sm' }),
            'gap-1.5 text-slate-600 hover:text-slate-900'
          )}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <Card className="border-slate-200 bg-white">
          <CardHeader className="space-y-2 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700">
              <Sprout className="h-5 w-5" />
            </div>
            <CardTitle className="text-xl font-bold text-slate-900">
              Sign in to Smart AgriTech
            </CardTitle>
            <CardDescription>
              Access AI leaf diagnostics, RAG advisory, and outbreak maps
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="valentin@agritech.local"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 pt-2">
              <Button
                type="submit"
                className="w-full bg-emerald-700 text-white hover:bg-emerald-800"
                disabled={submitting}
              >
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {submitting ? 'Signing in...' : 'Sign In'}
              </Button>
              <p className="text-center text-sm text-slate-600">
                Don&apos;t have an account?{' '}
                <Link
                  href="/register"
                  className="font-semibold text-emerald-700 hover:underline"
                >
                  Create one
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
