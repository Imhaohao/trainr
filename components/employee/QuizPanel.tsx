"use client";

import * as React from "react";
import Link from "next/link";

import { Button, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { getEmployeeUi } from "@/lib/employee/i18n";
import { loadEmployeeSession } from "@/lib/employee/session";
import type { Quiz } from "@/types";

type QuizPanelProps = {
  moduleId: string;
  quiz: Quiz;
  nextModuleHref?: string;
};

type GradeResult = {
  score: number;
  passed: boolean;
  feedback: string;
  missedQuestionIds?: string[];
  perQuestion: {
    id: string;
    correct: boolean | null;
    needsReview: boolean;
    feedback?: string;
  }[];
};

export function QuizPanel({
  moduleId,
  quiz,
  nextModuleHref,
}: QuizPanelProps) {
  const session = loadEmployeeSession();
  const ui = getEmployeeUi(session?.language);

  const [answers, setAnswers] = React.useState<
    Record<string, number | string>
  >({});
  const [submitting, setSubmitting] = React.useState(false);
  const [result, setResult] = React.useState<GradeResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const current = loadEmployeeSession();
    if (!current) {
      setError("Join with your team code first.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/quiz/${moduleId}/grade`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          employeeId: current.user.id,
          businessId: current.businessId,
          answers,
          language: current.language ?? "en",
        }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error ?? "Could not grade quiz.");
        return;
      }
      setResult(json.data as GradeResult);
    } catch {
      setError("Network error — try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{ui.quizTitle}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {result.passed ? ui.quizPassed : ui.quizFailed} — {result.score}%
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm">{result.feedback}</p>
          <ul className="space-y-2">
            {result.perQuestion.map((pq) => {
              const q = quiz.questions.find((x) => x.id === pq.id);
              return (
                <li
                  key={pq.id}
                  className="rounded-lg border border-border/60 bg-muted/30 p-2 text-sm"
                >
                  <p className="font-medium">{q?.prompt}</p>
                  {pq.feedback && (
                    <p
                      className={
                        pq.correct
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-amber-700 dark:text-amber-400"
                      }
                    >
                      {pq.feedback}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
          {!result.passed &&
            (result.missedQuestionIds?.length ?? 0) > 0 &&
            session && (
              <Link
                href={`/learn/coach?employeeId=${encodeURIComponent(session.user.id)}&module=${encodeURIComponent(moduleId)}&focus=missed&intent=practice-start`}
                className="inline-flex text-sm font-medium text-primary underline"
              >
                {ui.remediationCta}
              </Link>
            )}
          {result.passed && nextModuleHref && (
            <Link
              href={nextModuleHref}
              className="inline-flex h-9 items-center rounded-[var(--radius)] bg-brand px-3 text-sm font-medium text-brand-foreground"
            >
              {ui.continueLearning}
            </Link>
          )}
          {!result.passed && (
            <Button type="button" variant="outline" onClick={() => setResult(null)}>
              {ui.retry}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{ui.quizTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {quiz.questions.map((q) => (
            <fieldset key={q.id} className="space-y-2">
              <legend className="text-sm font-medium">{q.prompt}</legend>
              {q.type === "multiple_choice" && q.options ? (
                <ul className="space-y-1">
                  {q.options.map((opt, idx) => (
                    <li key={opt}>
                      <label className="flex cursor-pointer items-center gap-2 text-sm">
                        <input
                          type="radio"
                          name={q.id}
                          value={idx}
                          checked={answers[q.id] === idx}
                          onChange={() =>
                            setAnswers((prev) => ({ ...prev, [q.id]: idx }))
                          }
                        />
                        {opt}
                      </label>
                    </li>
                  ))}
                </ul>
              ) : (
                <textarea
                  className="min-h-20 w-full rounded-[var(--radius)] border border-border bg-background px-3 py-2 text-sm"
                  value={String(answers[q.id] ?? "")}
                  onChange={(e) =>
                    setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                  }
                />
              )}
            </fieldset>
          ))}
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" disabled={submitting}>
            {ui.submitQuiz}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
