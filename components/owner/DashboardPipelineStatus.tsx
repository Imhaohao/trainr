'use client';

import * as React from 'react';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import {
  InfoCard,
  InfoCardAction,
  InfoCardContent,
  InfoCardDescription,
  InfoCardDismiss,
  InfoCardFooter,
  InfoCardTitle,
} from '@/components/ui/info-card';
import { Progress } from '@/components/ui';

const STAGE_LABELS: Record<string, string> = {
  idle: 'Not started',
  research: 'Researching your industry',
  curriculum: 'Building training modules',
  compliance: 'Applying compliance rules',
  assemble: 'Assembling program',
  persist: 'Saving program',
  ready: 'Generation complete',
  error: 'Generation failed',
};

type PipelineStatus = {
  stage: string;
  pct: number;
  programId?: string;
  version?: number;
  error?: string;
};

export function DashboardPipelineStatus({ businessId }: { businessId: string }) {
  const [status, setStatus] = React.useState<PipelineStatus | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function poll() {
      const res = await fetch(`/api/pipeline/${businessId}/status`);
      const json = await res.json();
      if (!cancelled && json.ok) setStatus(json.data);
    }

    void poll();
    const id = setInterval(poll, 4000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [businessId]);

  if (!status) return null;

  const label = STAGE_LABELS[status.stage] ?? status.stage;
  const done = status.stage === 'ready' || status.pct >= 100;
  const failed = status.stage === 'error';

  return (
    <InfoCard
      className={
        failed
          ? 'border-destructive/40 bg-destructive/5'
          : done
            ? 'border-brand/30 bg-brand-soft/40'
            : 'border-border'
      }
    >
      <InfoCardContent>
        <InfoCardTitle>{label}</InfoCardTitle>
        <InfoCardDescription>
          {failed && status.error
            ? status.error
            : done
              ? `Program v${status.version ?? 1} is ready to review and publish.`
              : 'Agents are working — this updates automatically.'}
        </InfoCardDescription>
        {!done && !failed && (
          <Progress value={status.pct} className="mt-3 h-2" />
        )}
        <InfoCardFooter className="pt-2 opacity-100">
          {done ? <InfoCardDismiss>Got it</InfoCardDismiss> : null}
          {done ? (
            <InfoCardAction>
              <Link href="/compliance" className="flex items-center gap-1 underline">
                View compliance <ExternalLink className="size-3" />
              </Link>
            </InfoCardAction>
          ) : null}
        </InfoCardFooter>
      </InfoCardContent>
    </InfoCard>
  );
}
