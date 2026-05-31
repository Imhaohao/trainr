'use client';

import * as React from 'react';
import { Button } from '@/components/ui';

export function JoinCodeCopy({ code }: { code: string }) {
  const [copied, setCopied] = React.useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      <span className="rounded-lg bg-brand-soft px-5 py-3 text-2xl font-bold tracking-[0.2em] text-brand">
        {code}
      </span>
      <Button type="button" variant="outline" size="sm" onClick={() => void copy()}>
        {copied ? 'Copied' : 'Copy code'}
      </Button>
    </div>
  );
}
