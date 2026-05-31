'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from '@/components/ui';

export default function EmployeeJoinPage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const res = await fetch('/api/auth/employee/join', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        joinCode: String(form.get('joinCode') ?? '').toUpperCase(),
        name: form.get('name'),
      }),
    });
    const json = await res.json();
    setLoading(false);
    if (!json.ok) {
      setError(json.error ?? 'Could not join — check your code');
      return;
    }
    // Employee area is owned by T3; route there once it exists.
    router.push('/learn');
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Join your team</CardTitle>
        <CardDescription>
          Enter the code your manager gave you — no password needed.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="joinCode">Join code</Label>
            <Input
              id="joinCode"
              name="joinCode"
              placeholder="e.g. HLEMON"
              autoCapitalize="characters"
              className="uppercase tracking-widest"
              required
            />
          </div>
          <div>
            <Label htmlFor="name">Your name</Label>
            <Input id="name" name="name" required />
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Joining…' : 'Join'}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted">
          Are you the owner?{' '}
          <Link href="/signup" className="font-medium text-accent underline">
            Create a business account
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
