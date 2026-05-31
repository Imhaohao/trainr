import type { ChatCitation, ChatMessage } from '@/types';
import { getDb } from '@/lib/contracts/db';
import { getLlm } from '@/lib/contracts/llm';
import { getModule } from '@/lib/employee/store';
import { retrieveModules } from './retrieve';
import { buildCoachSystemPrompt, historyToMessages } from './prompt';
import {
  generateMockCoachReply,
  isPendingPracticeScenario,
} from './coach-chat-mock';

export type CoachReplyArgs = {
  businessId: string;
  message: string;
  language: string;
  history: ChatMessage[];
  moduleId?: string;
  intent?: string;
  focus?: string;
  missedConcept?: string;
};

export type CoachReplyResult = {
  text: string;
  citations: ChatCitation[];
};

export async function coachReply(args: CoachReplyArgs): Promise<CoachReplyResult> {
  const useMocks =
    process.env.USE_MOCKS === 'true' || !process.env.ANTHROPIC_API_KEY?.trim();

  const programs = await getDb().programs.list({ businessId: args.businessId });
  const program = programs.sort((a, b) => b.version - a.version)[0];
  const modules = program?.modules ?? [];

  const module =
    (args.moduleId
      ? await getModule(args.moduleId, args.businessId)
      : undefined) ?? modules[0];

  const priorAssistant = [...args.history]
    .reverse()
    .find((m) => m.role === 'assistant')?.content;

  if (useMocks) {
    return generateMockCoachReply({
      message: args.message,
      language: args.language,
      module,
      modules,
      intent: args.intent,
      focus: args.focus,
      priorAssistant,
      missedConcept: args.missedConcept,
    });
  }

  const retrieved = retrieveModules(modules, args.message, {
    moduleId: args.moduleId,
  });
  const llm = getLlm();
  const system = buildCoachSystemPrompt({
    language: args.language,
    modules: retrieved,
    intent: args.intent,
    focus: args.focus,
    moduleId: args.moduleId,
  });

  const practiceNote =
    args.intent === 'practice-start' && module
      ? `\n\n[Open a practice scenario for ${module.id} (${module.title}).]`
      : '';

  const messages = [
    ...historyToMessages(args.history),
    {
      role: 'user' as const,
      content:
        priorAssistant && isPendingPracticeScenario(priorAssistant)
          ? `[Scenario response]\n${args.message}`
          : args.message + practiceNote,
    },
  ];

  const text = await llm.generate({
    system,
    messages,
    model: 'claude-sonnet-4-6',
    maxTokens: 1024,
    cache: true,
  });

  const mock = generateMockCoachReply({
    message: args.message,
    language: args.language,
    module,
    modules,
    intent: args.intent,
    focus: args.focus,
    priorAssistant,
    missedConcept: args.missedConcept,
  });

  return { text, citations: mock.citations };
}
