"use client";

import { CoachFloatingWidget } from "@/components/employee/CoachFloatingWidget";
import {
  type CoachSuggestion,
  moduleTitleForLocale,
} from "@/components/employee/CoachChat";
import { t } from "@/lib/employee/i18n";
import {
  getJustCompletedModuleId,
  getRecentMiss,
} from "@/lib/employee/progress-utils";
import { findModule } from "@/types/training";
import { loadEmployeeSession } from "@/lib/employee/session";
import type { TrainingModule } from "@/types";
import type { ModuleProgress } from "@/types/training";

type CoachPageClientProps = {
  modules: TrainingModule[];
  progress: ModuleProgress[];
  queryModuleId?: string;
  queryFocus?: string;
  queryIntent?: string;
};

export function CoachPageClient({
  modules,
  progress,
  queryModuleId,
  queryFocus,
  queryIntent,
}: CoachPageClientProps) {
  const session = loadEmployeeSession();
  const language = session?.language;

  const justFinishedId = getJustCompletedModuleId(progress, modules);
  const recentMiss = getRecentMiss(progress);

  const autoStartModuleId = queryModuleId;
  const shouldAutoStart =
    Boolean(autoStartModuleId) &&
    (queryIntent === "practice-start" || queryFocus === "missed");

  const autoStartMod = autoStartModuleId
    ? findModule(modules, autoStartModuleId)
    : undefined;

  const suggestions: CoachSuggestion[] = [];

  if (justFinishedId) {
    const mod = findModule(modules, justFinishedId);
    if (mod) {
      suggestions.push({
        label: t("suggestionJustFinished", language, {
          module: moduleTitleForLocale(mod, language),
        }),
        moduleId: mod.id,
        intent: "practice-start",
      });
    }
  }

  if (recentMiss) {
    const mod = findModule(modules, recentMiss.moduleId);
    if (mod) {
      suggestions.push({
        label: t("suggestionRecentMiss", language, {
          module: moduleTitleForLocale(mod, language),
        }),
        moduleId: mod.id,
        focus: "missed",
        intent: "practice-start",
      });
    }
  }

  if (suggestions.length === 0) {
    const guest = findModule(modules, "mod_guest_care");
    if (guest) {
      suggestions.push({
        label: t("suggestionRolePlay", language),
        moduleId: guest.id,
        intent: "practice-start",
      });
    }
  }

  return (
    <CoachFloatingWidget
      defaultOpen
      autoStart={
        shouldAutoStart && autoStartMod
          ? {
              moduleId: autoStartMod.id,
              focus: queryFocus,
              moduleTitle: moduleTitleForLocale(autoStartMod, language),
            }
          : undefined
      }
      moduleId={autoStartModuleId}
      suggestions={suggestions}
    />
  );
}
