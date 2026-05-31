"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { t, moduleTitleForLocale } from "@/lib/employee/i18n";
import { getJustCompletedModuleId } from "@/lib/employee/progress-utils";
import { loadEmployeeSession } from "@/lib/employee/session";
import type { TrainingModule } from "@/types";
import type { ModuleProgress } from "@/types/training";
import { asModuleProgress } from "@/types/training";

export default function LearnDashboardPage() {
  const router = useRouter();
  const [modules, setModules] = React.useState<TrainingModule[]>([]);
  const [progress, setProgress] = React.useState<ModuleProgress[]>([]);
  const [loading, setLoading] = React.useState(true);
  const session = loadEmployeeSession();

  React.useEffect(() => {
    if (!session) {
      router.replace("/join");
      return;
    }

    Promise.all([
      fetch(`/api/programs/${session.businessId}`).then((r) => r.json()),
      fetch(`/api/progress/${session.user.id}`).then((r) => r.json()),
    ])
      .then(([progJson, progResJson]) => {
        if (progJson.ok) {
          setModules(progJson.data.program.modules ?? []);
        }
        if (progResJson.ok) {
          setProgress(
            (progResJson.data.progress as ModuleProgress[]).map(asModuleProgress),
          );
        }
      })
      .finally(() => setLoading(false));
  }, [router, session?.businessId, session?.user.id]);

  if (loading) {
    return <p className="text-muted-foreground">Loading your training path…</p>;
  }

  const justFinishedId = getJustCompletedModuleId(progress, modules);
  const justFinishedMod = modules.find((m) => m.id === justFinishedId);

  return (
    <div className="space-y-8">
      {justFinishedMod && session && (
        <Card className="border-primary/30 bg-brand-soft/40">
          <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm">
              {t("dashboardBanner", session.language, {
                module: moduleTitleForLocale(justFinishedMod, session.language),
              })}
            </p>
            <Link
              href={`/learn/coach?employeeId=${encodeURIComponent(session.user.id)}&module=${encodeURIComponent(justFinishedMod.id)}&intent=practice-start`}
              className="inline-flex h-9 shrink-0 items-center justify-center rounded-[var(--radius)] bg-brand px-3 text-sm font-medium text-brand-foreground"
            >
              {t("rolePlayModule", session.language)}
            </Link>
          </CardContent>
        </Card>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Your modules</h1>
          <p className="mt-1 text-muted-foreground">
            Complete each module and ask the coach if you get stuck.
          </p>
        </div>
        <Link
          href="/learn/coach"
          className="inline-flex h-10 items-center justify-center rounded-[var(--radius)] bg-brand px-4 text-sm font-medium text-brand-foreground transition hover:brightness-95"
        >
          Ask the coach
        </Link>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2">
        {modules.map((mod, index) => (
          <li key={mod.id}>
            <Link href={`/learn/module/${mod.id}`}>
              <Card className="transition-colors hover:border-primary/40">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Module {index + 1}
                    </p>
                    {mod.simId && (
                      <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-brand">
                        Practice
                      </span>
                    )}
                  </div>
                  <CardTitle className="text-base">{mod.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {mod.contentMarkdown.split("\n").find(Boolean) ??
                      "Open module to start learning."}
                  </p>
                </CardContent>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
