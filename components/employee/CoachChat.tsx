"use client";

import * as React from "react";
import Link from "next/link";

import AiAssistat, {
  type AiAssistatMessage,
} from "@/components/ui/ai-assistat";
import { CitationChip } from "@/components/employee/CitationChip";
import { streamCoachChat } from "@/lib/employee/coach-client";
import { moduleTitleForLocale, t } from "@/lib/employee/i18n";
import {
  loadEmployeeSession,
  updateEmployeeSession,
} from "@/lib/employee/session";
import type { ChatCitation } from "@/types";

export type CoachSuggestion = {
  label: string;
  moduleId?: string;
  focus?: string;
  intent?: string;
};

type CoachMessage = AiAssistatMessage & {
  citations?: ChatCitation[];
};

type CoachChatProps = {
  title?: string;
  description?: string;
  moduleId?: string;
  prefill?: string;
  autoStart?: { moduleId: string; focus?: string; moduleTitle?: string };
  suggestions?: CoachSuggestion[];
  className?: string;
};

export function CoachChat({
  title,
  description,
  moduleId,
  prefill,
  autoStart,
  suggestions = [],
  className,
}: CoachChatProps) {
  const session = loadEmployeeSession();
  const language = session?.language;

  const [messages, setMessages] = React.useState<CoachMessage[]>([]);
  const [isTyping, setIsTyping] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const prefillSent = React.useRef(false);
  const autoStartSent = React.useRef(false);

  const resolvedTitle = title ?? t("coachTitle", language);
  const resolvedDescription =
    description ?? t("coachDescription", language);

  async function dispatchTurn(opts: {
    displayMessage: string;
    message: string;
    moduleId?: string;
    intent?: string;
    focus?: string;
  }) {
    const current = loadEmployeeSession();
    if (!current) {
      setError("Please join with your team code first.");
      return;
    }

    setError(null);
    setMessages((prev) => [
      ...prev,
      { text: opts.displayMessage, isUser: true },
    ]);
    setIsTyping(true);

    let assistantText = "";
    let citations: ChatCitation[] = [];

    try {
      const done = await streamCoachChat(
        current.businessId,
        {
          sessionId: current.coachSessionId,
          message: opts.message,
          employeeId: current.user.id,
          language: current.language ?? "en",
          moduleId: opts.moduleId ?? moduleId,
          intent: opts.intent,
          focus: opts.focus,
        },
        (token) => {
          assistantText += token;
          setMessages((prev) => {
            const next = [...prev];
            const last = next.at(-1);
            if (last && !last.isUser) {
              next[next.length - 1] = {
                text: assistantText,
                isUser: false,
                citations,
              };
              return next;
            }
            return [
              ...next,
              { text: assistantText, isUser: false, citations },
            ];
          });
        },
        (event) => {
          citations = event.citations;
          if (event.sessionId) {
            updateEmployeeSession({ coachSessionId: event.sessionId });
          }
        },
      );

      citations = done.citations;
      if (done.sessionId) {
        updateEmployeeSession({ coachSessionId: done.sessionId });
      }

      setMessages((prev) => {
        const next = [...prev];
        const last = next.at(-1);
        if (last && !last.isUser) {
          next[next.length - 1] = {
            text: assistantText || last.text,
            isUser: false,
            citations,
          };
          return next;
        }
        if (assistantText) {
          return [
            ...next,
            { text: assistantText, isUser: false, citations },
          ];
        }
        return next;
      });

      if (!assistantText) {
        setMessages((prev) => [
          ...prev,
          {
            text:
              language === "es"
                ? "No pude responder ahora — intenta de nuevo o pregunta a tu gerente."
                : language === "zh-Hans"
                  ? "暂时无法回答——请重试或咨询经理。"
                  : "I couldn't find an answer right now. Try rephrasing or ask your manager.",
            isUser: false,
          },
        ]);
      }
    } catch {
      setError(
        language === "es"
          ? "No se pudo conectar con el coach."
          : language === "zh-Hans"
            ? "无法连接教练。"
            : "Could not reach the coach. Check your connection and try again.",
      );
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsTyping(false);
    }
  }

  async function handleSend(message: string) {
    await dispatchTurn({
      displayMessage: message,
      message,
      moduleId,
    });
  }

  React.useEffect(() => {
    if (!session || autoStartSent.current || !autoStart) return;
    autoStartSent.current = true;
    const moduleLabel =
      autoStart.moduleTitle ??
      autoStart.moduleId.replace(/^mod_/, "").replace(/_/g, " ");
    void dispatchTurn({
      displayMessage: t("autoStartBubble", language, { module: moduleLabel }),
      message: `Start practice for module ${autoStart.moduleId}`,
      moduleId: autoStart.moduleId,
      intent: "practice-start",
      focus: autoStart.focus,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-time auto start
  }, [autoStart?.moduleId, session?.businessId]);

  React.useEffect(() => {
    if (!prefill || prefillSent.current || !session || autoStart) return;
    prefillSent.current = true;
    void handleSend(prefill);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-time prefill
  }, [prefill, session?.businessId]);

  if (!session) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
        <p className="mb-3">
          {language === "es"
            ? "Únete a tu equipo para usar el coach."
            : language === "zh-Hans"
              ? "加入团队后即可使用培训教练。"
              : "Join your team to use the training coach."}
        </p>
        <Link href="/join" className="font-medium text-primary underline">
          {language === "es"
            ? "Ingresar código"
            : language === "zh-Hans"
              ? "输入加入码"
              : "Enter join code"}
        </Link>
      </div>
    );
  }

  const showSuggestions = messages.length === 0 && suggestions.length > 0;

  return (
    <div className="space-y-2">
      {error && (
        <p className="text-center text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      {showSuggestions && (
        <div className="flex flex-wrap gap-2 px-1">
          {suggestions.map((s) => (
            <button
              key={`${s.label}-${s.moduleId ?? "general"}`}
              type="button"
              className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-primary/50 hover:bg-brand-soft"
              onClick={() =>
                void dispatchTurn({
                  displayMessage: s.label,
                  message: s.moduleId
                    ? `Start practice for module ${s.moduleId}`
                    : s.label,
                  moduleId: s.moduleId,
                  intent: s.intent ?? (s.moduleId ? "practice-start" : undefined),
                  focus: s.focus,
                })
              }
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
      <AiAssistat
        title={resolvedTitle}
        description={resolvedDescription}
        className={className}
        messages={messages}
        onSend={handleSend}
        isTyping={isTyping}
        onClear={() => {
          setMessages([]);
          updateEmployeeSession({ coachSessionId: undefined });
        }}
      />
      {(() => {
        const lastWithCites = [...messages]
          .reverse()
          .find((m) => !m.isUser && m.citations?.length);
        if (!lastWithCites?.citations?.length) return null;
        return (
          <div className="flex flex-wrap gap-1 px-1">
            {lastWithCites.citations.map((c, i) => (
              <CitationChip key={`${c.moduleId ?? c.title}-${i}`} citation={c} />
            ))}
          </div>
        );
      })()}
    </div>
  );
}

export { moduleTitleForLocale };
