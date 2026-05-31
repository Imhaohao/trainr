'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button, Spinner } from '@/components/ui';

interface PublishResult {
  version: number;
  pdfUrls: string[];
  auditId: string;
}

// Runs the governed publish pipeline (validate → PDF → version bump → audit)
// via POST /api/deploy/:businessId/publish, then refreshes the dashboard so
// the new version + status are reflected.
export function PublishTrainingButton({
  businessId,
  version,
}: {
  businessId: string;
  version: number;
}) {
  const router = useRouter();
  const [publishing, setPublishing] = React.useState(false);
  const [result, setResult] = React.useState<PublishResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function publish() {
    setPublishing(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/deploy/${businessId}/publish`, {
        method: 'POST',
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'Publish failed');
      setResult(json.data as PublishResult);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not publish training');
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button size="sm" onClick={publish} disabled={publishing}>
        {publishing ? (
          <span className="flex items-center gap-2">
            <Spinner size={14} />
            Publishing…
          </span>
        ) : (
          'Publish training'
        )}
      </Button>
      {result && (
        <p className="text-xs text-muted-foreground">
          Published program v{result.version}.
        </p>
      )}
      {error && <p className="text-xs text-danger">{error}</p>}
      {!result && !error && !publishing && (
        <p className="text-xs text-muted-foreground">
          Current version v{version}
        </p>
      )}
    </div>
  );
}
