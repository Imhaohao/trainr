import Link from 'next/link';
import { requireOwnerPage } from '@/lib/auth';
import { getDb } from '@/lib/contracts/db';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui';
import { JoinCodeCard } from '@/components/owner/JoinCodeCard';
import { GenerationPanel } from '@/components/owner/GenerationPanel';
import { ProgramReview } from '@/components/owner/ProgramReview';
import type { EmployeeProgress, User } from '@/types';

// Owner dashboard: resolves the owner's business from the session, shows the
// join code, generation status / program review, and the employee roster.
export default async function DashboardPage() {
  const { business } = await requireOwnerPage();

  if (!business) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted">
          You haven&apos;t set up a business yet.{' '}
          <Link href="/onboarding" className="text-accent underline">
            Start the intake
          </Link>
          .
        </p>
      </div>
    );
  }

  const db = getDb();
  const programs = await db.programs.list({ businessId: business.id });
  const program = programs.sort((a, b) => b.version - a.version)[0] ?? null;
  const employees = (await db.users.list({ businessId: business.id })).filter(
    (u) => u.role === 'employee',
  );
  const progress = await db.progress.list({ businessId: business.id });
  const moduleCount = program?.modules.length ?? 0;

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

      <JoinCodeCard joinCode={business.joinCode} />

      {program ? (
        <ProgramReview businessId={business.id} program={program} />
      ) : (
        <GenerationPanel
          businessId={business.id}
          initialStatus={business.status}
        />
      )}

      <EmployeeRoster
        employees={employees}
        progress={progress}
        moduleCount={moduleCount}
      />
    </div>
  );
}

function EmployeeRoster({
  employees,
  progress,
  moduleCount,
}: {
  employees: User[];
  progress: EmployeeProgress[];
  moduleCount: number;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Team</CardTitle>
        <CardDescription>
          {employees.length} employee{employees.length === 1 ? '' : 's'} joined.
          Progress updates as they complete modules.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {employees.length === 0 ? (
          <p className="text-sm text-muted">
            No one has joined yet. Share your join code to get started.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted">
                <th className="pb-2 font-medium">Name</th>
                <th className="pb-2 font-medium">Completed</th>
                <th className="pb-2 font-medium">Certified</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {employees.map((emp) => {
                const rows = progress.filter((p) => p.employeeId === emp.id);
                const completed = rows.filter(
                  (p) => p.status === 'completed',
                ).length;
                const certified = rows.filter((p) => p.certified).length;
                return (
                  <tr key={emp.id}>
                    <td className="py-2 font-medium">{emp.name}</td>
                    <td className="py-2 text-muted">
                      {completed}
                      {moduleCount ? ` / ${moduleCount}` : ''}
                    </td>
                    <td className="py-2 text-muted">{certified}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}
