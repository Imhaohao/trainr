import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui';
import { resolveModuleLabels } from '@/lib/compliance/report';
import type { AppliedLaw } from '@/types';
import { AppliedLawStatusBadge } from './status-badge';

export function AppliedLawCard({
  law,
  moduleTitles,
}: {
  law: AppliedLaw;
  moduleTitles: Record<string, string>;
}) {
  const modules = resolveModuleLabels(law.moduleIds, moduleTitles);

  return (
    <Card className="flex h-full flex-col shadow-none">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="space-y-1">
            <p className="font-mono text-xs text-muted-foreground">{law.code}</p>
            <CardTitle className="text-base leading-snug">{law.title}</CardTitle>
          </div>
          <AppliedLawStatusBadge status={law.status} />
        </div>
        <CardDescription className="text-sm leading-relaxed text-foreground/80">
          {law.rationale}
        </CardDescription>
      </CardHeader>
      <CardContent className="mt-auto space-y-2 pt-0">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Training coverage
        </p>
        {modules.length === 0 ? (
          <p className="text-sm text-warning">
            No module linked — owner action required before publish.
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {modules.map((mod) => (
              <li key={mod.id}>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center rounded-full border border-border bg-brand-soft px-2.5 py-1 text-xs font-medium text-brand-foreground transition hover:border-accent/40 hover:bg-teal-50"
                  title={`Module ID: ${mod.id}`}
                >
                  {mod.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
