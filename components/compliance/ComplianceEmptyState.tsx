import Link from 'next/link';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';

export function ComplianceEmptyState() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Compliance</CardTitle>
        <CardDescription>No snapshot yet</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-muted-foreground">
        <p>
          Run the training pipeline to generate a compliance snapshot with
          applied laws, rationales, and module mappings.
        </p>
        <Link href="/dashboard">
          <Button size="sm">Go to dashboard</Button>
        </Link>
      </CardContent>
    </Card>
  );
}
