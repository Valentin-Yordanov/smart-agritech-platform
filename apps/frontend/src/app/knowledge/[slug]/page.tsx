import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getGuideBySlug, getRelatedGuides, KNOWLEDGE_GUIDES } from '@/data/knowledge-base';
import { GuideDetail } from '@/components/knowledge/guide-detail';
import { Skeleton } from '@/components/ui/skeleton';

export function generateStaticParams() {
  return KNOWLEDGE_GUIDES.map((guide) => ({
    slug: guide.slug,
  }));
}

async function GuideContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);

  if (!guide) {
    notFound();
  }

  return <GuideDetail guide={guide} related={getRelatedGuides(guide)} />;
}

function GuideFallback() {
  return (
    <div className="min-h-screen bg-background" aria-busy="true">
      <div className="h-14 border-b border-border/80 bg-card" />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <Skeleton className="h-4 w-48" />
        <div className="surface space-y-4 p-6 md:p-8">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-9 w-96 max-w-full" />
          <Skeleton className="h-16 w-full max-w-3xl" />
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </main>
    </div>
  );
}

export default function KnowledgeGuideDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense fallback={<GuideFallback />}>
      <GuideContent params={params} />
    </Suspense>
  );
}
