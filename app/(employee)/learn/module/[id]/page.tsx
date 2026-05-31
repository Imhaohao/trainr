"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { QuizPanel } from "@/components/employee/QuizPanel";
import { SimStation } from "@/components/employee/SimStation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { getEmployeeUi } from "@/lib/employee/i18n";
import { loadEmployeeSession } from "@/lib/employee/session";
import type { TrainingModule } from "@/types";
import type { EquipmentSim } from "@/types/training";

export default function ModulePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const moduleId = params.id;

  const [mod, setMod] = React.useState<TrainingModule | null>(null);
  const [sim, setSim] = React.useState<EquipmentSim | null>(null);
  const [nextModuleHref, setNextModuleHref] = React.useState<string | undefined>();
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const session = loadEmployeeSession();
    if (!session) {
      router.replace("/join");
      return;
    }

    fetch(`/api/programs/${session.businessId}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.ok) {
          const modules: TrainingModule[] = json.data.program.modules ?? [];
          const found = modules.find((m) => m.id === moduleId);
          setMod(found ?? null);

          if (found) {
            const sorted = [...modules].sort((a, b) => a.order - b.order);
            const idx = sorted.findIndex((m) => m.id === found.id);
            const next = sorted[idx + 1];
            if (next) setNextModuleHref(`/learn/module/${next.id}`);
          }
        }
      })
      .finally(() => setLoading(false));

    fetch(`/api/sim/${session.businessId}/module/${moduleId}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.ok) setSim(json.data.sim as EquipmentSim);
      })
      .catch(() => setSim(null));
  }, [moduleId, router]);

  if (loading) {
    return <p className="text-muted-foreground">Loading module…</p>;
  }

  if (!mod) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">Module not found.</p>
        <Link
          href="/learn"
          className="inline-flex h-8 items-center justify-center rounded-[var(--radius)] border border-border bg-card px-3 text-sm font-medium text-foreground transition hover:bg-brand-soft"
        >
          Back to modules
        </Link>
      </div>
    );
  }

  const session = loadEmployeeSession();
  const ui = getEmployeeUi(session?.language);
  const content =
    mod.languageVariants?.[session?.language ?? ""] ?? mod.contentMarkdown;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)]">
      <div className="space-y-6">
        <Link
          href="/learn"
          className="-ml-2 inline-flex h-8 items-center rounded-[var(--radius)] px-2 text-sm text-muted-foreground transition hover:bg-brand-soft hover:text-foreground"
        >
          ← All modules
        </Link>
        <Card>
          <CardHeader>
            <CardTitle>{mod.title}</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {content}
            </div>
          </CardContent>
        </Card>

        {sim && (
          <SimStation sim={sim} nextModuleHref={nextModuleHref} />
        )}

        {mod.quiz && (
          <QuizPanel
            moduleId={mod.id}
            quiz={mod.quiz}
            nextModuleHref={nextModuleHref}
          />
        )}
      </div>

      <aside className="space-y-3 lg:sticky lg:top-8 lg:self-start">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{ui.coachTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-sm text-muted-foreground">
              {ui.coachDescription}
            </p>
            {session && (
              <Link
                href={`/learn/coach?employeeId=${encodeURIComponent(session.user.id)}&module=${encodeURIComponent(mod.id)}&intent=practice-start`}
                className="inline-flex h-10 items-center justify-center rounded-[var(--radius)] bg-brand px-4 text-sm font-medium text-brand-foreground transition hover:brightness-95"
              >
                {ui.rolePlayModule}
              </Link>
            )}
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
