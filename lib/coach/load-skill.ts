import { readFileSync } from "node:fs";
import { join } from "node:path";

const cache = new Map<string, string>();

export function loadSkill(name: "quiz-grader" | "scenario-coach"): string {
  const hit = cache.get(name);
  if (hit) return hit;
  const path = join(process.cwd(), "skills", name, "SKILL.md");
  const text = readFileSync(path, "utf8");
  cache.set(name, text);
  return text;
}
