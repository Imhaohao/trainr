// Anthropic (Claude) LLM provider — implements LlmProvider (T2). Used by the
// curriculum/compliance generators and by T3's coach.
//
// Default model is claude-sonnet-4-6 (curriculum + compliance + coach); callers
// pass `model: 'claude-opus-4-8'` to upgrade quality on the final handbook.
//
// Prompt caching: when `cache` is true we put a cache_control breakpoint on the
// system block. Render order is tools → system → messages, so the generators
// concatenate their reused content (instructions + business profile + research
// context) into `system`; that single breakpoint caches the whole stable prefix
// across the curriculum, per-module, and compliance calls, while the per-call
// ask lives in `messages` after the breakpoint. Verify reuse via
// usage.cache_read_input_tokens.
//
// Falls back to mock-llm when ANTHROPIC_API_KEY is missing or USE_MOCKS==='true'.
// Per the build rules we never check-and-fail on the key — absence selects mock.

import Anthropic from '@anthropic-ai/sdk';
import type { GenerateOpts, LlmMessage, LlmProvider } from '../contracts/llm';
import { mockLlm } from '../mocks/mock-llm';

export const SONNET = 'claude-sonnet-4-6';
export const OPUS = 'claude-opus-4-8';
const DEFAULT_MODEL = SONNET;
const DEFAULT_MAX_TOKENS = 16_000;

// One client per process; survives Next.js HMR via globalThis. The SDK reads
// ANTHROPIC_API_KEY from the environment.
const g = globalThis as unknown as { __trainrAnthropic?: Anthropic };

function client(): Anthropic {
  if (!g.__trainrAnthropic) g.__trainrAnthropic = new Anthropic();
  return g.__trainrAnthropic;
}

function buildSystem(
  system: string | undefined,
  cache: boolean | undefined,
): Anthropic.MessageCreateParams['system'] {
  if (!system) return undefined;
  if (!cache) return system;
  return [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }];
}

function toMessages(messages: LlmMessage[]): Anthropic.MessageParam[] {
  return messages.map((m) => ({ role: m.role, content: m.content }));
}

// Only the fields we actually set — assignable to both create() (with an added
// stream flag) and stream(). Keeps us off the union types whose output_config
// shapes differ between the create and streaming helpers.
type BaseParams = Pick<
  Anthropic.MessageCreateParamsNonStreaming,
  'model' | 'max_tokens' | 'messages' | 'system' | 'tools'
>;

function baseParams(opts: GenerateOpts): BaseParams {
  const params: BaseParams = {
    model: opts.model ?? DEFAULT_MODEL,
    max_tokens: opts.maxTokens ?? DEFAULT_MAX_TOKENS,
    messages: toMessages(opts.messages),
  };
  const system = buildSystem(opts.system, opts.cache);
  if (system) params.system = system;
  if (opts.tools && opts.tools.length > 0) {
    params.tools = opts.tools as Anthropic.MessageCreateParams['tools'];
  }
  return params;
}

export const anthropicLlm: LlmProvider = {
  async generate(opts: GenerateOpts): Promise<string> {
    const res = await client().messages.create({
      ...baseParams(opts),
      stream: false,
    });
    return res.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('');
  },

  async *stream(opts: GenerateOpts): AsyncIterable<string> {
    const s = client().messages.stream(baseParams(opts));
    for await (const event of s) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        yield event.delta.text;
      }
    }
  },
};

/**
 * Resolve the active LlmProvider: real Anthropic when a key is present and mocks
 * aren't forced, otherwise the deterministic offline mock. Single source of
 * truth; `lib/contracts/llm.ts#getLlm` delegates here.
 */
export function getLlm(): LlmProvider {
  const useMocks =
    process.env.USE_MOCKS === 'true' || !process.env.ANTHROPIC_API_KEY;
  return useMocks ? mockLlm : anthropicLlm;
}
