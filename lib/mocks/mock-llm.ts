// Mock LlmProvider — deterministic, offline. Returns plausible markdown so the
// curriculum/compliance UI and the coach chat render without any API key.

import type { GenerateOpts, LlmProvider } from '../contracts/llm';

function deterministicReply(opts: GenerateOpts): string {
  const last = [...opts.messages].reverse().find((m) => m.role === 'user');
  const prompt = (last?.content ?? '').toLowerCase();

  if (/quiz|question/.test(prompt)) {
    return [
      '## Quick check',
      '1. What must you confirm on every drink order? (sugar level and ice level)',
      '2. How long may cooked pearls be held before discarding? (4 hours)',
    ].join('\n');
  }

  if (/compliance|law|osha|ada|harassment|labor/.test(prompt)) {
    return [
      '## Compliance summary',
      '- **CA Food Handler Card** — required within 30 days of hire.',
      '- **Meal & rest breaks** — 30-min meal before the 5th hour; 10-min rest per 4 hours.',
      '- **SB 1343 harassment training** — required for employers with 5+ staff.',
    ].join('\n');
  }

  if (/module|curriculum|training|lesson/.test(prompt)) {
    return [
      '# Generated Training Module',
      '',
      'This is mock-generated content. Replace with the real LLM in lib/integrations/anthropic.ts.',
      '',
      '## Key points',
      '- Confirm sugar and ice on every order.',
      '- Standard build: toppings → ice → tea → sugar → milk → seal → shake 10×.',
      '- Never serve overnight pearls.',
    ].join('\n');
  }

  // Generic coach-style answer.
  return (
    'Here\'s how I\'d handle that: stay friendly, follow our standard, and confirm details ' +
    'with the customer. (Mock coach response — wire the real model via getLlm() in production.)'
  );
}

export const mockLlm: LlmProvider = {
  async generate(opts: GenerateOpts): Promise<string> {
    return deterministicReply(opts);
  },

  async *stream(opts: GenerateOpts): AsyncIterable<string> {
    const text = deterministicReply(opts);
    // Stream word-by-word so the UI streaming path is exercised.
    for (const token of text.split(/(\s+)/)) {
      yield token;
    }
  },
};

export function getMockLlm(): LlmProvider {
  return mockLlm;
}
