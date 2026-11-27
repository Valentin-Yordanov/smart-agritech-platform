'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sprout,
  LayoutDashboard,
  ScanLine,
  MessageSquareText,
  MapPin,
  Users,
  BookOpen,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { cn } from 'cn';
import { useAuth } from '@/context/auth-context';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { LanguageSwitcher } from '@/components/layout/language-switcher';
import { useI18n } from '@/i18n/language-provider';
import type { MessageKey } from '@/i18n/messages';

const NAV_ITEMS: { href: string; labelKey: MessageKey; icon: typeof Sprout }[] = [
  { href: '/dashboard', labelKey: 'nav.overview', icon: LayoutDashboard },
  { href: '/scan', labelKey: 'nav.scanner', icon: ScanLine },
  { href: '/advisor', labelKey: 'nav.advisor', icon: MessageSquareText },
  { href: '/outbreaks', labelKey: 'nav.outbreaks', icon: MapPin },
  { href: '/community', labelKey: 'nav.community', icon: Users },
  { href: '/knowledge', labelKey: 'nav.knowledge', icon: BookOpen },
];

function TopNavbarInner() {
  const pathname = usePathname();
  const { user, isLoading, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useI18n();

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-card/85 backdrop-blur supports-backdrop-filter:bg-card/70">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        {/* Brand */}
        <Link
          href="/"
          onClick={() => setMobileOpen(false)}
          className="flex shrink-0 items-center gap-2"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700">
            <Sprout className="h-4 w-4" />
          </div>
          <span className="text-sm font-bold tracking-tight text-slate-900">
            Smart AgriTech
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 lg:flex">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium whitespace-nowrap transition-colors xl:px-2.5',
                  active
                    ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {t(item.labelKey)}
              </Link>
            );
          })}
        </nav>

        {/* Desktop User / Auth Controls */}
        <div className="hidden items-center gap-2 lg:flex">
          <LanguageSwitcher />
          {isLoading ? (
            <Skeleton className="h-7 w-32 rounded-md" />
          ) : user ? (
            <>
              <div className="hidden items-center gap-2 rounded-md border border-border bg-muted/60 px-2.5 py-1 xl:flex">
                <span className="max-w-40 truncate text-xs font-medium text-slate-700">
                  {user.email}
                </span>
                <Badge
                  variant="outline"
                  className="border-slate-300 bg-card px-1.5 py-0 text-[10px] font-semibold text-slate-700"
                >
                  {user.role}
                </Badge>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={logout}
                className="h-7 gap-1.5 px-2.5 text-xs text-slate-700"
              >
                <LogOut className="h-3.5 w-3.5" />
                {t('nav.logout')}
              </Button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ variant: 'ghost', size: 'sm' }),
                  'h-7 px-2.5 text-xs'
                )}
              >
                {t('nav.signIn')}
              </Link>
              <Link
                href="/register"
                className={cn(
                  buttonVariants({ size: 'sm' }),
                  'h-7 bg-emerald-700 px-3 text-xs text-white hover:bg-emerald-800'
                )}
              >
                {t('nav.register')}
              </Link>
            </>
          )}
        </div>

        {/* Mobile controls */}
        <div className="flex items-center gap-2 lg:hidden">
        <LanguageSwitcher />
        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label={t('nav.toggleMenu')}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-slate-700 hover:bg-slate-100"
        >
          {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="border-t border-border bg-card px-4 py-3 lg:hidden">
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium',
                    active
                      ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                      : 'text-slate-700 hover:bg-slate-100'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {t(item.labelKey)}
                </Link>
              );
            })}
          </nav>

          <div className="mt-3 border-t border-border pt-3">
            {isLoading ? (
              <Skeleton className="h-9 w-full rounded-md" />
            ) : user ? (
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-slate-900">
                    {user.email}
                  </p>
                  <p className="text-[11px] text-slate-500">{user.role}</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setMobileOpen(false);
                    void logout();
                  }}
                  className="gap-1.5 text-xs"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  {t('nav.logout')}
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    buttonVariants({ variant: 'outline', size: 'sm' }),
                    'flex-1'
                  )}
                >
                  {t('nav.signIn')}
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    buttonVariants({ size: 'sm' }),
                    'flex-1 bg-emerald-700 text-white hover:bg-emerald-800'
                  )}
                >
                  {t('nav.register')}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export function TopNavbar() {
  return (
    <Suspense
      fallback={
        <header className="h-14 border-b border-border bg-card px-4">
          <div className="mx-auto flex h-full max-w-6xl items-center justify-between">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-7 w-40" />
          </div>
        </header>
      }
    >
      <TopNavbarInner />
    </Suspense>
  );
}
