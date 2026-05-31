import { Badge, Card, CardContent } from '@/components/ui';
import type { ComplianceSnapshot } from '@/types';

function formatTimestamp(iso: string) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso));
}

function countByStatus(snapshot: ComplianceSnapshot) {
  const counts = { satisfied: 0, needs_review: 0, flagged: 0 };
  for (const law of snapshot.appliedLaws) {
    counts[law.status] += 1;
  }
  return counts;
}

export function ComplianceHeader({
  snapshot,
  businessName,
}: {
  snapshot: ComplianceSnapshot;
  businessName: string;
}) {
  const counts = countByStatus(snapshot);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Compliance snapshot
          </p>
          <h1 className="text-2xl font-bold">{businessName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Applicable laws mapped to training modules with audit-ready
            rationale and provenance.
          </p>
        </div>
        <Badge tone="brand">Program v{snapshot.programVersion}</Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Laws covered"
          value={String(snapshot.appliedLaws.length)}
          detail={`${counts.satisfied} satisfied · ${counts.needs_review} review · ${counts.flagged} flagged`}
        />
        <StatCard label="State" value={snapshot.state} detail="Jurisdiction" />
        <StatCard
          label="Industry"
          value={snapshot.industry}
          detail="Business classification"
        />
        <StatCard
          label="Generated"
          value={formatTimestamp(snapshot.generatedAt)}
          detail={`Snapshot for program v${snapshot.programVersion}`}
        />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <Card className="shadow-none">
      <CardContent className="space-y-1 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="text-lg font-semibold leading-tight">{value}</p>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}
