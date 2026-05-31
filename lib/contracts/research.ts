// Research contract — RTRVR.ai. Impl: T2. Mock: lib/mocks/mock-research.ts
// FROZEN after Phase 0.

import type { ResearchArtifact } from '@/types';

export interface ResearchQuery {
  industry: string;
  state: string;
  queries: string[];
}

export interface ResearchProvider {
  // Also persists structured DOM/JSON to storage (keyed under `${businessId}/research/...`).
  research(input: ResearchQuery): Promise<ResearchArtifact[]>;
}

// Returns the mock provider when USE_MOCKS==='true' or RTRVR_API_KEY is missing.
// The real RTRVR-backed provider is wired by T2 in lib/integrations/rtrvr.ts.
export function getResearch(): ResearchProvider {
  const useMocks = process.env.USE_MOCKS === 'true' || !process.env.RTRVR_API_KEY;
  if (useMocks) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { mockResearch } = require('@/lib/mocks/mock-research') as typeof import('@/lib/mocks/mock-research');
    return mockResearch;
  }
  // T2: return real RTRVR provider here once integrations land.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { mockResearch } = require('@/lib/mocks/mock-research') as typeof import('@/lib/mocks/mock-research');
  return mockResearch;
}
