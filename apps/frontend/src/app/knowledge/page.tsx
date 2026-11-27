import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { KNOWLEDGE_GUIDES } from '@/data/knowledge-base';
import { KnowledgeHeader, KnowledgeIndexClient } from '@/components/knowledge/knowledge-index-client';
import { TopNavbar } from '@/components/layout/top-navbar';
import { SiteFooter } from '@/components/layout/site-footer';
import { LANGUAGE_COOKIE } from '@/i18n/config';
import { messages } from '@/i18n/messages';

export async function generateMetadata(): Promise<Metadata> {
  const index = (await cookies()).get(LANGUAGE_COOKIE)?.value === 'bg' ? 1 : 0;
  return {
    title: messages['kb.metaTitle'][index],
    description: messages['kb.metaDescription'][index],
  };
}

export default function KnowledgeBasePage() {
  return (
    <div className="min-h-screen bg-background">
      <TopNavbar />

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <KnowledgeHeader />
        <KnowledgeIndexClient guides={KNOWLEDGE_GUIDES} />
      </main>
      <SiteFooter />
    </div>
  );
}
