import type { Metadata } from 'next';
import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/auth-context';
import { Toaster } from '@/components/ui/sonner';
import { LanguageProvider } from '@/i18n/language-provider';
import { DEFAULT_LANGUAGE, LANGUAGE_COOKIE, isLanguage } from '@/i18n/config';

const inter = Inter({ subsets: ['latin', 'cyrillic'] });

export const metadata: Metadata = {
  title: 'Smart AgriTech | AI Plant Pathology & Agronomy Platform',
  description:
    'Dual-stage ONNX plant pathology diagnostics, RAG agronomic advisory, and regional crop disease outbreak intelligence.',
};

// Reads the language cookie at request time so the server renders the saved language without a hydration mismatch.
async function LanguageShell({ children }: { children: React.ReactNode }) {
  const stored = (await cookies()).get(LANGUAGE_COOKIE)?.value;
  const initialLang = isLanguage(stored) ? stored : DEFAULT_LANGUAGE;

  return (
    <LanguageProvider initialLang={initialLang}>
      <AuthProvider>
        {children}
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </LanguageProvider>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-background text-slate-900 antialiased`}>
        <Suspense fallback={null}>
          <LanguageShell>{children}</LanguageShell>
        </Suspense>
      </body>
    </html>
  );
}
