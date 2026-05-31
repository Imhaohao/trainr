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

// Returns the mock provider when USE_MOCKS==='true' or ANTHROPIC_API_KEY is
// missing, otherwise the real Anthropic-backed provider. Selection lives in the
// integration (lib/integrations/anthropic.ts); this stays the stable import surface.
export { getLlm } from '../integrations/anthropic';
