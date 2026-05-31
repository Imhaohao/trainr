"use client";

import * as React from "react";
import Link from "next/link";

import { Button, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { getEmployeeUi, pickSimText } from "@/lib/employee/i18n";
import { loadEmployeeSession } from "@/lib/employee/session";
import type { EquipmentSim, SimAttempt, SimResult } from "@/types/training";

type SimStationProps = {
  sim: EquipmentSim;
  nextModuleHref?: string;
};

export function SimStation({ sim, nextModuleHref }: SimStationProps) {
  const session = loadEmployeeSession();
  const language = session?.language ?? "en";
  const ui = getEmployeeUi(language);

  const [started, setStarted] = React.useState(false);
  const [stepIndex, setStepIndex] = React.useState(0);
  const [attempts, setAttempts] = React.useState<SimAttempt[]>([]);
  const [selectedAction, setSelectedAction] = React.useState<string | null>(
    null,
  );
  const [grading, setGrading] = React.useState(false);
  const [result, setResult] = React.useState<SimResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const step = sim.steps[stepIndex];
  const isLastStep = stepIndex >= sim.steps.length - 1;
  const progressPct = started
    ? Math.round(((stepIndex + (selectedAction ? 1 : 0)) / sim.steps.length) * 100)
    : 0;

  function resetRun() {
    setStarted(false);
    setStepIndex(0);
    setAttempts([]);
    setSelectedAction(null);
    setResult(null);
    setError(null);
  }

  function confirmStep() {
    if (!step || !selectedAction) return;
    const nextAttempts = [
      ...attempts,
      { stepId: step.id, actionId: selectedAction },
    ];
    setAttempts(nextAttempts);
    setSelectedAction(null);

    if (isLastStep) {
      void submitRun(nextAttempts);
    } else {
      setStepIndex((i) => i + 1);
    }
  }

  async function submitRun(finalAttempts: SimAttempt[]) {
    const current = loadEmployeeSession();
    if (!current) {
      setError("Join with your team code to save practice results.");
      return;
    }

    setGrading(true);
    setError(null);

    try {
      const res = await fetch(`/api/sim/${current.businessId}/grade`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          employeeId: current.user.id,
          simId: sim.id,
          attempts: finalAttempts,
          language: current.language ?? "en",
        }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error ?? "Could not grade practice run.");
        return;
      }
      setResult(json.data as SimResult);
    } catch {
      setError("Network error — try again.");
    } finally {
      setGrading(false);
    }
  }

  const simName = pickSimText(sim.name, sim.nameVariants, language);
  const simDescription = pickSimText(
    sim.description,
    sim.descriptionVariants,
    language,
  );
  const sourceLabel =
    sim.source.kind === 'rtrvr' ? ui.rtrvrLabel : ui.fixtureLabel;
  const sourceClass =
    sim.source.kind === 'rtrvr'
      ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-200'
      : 'bg-amber-500/15 text-amber-800 dark:text-amber-200';

  if (result) {
    return (
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg">{ui.practiceStation}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {result.passed ? ui.simPassed : ui.simFailed} · {ui.simScore}:{" "}
            {result.score}%
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-2 text-sm">
            {result.perStep.map((s, i) => {
              const stepDef = sim.steps.find((st) => st.id === s.stepId);
              return (
                <li
                  key={s.stepId}
                  className={`rounded-lg border px-3 py-2 ${s.correct ? "border-emerald-500/40 bg-emerald-500/5" : "border-destructive/40 bg-destructive/5"}`}
                >
                  <span className="mr-2">{s.correct ? "✓" : "✗"}</span>
                  <span className="font-medium">
                    {ui.stepOf} {i + 1}:{" "}
                    {stepDef
                      ? pickSimText(
                          stepDef.prompt,
                          stepDef.promptVariants,
                          language,
                        )
                      : s.stepId}
                  </span>
                  <p className="mt-1 text-muted-foreground">{s.feedback}</p>
                </li>
              );
            })}
          </ul>

          {result.debrief && (
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="text-sm font-medium">{ui.debriefTitle}</p>
              <p className="mt-2 text-sm leading-relaxed">
                {result.debrief.text}
              </p>
              {result.debrief.citations.length > 0 && (
                <ul className="mt-2 flex flex-wrap gap-2">
                  {result.debrief.citations.map((c) => (
                    <li key={c.moduleId}>
                      <Link
                        href={`/learn/module/${c.moduleId}`}
                        className="rounded-full bg-brand-soft px-2 py-0.5 text-xs text-brand"
                      >
                        {c.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={resetRun}>
              {ui.retry}
            </Button>
            <Link
              href={
                session
                  ? `/learn/coach?employeeId=${encodeURIComponent(session.user.id)}&module=${encodeURIComponent(sim.moduleId)}&intent=practice-start`
                  : `/learn/coach?module=${encodeURIComponent(sim.moduleId)}&intent=practice-start`
              }
              className="inline-flex h-9 items-center rounded-[var(--radius)] border border-border px-3 text-sm font-medium transition hover:bg-brand-soft"
            >
              {ui.talkToCoachAboutRun}
            </Link>
            {result.passed && nextModuleHref && (
              <Link
                href={nextModuleHref}
                className="inline-flex h-9 items-center rounded-[var(--radius)] bg-brand px-3 text-sm font-medium text-brand-foreground transition hover:brightness-95"
              >
                {ui.continueLearning}
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-lg">{ui.practiceStation}</CardTitle>
            <p className="mt-1 text-sm font-medium text-foreground">{simName}</p>
          </div>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${sourceClass}`}
          >
            {sourceLabel}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{simDescription}</p>
        {sim.assets && sim.assets.length > 0 && (
          <div className="mt-3 space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              {ui.equipmentAssetsTitle}
            </p>
            <ul className="flex flex-wrap gap-2">
              {sim.assets.map((asset) => (
                <li key={asset.id}>
                  <a
                    href={asset.productUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs transition hover:border-primary/40 hover:bg-brand-soft"
                  >
                    {asset.previewImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={asset.previewImageUrl}
                        alt=""
                        className="h-5 w-5 rounded object-cover"
                      />
                    ) : (
                      <span aria-hidden>🧋</span>
                    )}
                    <span>{asset.name}</span>
                    <span className="text-muted-foreground">({asset.provider})</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {!started ? (
          <Button type="button" onClick={() => setStarted(true)}>
            {ui.startPractice}
          </Button>
        ) : (
          <>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  {ui.stepOf} {stepIndex + 1} / {sim.steps.length}
                </span>
                <span>{progressPct}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-brand transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {step && (
              <div className="space-y-3">
                <p className="text-sm font-medium leading-relaxed">
                  {pickSimText(step.prompt, step.promptVariants, language)}
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {step.actions.map((action) => {
                    const label = pickSimText(
                      action.label,
                      action.labelVariants,
                      language,
                    );
                    const active = selectedAction === action.id;
                    return (
                      <button
                        key={action.id}
                        type="button"
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/plain", action.id);
                          setSelectedAction(action.id);
                        }}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const id = e.dataTransfer.getData("text/plain");
                          if (id) setSelectedAction(id);
                        }}
                        onClick={() => setSelectedAction(action.id)}
                        className={`flex items-center gap-2 rounded-lg border px-3 py-3 text-left text-sm transition ${
                          active
                            ? "border-primary bg-brand-soft ring-2 ring-primary/30"
                            : "border-border hover:border-primary/40 hover:bg-muted/50"
                        }`}
                      >
                        <span className="text-xl" aria-hidden>
                          {action.icon ?? "▸"}
                        </span>
                        <span>{label}</span>
                      </button>
                    );
                  })}
                </div>
                {step.hint && (
                  <p className="text-xs text-muted-foreground">
                    {pickSimText(step.hint, step.hintVariants, language)}
                  </p>
                )}
                <Button
                  type="button"
                  disabled={!selectedAction || grading}
                  onClick={confirmStep}
                >
                  {grading
                    ? "…"
                    : isLastStep
                      ? ui.submitPractice
                      : ui.nextStep}
                </Button>
              </div>
            )}
          </>
        )}

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
