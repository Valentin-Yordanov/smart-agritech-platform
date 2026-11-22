'use client';

import Link from 'next/link';
import {
  Cpu,
  Bot,
  MapPin,
  ArrowRight,
  BookOpen,
  ScanLine,
  LayoutDashboard,
} from 'lucide-react';
import { cn } from 'cn';
import { useAuth } from '@/context/auth-context';
import { TopNavbar } from '@/components/layout/top-navbar';
import { buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function LandingPage() {
  const { user, isLoading } = useAuth();

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <TopNavbar />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12 md:py-20">
        {/* Hero */}
        <section className="rounded-xl border border-slate-200 bg-white p-8 md:p-12">
          <div className="max-w-2xl space-y-4">
            <p className="text-xs font-semibold tracking-wider text-emerald-700 uppercase">
              Smart AgriTech Platform
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
              Plant Pathology Diagnostics &amp; Agronomic Advisory
            </h1>
            <p className="text-base leading-relaxed text-slate-600">
              Detect crop pathologies &amp; foliar lesions with YOLOv11 &amp; MobileNetV4 ONNX inference,
              consult the ChromaDB-backed AI agronomist, and monitor regional
              crop outbreaks.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              {isLoading ? (
                <Skeleton className="h-10 w-64 rounded-md" />
              ) : user ? (
                <>
                  <Link
                    href="/dashboard"
                    className={cn(
                      buttonVariants({ size: 'lg' }),
                      'bg-emerald-700 text-white hover:bg-emerald-800'
                    )}
                  >
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Go to Dashboard
                  </Link>
                  <Link
                    href="/scan"
                    className={cn(
                      buttonVariants({ size: 'lg', variant: 'outline' }),
                      'border-slate-300 bg-white text-slate-800 hover:bg-slate-100'
                    )}
                  >
                    <ScanLine className="mr-2 h-4 w-4" />
                    Launch AI Scanner
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className={cn(
                      buttonVariants({ size: 'lg' }),
                      'bg-emerald-700 text-white hover:bg-emerald-800'
                    )}
                  >
                    Login <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                  <Link
                    href="/register"
                    className={cn(
                      buttonVariants({ size: 'lg', variant: 'outline' }),
                      'border-slate-300 bg-white text-slate-800 hover:bg-slate-100'
                    )}
                  >
                    Register
                  </Link>
                </>
              )}

              <Link
                href="/knowledge"
                className={cn(
                  buttonVariants({ size: 'lg', variant: 'outline' }),
                  'border-slate-300 bg-white text-slate-800 hover:bg-slate-100'
                )}
              >
                <BookOpen className="mr-2 h-4 w-4" />
                Browse Knowledge Base
              </Link>
            </div>
          </div>
        </section>

        {/* Feature Overview */}
        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <Cpu className="mb-3 h-5 w-5 text-emerald-700" />
            <h2 className="text-base font-semibold text-slate-900">
              Dual-Stage ONNX Inference
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
              YOLOv11 localizes foliage, stems &amp; pests while MobileNetV4 classifies
              pathogens, with in-browser WebAssembly fallback for offline fields.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <Bot className="mb-3 h-5 w-5 text-emerald-700" />
            <h2 className="text-base font-semibold text-slate-900">
              Diagnosis-Linked RAG Advisor
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
              Link any scan directly to an AI agronomy consultation backed by
              ChromaDB retrieval and FRAC/IRAC guidelines.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <MapPin className="mb-3 h-5 w-5 text-emerald-700" />
            <h2 className="text-base font-semibold text-slate-900">
              PostGIS Outbreak Radar
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
              Geotagged detections populate an OpenStreetMap radar so growers
              can track active regional threats.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
