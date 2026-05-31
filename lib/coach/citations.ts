import type { ChatCitation, TrainingModule } from "@/types";

export function toCitations(modules: TrainingModule[], snippetLen = 80): ChatCitation[] {
  return modules.map((mod) => {
    const line =
      mod.contentMarkdown
        .split("\n")
        .map((l) => l.replace(/^#+\s*/, "").trim())
        .find((l) => l.length > 20) ?? mod.title;
    const snippet =
      line.length > snippetLen ? `${line.slice(0, snippetLen - 1)}…` : line;
    return { moduleId: mod.id, title: mod.title, snippet };
  });
}
