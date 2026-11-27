import { Skeleton } from '@/components/ui/skeleton';

export default function KnowledgeLoading() {
  return (
    <div className="min-h-screen bg-background" aria-busy="true" aria-label="Loading">
      <div className="h-14 border-b border-border/80 bg-card" />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <div className="surface space-y-3 p-6">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-8 w-80 max-w-full" />
          <Skeleton className="h-4 w-full max-w-xl" />
        </div>
        <Skeleton className="h-24 rounded-xl" />
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="surface space-y-3 p-5">
              <div className="flex justify-between">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-5 w-24 rounded-full" />
              </div>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-16 w-full" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
