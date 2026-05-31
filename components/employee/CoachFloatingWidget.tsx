"use client";

import * as React from "react";
import { MessageCircle, Sparkles, X } from "lucide-react";

import {
  CoachChat,
  type CoachSuggestion,
} from "@/components/employee/CoachChat";
import { t } from "@/lib/employee/i18n";
import { loadEmployeeSession } from "@/lib/employee/session";
import { cn } from "@/lib/utils";

type CoachFloatingWidgetProps = {
  moduleId?: string;
  defaultOpen?: boolean;
  autoStart?: { moduleId: string; focus?: string; moduleTitle?: string };
  suggestions?: CoachSuggestion[];
  prefill?: string;
};

export function CoachFloatingWidget({
  moduleId,
  defaultOpen = false,
  autoStart,
  suggestions,
  prefill,
}: CoachFloatingWidgetProps) {
  const session = loadEmployeeSession();
  const language = session?.language;
  const [open, setOpen] = React.useState(defaultOpen);

  React.useEffect(() => {
    if (defaultOpen) setOpen(true);
  }, [defaultOpen]);

  if (!session) return null;

  const title = t("coachTitle", language);

  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3"
      aria-live="polite"
    >
      {open && (
        <div
          className={cn(
            "pointer-events-auto animate-in fade-in-0 slide-in-from-bottom-4 duration-200",
            "rounded-xl shadow-2xl ring-1 ring-black/10",
          )}
        >
          <CoachChat
            moduleId={moduleId}
            autoStart={autoStart}
            suggestions={suggestions}
            prefill={prefill}
            variant="floating"
            onClose={() => setOpen(false)}
          />
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "pointer-events-auto flex items-center gap-2 rounded-full px-4 py-3 text-sm font-medium text-white shadow-lg transition",
          "bg-gradient-to-br from-indigo-600 to-indigo-800 hover:from-indigo-500 hover:to-indigo-700",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2",
        )}
        aria-expanded={open}
        aria-label={open ? `Close ${title}` : `Open ${title}`}
      >
        {open ? (
          <X className="h-5 w-5" aria-hidden />
        ) : (
          <>
            <Sparkles className="h-5 w-5" aria-hidden />
            <MessageCircle className="h-4 w-4 opacity-80" aria-hidden />
            <span>{title}</span>
          </>
        )}
      </button>
    </div>
  );
}
