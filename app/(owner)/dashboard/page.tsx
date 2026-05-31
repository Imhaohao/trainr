import Link from 'next/link';
import { getDb } from '@/lib/contracts/db';
import { IDS } from '@/lib/mocks/fixtures';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui';

// Phase 0 scaffold: reads the active DB (mock/Local) directly server-side and
// renders the demo business + program. Phase 1 wires the live generate trigger,
// status poll, inline module editing, and the employee roster.
export default async function DashboardPage() {
  const db = getDb();
  // Demo: default to the seeded business. Phase 1 resolves this from the session.
  const business = await db.businesses.get(IDS.business);
  const programs = business
    ? await db.programs.list({ businessId: business.id })
    : [];
  const program = programs[0];

  if (!business) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted">
          No business yet.{' '}
          <Link href="/onboarding" className="text-accent underline">
            Start the intake
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{business.name}</h1>
          <p className="text-muted">
            {business.industry} · {business.state} · {business.employeeCount}{' '}
            employees
          </p>
        </div>
        <Badge tone={business.status === 'published' ? 'success' : 'brand'}>
          {business.status}
        </Badge>
      </div>

      {/* Join code */}
      <Card>
        <CardHeader>
          <CardTitle>Employee join code</CardTitle>
          <CardDescription>
            Share this with your team so they can sign in — no password needed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <span className="rounded-[var(--radius)] bg-brand-soft px-5 py-3 text-2xl font-bold tracking-widest">
              {business.joinCode}
            </span>
            <span className="text-sm text-muted">
              Employees enter this at <code>/join</code>.
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Program */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Training program</CardTitle>
              <CardDescription>
                {program
                  ? `Version ${program.version} · ${program.modules.length} modules · ${program.status}`
                  : 'Not generated yet.'}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Link href="/compliance">
                <Button variant="outline" size="sm">
                  Compliance
                </Button>
              </Link>
              <Link href="/deploy">
                <Button size="sm">Publish</Button>
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {program ? (
            <ul className="divide-y divide-border">
              {program.modules
                .slice()
                .sort((a, b) => a.order - b.order)
                .map((mod) => (
                  <li
                    key={mod.id}
                    className="flex items-center justify-between py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted">{mod.order}.</span>
                      <span className="font-medium">{mod.title}</span>
                      <Badge tone="neutral">{mod.type}</Badge>
                    </div>
                    {mod.quiz && (
                      <span className="text-xs text-muted">
                        {mod.quiz.questions.length} quiz Q
                      </span>
                    )}
                  </li>
                ))}
            </ul>
          ) : (
            <Button>Generate training program</Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
