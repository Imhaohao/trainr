import fs from 'node:fs';
import path from 'node:path';

import { getLlm } from '@/lib/contracts/llm';
import { generateSimDebriefMock } from '@/lib/coach/mock-fallback';
import { getModule } from '@/lib/employee/store';
import type {
  EquipmentSim,
  Language,
  ModuleCitationBackedText,
  SimResult,
} from '@/types/training';

function loadSkill(name: string): string {
  const skillPath = path.join(process.cwd(), 'skills', name, 'SKILL.md');
  try {
    return fs.readFileSync(skillPath, 'utf8');
  } catch {
    return '';
  }
}

async function retrieveModuleSnippets(
  businessId: string,
  moduleIds: string[],
): Promise<{ moduleId: string; title: string; content: string }[]> {
  const unique = [...new Set(moduleIds.filter(Boolean))];
  const rows: { moduleId: string; title: string; content: string }[] = [];
  for (const moduleId of unique) {
    const mod = await getModule(moduleId, businessId);
    if (mod) {
      rows.push({
        moduleId: mod.id,
        title: mod.title,
        content: mod.contentMarkdown.slice(0, 1200),
      });
    }
  }
  return rows;
}

function formatRetrievedContext(
  modules: { moduleId: string; title: string; content: string }[],
): string {
  return modules
    .map(
      (m) => `### ${m.title} (${m.moduleId})\n${m.content.slice(0, 800)}`,
    )
    .join('\n\n');
}

function parseDebriefJson(raw: string): ModuleCitationBackedText | null {
  const trimmed = raw.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    const parsed = JSON.parse(jsonMatch[0]) as ModuleCitationBackedText;
    if (typeof parsed.text === 'string' && Array.isArray(parsed.citations)) {
      return parsed;
    }
  } catch {
    return null;
  }
  return null;
}

export async function simDebrief(
  simResult: SimResult,
  sim: EquipmentSim,
  language: Language,
  businessId: string,
): Promise<ModuleCitationBackedText> {
  const useMocks =
    process.env.USE_MOCKS === 'true' || !process.env.ANTHROPIC_API_KEY;

  if (useMocks) {
    return generateSimDebriefMock(simResult, sim, language);
  }

  const citedIds = sim.steps
    .map((s) => s.citationModuleId)
    .filter((id): id is string => Boolean(id));
  const modules = await retrieveModuleSnippets(businessId, citedIds);
  const skill = loadSkill('scenario-coach');

  const system = [
    skill,
    'Mode: evaluate',
    `Employee language: ${language}`,
    'Retrieved training modules:',
    formatRetrievedContext(modules),
    `Sim run score: ${simResult.score}% passed=${simResult.passed}`,
    `Per-step: ${JSON.stringify(simResult.perStep)}`,
  ].join('\n\n');

  try {
    const raw = await getLlm().generate({
      system,
      cache: true,
      messages: [
        {
          role: 'user',
          content: `Debrief this equipment sim run for sim "${sim.name}". Return JSON only.`,
        },
      ],
      maxTokens: 1024,
    });
    const parsed = parseDebriefJson(raw);
    if (parsed) return parsed;
  } catch {
    // fall through to mock
  }

  return generateSimDebriefMock(simResult, sim, language);
}
