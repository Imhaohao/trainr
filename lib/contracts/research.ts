// Research contract — RTRVR.ai. Impl: T2. Mock: lib/mocks/mock-research.ts
// FROZEN after Phase 0.

import type { ResearchArtifact } from '../../types/index';

export interface ResearchQuery {
  businessId: string; // per-business isolation: where artifacts are stored/persisted
  industry: string;
  state: string;
  queries: string[];
}

export interface ResearchProvider {
  // Also persists structured DOM/JSON to storage (keyed under `${businessId}/research/...`)
  // and creates a ResearchArtifact per result via getDb().research.create.
  research(input: ResearchQuery): Promise<ResearchArtifact[]>;
}

// Returns the mock provider when USE_MOCKS==='true' or RTRVR_API_KEY is missing,
// otherwise the real RTRVR adapter. Selection lives in the integration
// (lib/integrations/rtrvr.ts); this stays the stable import surface.
export { getResearch } from '../integrations/rtrvr';
