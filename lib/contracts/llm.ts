// LLM contract — Anthropic. Impl: T2. Used by T3 for the coach. Mock: lib/mocks/mock-llm.ts
// FROZEN after Phase 0.

export interface LlmMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface GenerateOpts {
  model?: string;
  system?: string;
  messages: LlmMessage[];
  maxTokens?: number;
  cache?: boolean;
  tools?: unknown[];
}

export interface LlmProvider {
  generate(opts: GenerateOpts): Promise<string>;
  stream(opts: GenerateOpts): AsyncIterable<string>;
}

// Returns the mock provider when USE_MOCKS==='true' or ANTHROPIC_API_KEY is missing.
// The real Anthropic-backed provider is wired by T2 in lib/integrations/anthropic.ts.
export function getLlm(): LlmProvider {
  // Lazy require to avoid pulling the SDK / mock graph at module load.

  const useMocks = process.env.USE_MOCKS === 'true' || !process.env.ANTHROPIC_API_KEY;
  if (useMocks) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { mockLlm } = require('@/lib/mocks/mock-llm') as typeof import('@/lib/mocks/mock-llm');
    return mockLlm;
  }
  // T2: return real Anthropic provider here once integrations land.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { mockLlm } = require('@/lib/mocks/mock-llm') as typeof import('@/lib/mocks/mock-llm');
  return mockLlm;
}
