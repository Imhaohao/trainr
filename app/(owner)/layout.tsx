import Link from 'next/link';
import { OwnerNav } from '@/components/owner/OwnerNav';

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1">
      {/* Sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card p-4 md:flex">
        <Link href="/" className="mb-6 px-3 font-semibold">
          🍋 Trainr.ai
        </Link>
        <OwnerNav />
        <div className="mt-auto px-3 pt-6 text-xs text-muted">
          Owner workspace
        </div>
      </aside>

      {/* Content */}
      <div className="flex flex-1 flex-col">
        {/* Mobile top nav */}
        <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3 md:hidden">
          <Link href="/" className="font-semibold">
            🍋 Trainr.ai
          </Link>
        </header>
        <main className="flex-1 px-6 py-8">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
