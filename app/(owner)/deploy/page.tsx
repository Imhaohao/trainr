import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';

// Nav shell only — Track 4 replaces this page with the publish pipeline UI.
export default function DeployPlaceholderPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Deploy &amp; publish</CardTitle>
        <CardDescription>Coming soon — Track 4</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted">
        This page will run validate → PDF → version bump → audit trail. Use the
        API stub{' '}
        <code className="rounded bg-brand-soft px-1">
          POST /api/deploy/:businessId/publish
        </code>{' '}
        until then.
      </CardContent>
    </Card>
  );
}
