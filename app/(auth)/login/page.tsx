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
import { GoogleButton } from '@/components/auth/GoogleButton';

const OAUTH_ERRORS: Record<string, string> = {
  google_unconfigured: 'Google sign-in isn’t configured yet.',
  google_denied: 'Google sign-in was cancelled.',
  google_state: 'Your sign-in session expired. Please try again.',
  google_failed: 'Couldn’t sign in with Google. Please try again.',
};

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('error');
    if (code) setError(OAUTH_ERRORS[code] ?? 'Sign-in failed. Please try again.');
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: form.get('email'),
        password: form.get('password'),
      }),
    });
    const json = await res.json();
    setLoading(false);
    if (!json.ok) {
      setError(json.error ?? 'Login failed');
      return;
    }
    router.push('/dashboard');
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>Log in to your Trainr account.</CardDescription>
      </CardHeader>
      <CardContent>
        <GoogleButton />
        <div className="my-4 flex items-center gap-3 text-xs text-muted">
          <span className="h-px flex-1 bg-border" />
          or
          <span className="h-px flex-1 bg-border" />
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" />
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Logging in…' : 'Log in'}
          </Button>
        </form>
        <p className="mt-3 text-center text-xs text-muted">
          Demo: <code>xiao@happylemon-demo.com</code> / <code>demo1234</code>
        </p>
        <p className="mt-4 text-center text-sm text-muted">
          New here?{' '}
          <Link href="/signup" className="font-medium text-accent underline">
            Create a business account
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
