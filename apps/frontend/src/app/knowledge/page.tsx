import { BookOpen } from 'lucide-react';
import { KNOWLEDGE_GUIDES } from '@/data/knowledge-base';
import { KnowledgeIndexClient } from '@/components/knowledge/knowledge-index-client';
import { TopNavbar } from '@/components/layout/top-navbar';

export const metadata = {
  title: 'Crop & Pathology Encyclopedia | Smart AgriTech',
  description:
    'Verified Integrated Pest Management (IPM) protocols, FRAC/IRAC fungicide rotations, and diagnostic symptoms for key regional crops.',
};

export default function KnowledgeBasePage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <TopNavbar />

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 uppercase">
            <BookOpen className="h-3.5 w-3.5" />
            Verified Agronomy Reference
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            Crop &amp; Pathology Knowledge Base
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-slate-600">
            Explore symptom checklists, biological controls, and FRAC/IRAC
            chemical rotation tables grounded in our ChromaDB RAG knowledge
            corpus.
          </p>
        </div>

        <KnowledgeIndexClient guides={KNOWLEDGE_GUIDES} />
      </main>
    </div>
  );
}
