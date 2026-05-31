'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/components/ui';

// All owner routes are pre-seeded here in Phase 0 — including /compliance and
// /deploy, which T4 fills in. T4 never edits this file, so no merge conflict.
const NAV: { href: string; label: string; icon: string }[] = [
  { href: '/onboarding', label: 'Intake', icon: '📝' },
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/compliance', label: 'Compliance', icon: '✅' },
  { href: '/deploy', label: 'Deploy', icon: '🚀' },
];

export function OwnerNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = React.useState(false);

  async function signOut() {
    setSigningOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      router.push('/login');
      router.refresh();
    }
  }

  return (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-[var(--radius)] px-3 py-2 text-sm font-medium transition',
              active
                ? 'bg-brand-soft text-brand-foreground'
                : 'text-muted hover:bg-brand-soft hover:text-foreground',
            )}
          >
            <span aria-hidden>{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
      <button
        type="button"
        onClick={signOut}
        disabled={signingOut}
        className={cn(
          'mt-1 flex items-center gap-3 rounded-[var(--radius)] px-3 py-2 text-left text-sm font-medium transition',
          'text-muted hover:bg-brand-soft hover:text-foreground disabled:opacity-50',
        )}
      >
        <span aria-hidden>↩</span>
        {signingOut ? 'Signing out…' : 'Sign out'}
      </button>
    </nav>
  );
}
