import type { TrainingModule } from "@/types";
import { COMPLAINT_KEYWORDS } from "./constants";

function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[^a-z0-9\u4e00-\u9fff]+/i)
    .filter((t) => t.length > 2);
}

function scoreModule(mod: TrainingModule, tokens: string[], boostId?: string): number {
  const hay = `${mod.title}\n${mod.contentMarkdown}`.toLowerCase();
  let score = tokens.reduce((sum, t) => sum + (hay.includes(t) ? 1 : 0), 0);
  if (boostId && mod.id === boostId) score += 5;
  if (COMPLAINT_KEYWORDS.test(hay) && tokens.some((t) => /complain|sweet|customer|guest/.test(t))) {
    score += 2;
  }
  if (mod.id === "mod_guest_care" && COMPLAINT_KEYWORDS.test(tokens.join(" "))) {
    score += 4;
  }
  return score;
}

export function retrieveModules(
  modules: TrainingModule[],
  query: string,
  opts?: { moduleId?: string; limit?: number },
): TrainingModule[] {
  const tokens = tokenize(query);
  const ranked = [...modules]
    .map((mod) => ({ mod, score: scoreModule(mod, tokens, opts?.moduleId) }))
    .sort((a, b) => b.score - a.score || a.mod.order - b.mod.order);
  const limit = opts?.limit ?? 3;
  const top = ranked.filter((r) => r.score > 0).slice(0, limit);
  if (top.length > 0) return top.map((r) => r.mod);
  if (opts?.moduleId) {
    const forced = modules.find((m) => m.id === opts.moduleId);
    if (forced) return [forced];
  }
  return modules.slice(0, limit);
}
