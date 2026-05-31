'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Progress,
  Spinner,
} from '@/components/ui';
import type { BusinessStatus } from '@/types';

interface StatusResponse {
  stage: string;
  pct: number;
  programId?: string;
  error?: string;
}

const STAGE_LABELS: Record<string, string> = {
  research: 'Researching industry standards & compliance…',
  curriculum: 'Generating modules, quizzes & schedule…',
  compliance: 'Applying compliance requirements…',
  assemble: 'Assembling your training program…',
  persist: 'Saving program…',
  ready: 'Ready',
  error: 'Generation failed',
  researching: 'Researching industry standards & compliance…',
  generating: 'Generating modules, quizzes & schedule…',
};

function isInFlightBusinessStatus(status: BusinessStatus): boolean {
  return status === 'researching' || status === 'generating';
}

// Shown when the business has no program yet. Triggers the pipeline and polls
// /status until a program exists, then refreshes the page to render it.
export function GenerationPanel({
  businessId,
  initialStatus,
}: {
  businessId: string;
  initialStatus: BusinessStatus;
}) {
  const router = useRouter();
  const inProgress = isInFlightBusinessStatus(initialStatus);
  const [running, setRunning] = React.useState(inProgress);
  const [stage, setStage] = React.useState<string>(
    inProgress ? initialStatus : 'idle',
  );
  const [pct, setPct] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);

  const applyStatus = React.useCallback(
    (data: StatusResponse) => {
      setStage(data.stage);
      setPct(data.pct);
      if (data.stage === 'error') {
        setRunning(false);
        setError(data.error ?? 'Generation failed. You can try again.');
        return;
      }
      if (data.stage === 'ready' && data.programId) {
        setRunning(false);
        setError(null);
        router.refresh();
      }
    },
    [router],
  );

  const poll = React.useCallback(async () => {
    const res = await fetch(`/api/pipeline/${businessId}/status`, {
      cache: 'no-store',
    });
    const json = await res.json();
    if (!json.ok) return;
    applyStatus(json.data as StatusResponse);
  }, [businessId, applyStatus]);

  React.useEffect(() => {
    if (!running) return;
    void poll();
    const t = setInterval(() => void poll(), 2500);
    return () => clearInterval(t);
  }, [running, poll]);

  // Surface the last pipeline error after a failed run (business.status === failed).
  React.useEffect(() => {
    if (initialStatus !== 'failed') return;
    void poll();
  }, [initialStatus, poll]);

  async function start() {
    setError(null);
    setRunning(true);
    setStage('research');
    setPct(0);
    try {
      const res = await fetch(`/api/pipeline/${businessId}/run`, {
        method: 'POST',
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'Could not start');
      void poll();
    } catch (e) {
      setRunning(false);
      setError(e instanceof Error ? e.message : 'Could not start generation');
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Training program</CardTitle>
        <CardDescription>
          {running
            ? 'Your program is being built. This page updates automatically.'
            : 'Generate a structured, multilingual training program from your intake.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {running ? (
          <>
            <div className="flex items-center gap-2 text-sm text-muted">
              <Spinner size={16} />
              {STAGE_LABELS[stage] ?? 'Working…'}
            </div>
            <Progress value={pct} />
          </>
        ) : (
          <Button onClick={start}>
            {initialStatus === 'failed' ? 'Retry generation' : 'Generate training program'}
          </Button>
        )}
        {error && <p className="text-sm text-danger">{error}</p>}
      </CardContent>
    </Card>
  );
}
