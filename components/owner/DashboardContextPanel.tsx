'use client';

import Link from 'next/link';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui';
import { DirectContextImport } from '@/components/owner/DirectContextImport';
import type { ContextSource } from '@/types';

interface DashboardContextPanelProps {
  businessId: string;
  contextSources?: ContextSource[];
  hasProgram: boolean;
}

export function DashboardContextPanel({
  businessId,
  contextSources = [],
  hasProgram,
}: DashboardContextPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Training context</CardTitle>
        <CardDescription>
          Add PDFs, Word docs (.docx), or Google Docs anytime — parsed text
          feeds the next program generation. Your address and website on file
          drive automatic industry research via RTRVR.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <DirectContextImport
          businessId={businessId}
          initialSources={contextSources}
          compact
        />
        <div className="flex flex-wrap gap-2 pt-2">
          <Link href="/onboarding">
            <Button variant="outline" size="sm">
              Edit business profile
            </Button>
          </Link>
          {hasProgram && (
            <Link href="/onboarding">
              <Button size="sm">Regenerate program</Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
