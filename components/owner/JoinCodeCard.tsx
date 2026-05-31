'use client';

import * as React from 'react';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui';

export function JoinCodeCard({ joinCode }: { joinCode: string }) {
  const [copied, setCopied] = React.useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(joinCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — the code is visible to type manually */
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Employee join code</CardTitle>
        <CardDescription>
          Share this with your team so they can sign in — no password needed.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-4">
          <span className="rounded-[var(--radius)] bg-brand-soft px-5 py-3 text-2xl font-bold tracking-widest">
            {joinCode}
          </span>
          <Button variant="outline" size="sm" onClick={copy}>
            {copied ? 'Copied!' : 'Copy code'}
          </Button>
          <span className="text-sm text-muted">
            Employees enter this at <code>/join</code>.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
