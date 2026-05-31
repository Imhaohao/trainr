"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { CoachFloatingWidget } from "@/components/employee/CoachFloatingWidget";
import { ModuleContent } from "@/components/employee/ModuleContent";
import { QuizPanel } from "@/components/employee/QuizPanel";
import { SimStation } from "@/components/employee/SimStation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import type { ModuleMedia } from "@/lib/employee/module-media";
import { loadEmployeeSession } from "@/lib/employee/session";
import type { TrainingModule } from "@/types";
import type { EquipmentSim } from "@/types/training";

export default function ModulePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const moduleId = params.id;

  const [mod, setMod] = React.useState<TrainingModule | null>(null);
  const [sim, setSim] = React.useState<EquipmentSim | null>(null);
  const [media, setMedia] = React.useState<ModuleMedia | null>(null);
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

    fetch(`/api/programs/${session.businessId}/modules/${moduleId}/media`)
      .then((res) => res.json())
      .then((json) => {
        if (json.ok) setMedia(json.data.media as ModuleMedia);
      })
      .catch(() => setMedia(null));
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
  const content =
    mod.languageVariants?.[session?.language ?? ""] ?? mod.contentMarkdown;

  return (
    <>
      <div className="space-y-6">
        <Link
          href="/learn"
          className="-ml-2 inline-flex h-8 items-center rounded-[var(--radius)] px-2 text-sm text-muted-foreground transition hover:bg-brand-soft hover:text-foreground"
        >
          ← All modules
        </Link>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl tracking-tight">{mod.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <ModuleContent
              markdown={content}
              media={media}
              exportGuideMarkdown={sim?.exportGuide}
            />
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

      {session && <CoachFloatingWidget moduleId={mod.id} />}
    </>
  );
}
