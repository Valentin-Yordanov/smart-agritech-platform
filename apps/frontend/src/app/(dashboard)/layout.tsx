import { TopNavbar } from '@/components/layout/top-navbar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <TopNavbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:py-8">
        {children}
      </main>
    </div>
  );
}
