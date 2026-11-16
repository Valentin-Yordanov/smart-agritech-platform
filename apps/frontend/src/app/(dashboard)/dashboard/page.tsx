'use client';

import Link from 'next/link';
import {
  ScanLine,
  MessageSquareText,
  MapPin,
  Users,
  BookOpen,
  ArrowRight,
} from 'lucide-react';
import { cn } from 'cn';
import { useAuth } from '@/context/auth-context';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';

export default function DashboardOverviewPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Clean Welcome Header */}
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-6 sm:flex-row sm:items-center">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Welcome back{user?.fullName ? `, ${user.fullName.split(' ')[0]}` : ''}
          </h1>
          <p className="text-sm text-slate-600">
            Upload leaf imagery for YOLOv11 + MobileNetV4 diagnostics or consult
            the ChromaDB-backed AI agronomist.
          </p>
        </div>
        <Link
          href="/scan"
          className={cn(
            buttonVariants({ size: 'default' }),
            'shrink-0 bg-emerald-700 text-white hover:bg-emerald-800'
          )}
        >
          <ScanLine className="mr-2 h-4 w-4" />
          New Leaf Scan
        </Link>
      </div>

      {/* Quick Action Modules */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-slate-200 bg-white">
          <CardHeader className="pb-3">
            <ScanLine className="h-5 w-5 text-emerald-700" />
            <CardTitle className="pt-2 text-base">AI Scanner</CardTitle>
            <CardDescription>
              Detect leaf lesions and classify crop diseases with offline WASM
              support.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/scan"
              className={cn(buttonVariants({ variant: 'outline' }), 'w-full')}
            >
              Open Studio <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white">
          <CardHeader className="pb-3">
            <MessageSquareText className="h-5 w-5 text-emerald-700" />
            <CardTitle className="pt-2 text-base">RAG Advisor</CardTitle>
            <CardDescription>
              Clinical IPM recommendations grounded in verified agronomy guides.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/advisor"
              className={cn(buttonVariants({ variant: 'outline' }), 'w-full')}
            >
              Start Consultation <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white">
          <CardHeader className="pb-3">
            <MapPin className="h-5 w-5 text-emerald-700" />
            <CardTitle className="pt-2 text-base">Outbreak Map</CardTitle>
            <CardDescription>
              Geospatial tracking of regional pathogen alerts across fields.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/outbreaks"
              className={cn(buttonVariants({ variant: 'outline' }), 'w-full')}
            >
              View Radar <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white">
          <CardHeader className="pb-3">
            <Users className="h-5 w-5 text-emerald-700" />
            <CardTitle className="pt-2 text-base">Community Hub</CardTitle>
            <CardDescription>
              Exchange field reports and treatment strategies with fellow growers.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/community"
              className={cn(buttonVariants({ variant: 'outline' }), 'w-full')}
            >
              Browse Forum <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white">
          <CardHeader className="pb-3">
            <BookOpen className="h-5 w-5 text-emerald-700" />
            <CardTitle className="pt-2 text-base">Knowledge Base</CardTitle>
            <CardDescription>
              Reference symptom checklists and FRAC/IRAC fungicide rotations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/knowledge"
              className={cn(buttonVariants({ variant: 'outline' }), 'w-full')}
            >
              Read Guides <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
