import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';

// Nav shell only — Track 4 replaces this page with the compliance dashboard.
export default function CompliancePlaceholderPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Compliance</CardTitle>
        <CardDescription>Coming soon — Track 4</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted">
        This page will show applied laws, provenance, and compliance status after
        the pipeline runs. Use the API stub{' '}
        <code className="rounded bg-brand-soft px-1">
          GET /api/compliance-report/:businessId
        </code>{' '}
        until then.
      </CardContent>
    </Card>
  );
}
