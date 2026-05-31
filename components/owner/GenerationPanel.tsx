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

const TERMINAL_STAGES = new Set(['idle', 'ready', 'error']);

function isActivePipelineStage(stage: string): boolean {
  return !TERMINAL_STAGES.has(stage);
}

// Shown when the business has no program yet, or when the owner wants to
// regenerate. Triggers the pipeline and polls /status until a program exists,
// then refreshes the page to render it.
export function GenerationPanel({
  businessId,
  initialStatus,
  regenerate = false,
}: {
  businessId: string;
  initialStatus: BusinessStatus;
  regenerate?: boolean;
}) {
  const router = useRouter();
  const inProgress = isInFlightBusinessStatus(initialStatus);
  const wasRunningRef = React.useRef(inProgress);
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
        wasRunningRef.current = false;
        setRunning(false);
        setError(data.error ?? 'Generation failed. You can try again.');
        return;
      }
      if (data.stage === 'ready' && data.programId && wasRunningRef.current) {
        wasRunningRef.current = false;
        setRunning(false);
        setError(null);
        router.refresh();
        return;
      }
      if (isActivePipelineStage(data.stage)) {
        wasRunningRef.current = true;
        setRunning(true);
        setError(null);
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
    void poll();
  }, [poll]);

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
    wasRunningRef.current = true;
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
        <CardTitle>{regenerate ? 'Regenerate program' : 'Training program'}</CardTitle>
        <CardDescription>
          {running
            ? regenerate
              ? 'Building a fresh program from your latest intake. This page updates automatically.'
              : 'Your program is being built. This page updates automatically.'
            : regenerate
              ? 'Create a new version from your current intake and uploaded documents.'
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
          <Button onClick={start} variant={regenerate ? 'outline' : 'default'}>
            {initialStatus === 'failed'
              ? 'Retry generation'
              : regenerate
                ? 'Regenerate training program'
                : 'Generate training program'}
          </Button>
        )}
        {error && <p className="text-sm text-danger">{error}</p>}
      </CardContent>
    </Card>
  );
}
