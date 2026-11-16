import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  ScanLine,
  Sprout,
  CheckCircle2,
  FlaskConical,
  Leaf,
  ShieldCheck,
  ThermometerSun,
  MessageSquareText,
  AlertTriangle,
} from 'lucide-react';
import { cn } from 'cn';
import { getGuideBySlug, KNOWLEDGE_GUIDES } from '@/data/knowledge-base';
import { TopNavbar } from '@/components/layout/top-navbar';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export function generateStaticParams() {
  return KNOWLEDGE_GUIDES.map((guide) => ({
    slug: guide.slug,
  }));
}

export default async function KnowledgeGuideDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);

  if (!guide) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <TopNavbar />

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/knowledge"
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'sm' }),
              'gap-2 text-slate-600 hover:text-slate-900'
            )}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Knowledge Base
          </Link>
        </div>

        {/* Hero Clinical Summary */}
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="border-emerald-200 bg-emerald-50 font-semibold text-emerald-800"
            >
              <Sprout className="mr-1.5 h-3.5 w-3.5" />
              {guide.hostCrop}
            </Badge>
            <Badge
              variant="outline"
              className="border-slate-200 bg-slate-100 text-slate-700"
            >
              {guide.pathogenType}
            </Badge>
            <Badge
              variant="outline"
              className={cn(
                'font-semibold',
                guide.severityRisk === 'Critical'
                  ? 'border-red-200 bg-red-50 text-red-700'
                  : guide.severityRisk === 'High'
                    ? 'border-amber-200 bg-amber-50 text-amber-800'
                    : 'border-slate-200 bg-slate-100 text-slate-700'
              )}
            >
              <AlertTriangle className="mr-1.5 h-3.5 w-3.5" />
              {guide.severityRisk} Yield Risk
            </Badge>
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              {guide.title}
            </h1>
            <p className="mt-1 text-sm font-medium italic text-slate-500">
              Causal Agent: {guide.scientificName}
            </p>
          </div>

          <p className="text-sm leading-relaxed text-slate-700 md:text-base">
            {guide.summary}
          </p>

          <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-950">
            <ThermometerSun className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
            <div>
              <span className="font-semibold">Conducive Microclimate: </span>
              <span>{guide.optimalConditions}</span>
            </div>
          </div>
        </div>

        {/* Symptoms & Biological Controls */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                Visual Symptoms Checklist
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {guide.symptomsChecklist.map((symptom) => (
                  <li
                    key={symptom}
                    className="flex items-start gap-2.5 text-sm text-slate-700"
                  >
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                    <span>{symptom}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Leaf className="h-5 w-5 text-emerald-600" />
                Biological &amp; Organic IPM Controls
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {guide.biologicalControls.map((bio) => (
                  <li
                    key={bio}
                    className="flex items-start gap-2.5 text-sm text-slate-700"
                  >
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                    <span>{bio}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Chemical FRAC/IRAC Rotation Table */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FlaskConical className="h-5 w-5 text-emerald-600" />
              Chemical Control &amp; FRAC/IRAC Resistance Rotation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-slate-100 text-slate-900">
                  <tr>
                    <th className="border-b border-slate-200 px-4 py-2.5 font-semibold">
                      Active Ingredient
                    </th>
                    <th className="border-b border-slate-200 px-4 py-2.5 font-semibold">
                      FRAC / IRAC Group
                    </th>
                    <th className="border-b border-slate-200 px-4 py-2.5 font-semibold">
                      Pre-Harvest Interval
                    </th>
                    <th className="border-b border-slate-200 px-4 py-2.5 font-semibold">
                      Agronomic Notes
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {guide.chemicalProtocols.map((chem) => (
                    <tr
                      key={chem.activeIngredient}
                      className="border-t border-slate-200 bg-white"
                    >
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {chem.activeIngredient}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className="border-emerald-200 bg-emerald-50 text-xs text-emerald-800"
                        >
                          {chem.fracIracGroup}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {chem.phiDays}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{chem.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Preventive Cultural Practices */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              Preventive Cultural &amp; Sanitation Practices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2.5">
              {guide.culturalPractices.map((practice) => (
                <li
                  key={practice}
                  className="flex items-start gap-2.5 text-sm text-slate-700"
                >
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-slate-400" />
                  <span>{practice}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Bottom CTA */}
        <div className="flex flex-col items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-6 sm:flex-row">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Suspect {guide.title.split('—')[1]?.trim() || guide.title} in your
              field?
            </h2>
            <p className="text-sm text-slate-600">
              Run a YOLOv11 + MobileNetV4 scan or consult our RAG agronomist.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/scan"
              className={cn(
                buttonVariants({ size: 'lg' }),
                'bg-emerald-700 text-white hover:bg-emerald-800'
              )}
            >
              <ScanLine className="mr-2 h-4 w-4" />
              Scan Suspected Leaf Now
            </Link>
            <Link
              href="/advisor"
              className={cn(
                buttonVariants({ size: 'lg', variant: 'outline' }),
                'border-slate-300 bg-white text-slate-800 hover:bg-slate-100'
              )}
            >
              <MessageSquareText className="mr-2 h-4 w-4" />
              Ask AI Advisor
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
