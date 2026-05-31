import type { ChatMessage, TrainingModule } from "@/types";

export function buildCoachSystemPrompt(opts: {
  language: string;
  modules: TrainingModule[];
  intent?: string;
  focus?: string;
  moduleId?: string;
}): string {
  const excerpts = opts.modules
    .map(
      (m) =>
        `### ${m.title} (${m.id})\n${m.contentMarkdown.slice(0, 1200)}`,
    )
    .join("\n\n");

  const focusLine =
    opts.focus === "missed"
      ? "The employee missed a quiz question on this topic — lead the practice scenario on that gap."
      : "";

  const intentLine =
    opts.intent === "practice-start"
      ? "Open with a grounded role-play scenario for the requested module (Policy → Example → Practice prompt). Do not wait for the employee to ask."
      : "";

  return [
    "You are the in-store training coach for Happy Lemon.",
    "Answer ONLY from the module excerpts below. If unsure, say you are not sure and ask the employee to check with their manager.",
    `Respond in ${opts.language}.`,
    intentLine,
    focusLine,
    "For customer complaints: Policy → Example → Offer a short practice scenario.",
    "",
    "## Module excerpts",
    excerpts || "(no modules retrieved)",
  ]
    .filter(Boolean)
    .join("\n");
}

export function historyToMessages(
  prior: ChatMessage[],
): { role: "user" | "assistant"; content: string }[] {
  return prior
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));
}
