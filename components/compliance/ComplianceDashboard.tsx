import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';
import type { ComplianceReport } from '@/lib/compliance/report';
import { AppliedLawCard } from './AppliedLawCard';
import { ComplianceHeader } from './ComplianceHeader';
import { OpseraGovernancePanel } from './OpseraGovernancePanel';
import { PublishTrainingButton } from './PublishTrainingButton';

function formatTimestamp(iso: string) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso));
}

export function ComplianceDashboard({
  report,
  businessName,
}: {
  report: ComplianceReport;
  businessName: string;
}) {
  const { snapshot, moduleTitles, history } = report;

  return (
    <div className="space-y-8">
      <ComplianceHeader snapshot={snapshot} businessName={businessName} />

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Applied laws</h2>
            <p className="text-sm text-muted-foreground">
              Each requirement includes status, rationale, and linked training
              modules.
            </p>
          </div>
          <PublishTrainingButton
            businessId={snapshot.businessId}
            version={snapshot.programVersion}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {report.laws.map((law) => (
            <AppliedLawCard
              key={law.code}
              law={law}
              moduleTitles={moduleTitles}
            />
          ))}
        </div>
      </section>

      <OpseraGovernancePanel summary={report.opsera} />

      {history.length > 1 && (
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Snapshot history</CardTitle>
            <CardDescription>
              Prior compliance snapshots for this business.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border text-sm">
              {history.map((entry) => (
                <li
                  key={entry.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-2 first:pt-0 last:pb-0"
                >
                  <span className="font-medium">
                    Program v{entry.programVersion}
                  </span>
                  <time
                    className="text-muted-foreground"
                    dateTime={entry.generatedAt}
                  >
                    {formatTimestamp(entry.generatedAt)}
                  </time>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
