import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getDb } from '@/lib/contracts/db';
import { getSession } from '@/lib/auth/session';
import { Badge } from '@/components/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card';
import {
  DashboardEmployeeRoster,
  type EmployeeRow,
} from '@/components/owner/DashboardEmployeeRoster';
import { DashboardPipelineStatus } from '@/components/owner/DashboardPipelineStatus';
import { DashboardProgramCard } from '@/components/owner/DashboardModulesList';
import { DashboardContextPanel } from '@/components/owner/DashboardContextPanel';
import { JoinCodeCopy } from '@/components/owner/JoinCodeCopy';
import type { EmployeeProgress, User } from '@/types';

function buildEmployeeRows(
  employees: User[],
  progress: EmployeeProgress[],
  totalModules: number,
  rolesById: Map<string, string>,
): EmployeeRow[] {
  return employees.map((employee) => {
    const rows = progress.filter((p) => p.employeeId === employee.id);
    const completed = rows.filter(
      (p) => p.status === 'completed' || p.certified,
    ).length;
    const inProgress = rows.some((p) => p.status === 'in_progress');
    const notStartedOnly = rows.some((p) => p.status === 'not_started');

    return {
      id: employee.id,
      name: employee.name,
      role: rolesById.get(employee.id) ?? 'Team member',
      modulesCompleted: completed,
      totalModules,
      status:
        notStartedOnly && !inProgress && completed === 0
          ? 'needs_support'
          : 'on_track',
    };
  });
}

export default async function DashboardPage() {
  const session = await getSession();
  if (!session || session.role !== 'owner') {
    redirect('/login');
  }

  const db = getDb();
  const user = await db.users.get(session.userId);
  if (!user?.businessId) {
    redirect('/onboarding');
  }

  const business = await db.businesses.get(user.businessId);
  if (!business) {
    redirect('/onboarding');
  }

  const programs = await db.programs.list({ businessId: business.id });
  const program = programs.sort((a, b) => b.version - a.version)[0];
  const moduleCount = program?.modules.length ?? 0;

  const employees = (await db.users.list({ businessId: business.id })).filter(
    (u) => u.role === 'employee',
  );
  const allProgress = await db.progress.list({ businessId: business.id });
  const roleMap = new Map<string, string>();
  for (const emp of employees) {
    roleMap.set(emp.id, 'Team member');
  }
  const employeeRows = buildEmployeeRows(
    employees,
    allProgress,
    moduleCount,
    roleMap,
  );

  const compliance = await db.compliance.list({ businessId: business.id });
  const intake = await db.intake.get(business.id);
  const latestCompliance = compliance.sort(
    (a, b) =>
      new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime(),
  )[0];
  const needsReview =
    latestCompliance?.appliedLaws.filter((l) => l.status === 'needs_review')
      .length ?? 0;

  let avgCompletion = 0;
  if (employees.length > 0 && moduleCount > 0) {
    const total = employees.reduce((sum, emp) => {
      const done = allProgress.filter(
        (p) =>
          p.employeeId === emp.id &&
          (p.status === 'completed' || p.certified),
      ).length;
      return sum + done / moduleCount;
    }, 0);
    avgCompletion = Math.round((total / employees.length) * 100);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{business.name}</h1>
          <p className="text-muted-foreground">
            {business.industry.replace(/_/g, ' ')} · {business.state} ·{' '}
            {business.employeeCount} employees
            {business.address ? ` · ${business.address}` : ''}
            {business.website ? ` · ${business.website}` : ''}
          </p>
        </div>
        <Badge tone={business.status === 'published' ? 'success' : 'brand'}>
          {business.status}
        </Badge>
      </div>

      <DashboardPipelineStatus businessId={business.id} />

      <DashboardContextPanel
        businessId={business.id}
        contextSources={intake?.contextSources}
        hasProgram={Boolean(program)}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Employee join code</CardTitle>
            <CardDescription>
              Share with your team — they join at{' '}
              <Link href="/join" className="underline">
                /join
              </Link>{' '}
              with no password.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <JoinCodeCopy code={business.joinCode} />
            <p className="text-sm text-muted-foreground">
              {employees.length} active learner
              {employees.length === 1 ? '' : 's'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick stats</CardTitle>
            <CardDescription>Program v{program?.version ?? '—'} snapshot</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-muted-foreground">Modules</dt>
                <dd className="text-2xl font-semibold tabular-nums">
                  {moduleCount}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Compliance items</dt>
                <dd className="text-2xl font-semibold tabular-nums">
                  {latestCompliance?.appliedLaws.length ?? 0}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Avg. completion</dt>
                <dd className="text-2xl font-semibold tabular-nums">
                  {avgCompletion}%
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Needs review</dt>
                <dd className="text-2xl font-semibold tabular-nums">
                  {needsReview}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      {program ? (
        <DashboardProgramCard
          businessId={business.id}
          version={program.version}
          status={program.status}
          moduleCount={moduleCount}
          modules={program.modules}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Training program</CardTitle>
            <CardDescription>
              Complete intake, then generate your first program.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/onboarding"
              className="text-sm font-medium text-brand underline"
            >
              Continue intake →
            </Link>
          </CardContent>
        </Card>
      )}

      <DashboardEmployeeRoster employees={employeeRows} />
    </div>
  );
}
