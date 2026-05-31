import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui';
import type { OpseraGovernanceSummary } from '@/lib/opsera/static-summary';
import { OpseraScanStatusBadge } from './status-badge';

function formatTimestamp(iso: string) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso));
}

const severityClass: Record<string, string> = {
  critical: 'text-danger',
  high: 'text-danger',
  medium: 'text-warning',
  low: 'text-muted-foreground',
  info: 'text-muted-foreground',
};

export function OpseraGovernancePanel({
  summary,
}: {
  summary: OpseraGovernanceSummary;
}) {
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Platform security &amp; governance</h2>
          <p className="text-sm text-muted-foreground">{summary.tagline}</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{summary.provider}</span>
          <span aria-hidden>·</span>
          <OpseraScanStatusBadge status={summary.overallStatus} />
          <span aria-hidden>·</span>
          <time dateTime={summary.lastAuditAt}>
            {formatTimestamp(summary.lastAuditAt)}
          </time>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {summary.scans.map((scan) => (
          <Card key={scan.id} className="shadow-none">
            <CardHeader className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base">{scan.title}</CardTitle>
                <OpseraScanStatusBadge status={scan.status} />
              </div>
              <CardDescription>{scan.framework}</CardDescription>
              <p className="text-sm font-medium text-foreground">{scan.headline}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-relaxed text-muted-foreground">
                {scan.summary}
              </p>
              <dl className="grid grid-cols-3 gap-2 rounded-md border border-border bg-stone-50/80 p-3">
                {scan.metrics.map((metric) => (
                  <div key={metric.label}>
                    <dt className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      {metric.label}
                    </dt>
                    <dd className="text-sm font-semibold">{metric.value}</dd>
                  </div>
                ))}
              </dl>
              {scan.findings.length > 0 && (
                <ul className="space-y-2 border-t border-border pt-3">
                  {scan.findings.map((finding) => (
                    <li key={finding.id} className="text-xs leading-relaxed">
                      <span className="font-mono text-muted-foreground">
                        {finding.id}
                      </span>{' '}
                      <span className={severityClass[finding.severity]}>
                        [{finding.severity}]
                      </span>{' '}
                      {finding.title}
                      <span className="text-muted-foreground">
                        {' '}
                        — {finding.status}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-[11px] text-muted-foreground">
                Scanned {formatTimestamp(scan.scannedAt)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
