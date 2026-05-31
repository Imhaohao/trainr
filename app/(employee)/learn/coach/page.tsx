import { CoachPageClient } from "@/components/employee/CoachPageClient";
import { getDb } from "@/lib/contracts/db";
import { IDS } from "@/lib/mocks/fixtures";
import { asModuleProgress } from "@/types/training";

type CoachPageProps = {
  searchParams: Promise<{
    module?: string;
    moduleId?: string;
    focus?: string;
    intent?: string;
    employeeId?: string;
    prefill?: string;
  }>;
};

export default async function CoachPage({ searchParams }: CoachPageProps) {
  const params = await searchParams;
  const moduleId = params.module ?? params.moduleId;

  const db = getDb();
  const programs = await db.programs.list({ businessId: IDS.business });
  const program = programs.sort((a, b) => b.version - a.version)[0];
  const modules = program?.modules ?? [];

  const employeeId = params.employeeId;
  const progress = employeeId
    ? (await db.progress.list({ employeeId })).map(asModuleProgress)
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Training coach</h1>
        <p className="mt-1 text-muted-foreground">
          Practice scenarios grounded in your store&apos;s training — including what
          you just missed on a quiz.
        </p>
      </div>
      <CoachPageClient
        modules={modules}
        progress={progress}
        queryModuleId={moduleId}
        queryFocus={params.focus}
        queryIntent={params.intent ?? (moduleId ? "practice-start" : undefined)}
      />
    </div>
  );
}
