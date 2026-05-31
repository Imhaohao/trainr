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

// Post-publish handoff: tells the owner exactly where to send their team and
// the code they'll use. Resolves the absolute /join URL on the client so the
// link is copy-pasteable from whatever host the app is running on.
export function EmployeeHandoffCard({ joinCode }: { joinCode: string }) {
  const [origin, setOrigin] = React.useState('');
  const [copied, setCopied] = React.useState<'url' | 'code' | null>(null);

  React.useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const joinUrl = origin ? `${origin}/join` : '/join';

  async function copy(value: string, which: 'url' | 'code') {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(which);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* clipboard unavailable — values are visible to copy manually */
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span aria-hidden>🎉</span> Done!
        </CardTitle>
        <CardDescription>
          Your training is published. Now get your employees to sign in.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-base">
          Tell your team to sign in through{' '}
          <a
            href={joinUrl}
            className="font-medium text-accent underline underline-offset-2"
          >
            {joinUrl}
          </a>{' '}
          using this code:
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              Sign-in link
            </p>
            <div className="flex items-center gap-2">
              <span className="flex-1 truncate rounded-[var(--radius)] bg-brand-soft px-3 py-2 text-sm">
                {joinUrl}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copy(joinUrl, 'url')}
              >
                {copied === 'url' ? 'Copied!' : 'Copy'}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              Join code
            </p>
            <div className="flex items-center gap-2">
              <span className="flex-1 rounded-[var(--radius)] bg-brand-soft px-3 py-2 text-2xl font-bold tracking-widest">
                {joinCode}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copy(joinCode, 'code')}
              >
                {copied === 'code' ? 'Copied!' : 'Copy'}
              </Button>
            </div>
          </div>
        </div>

        <p className="text-sm text-muted">
          No passwords needed — employees just enter their name and this code.
        </p>
      </CardContent>
    </Card>
  );
}
