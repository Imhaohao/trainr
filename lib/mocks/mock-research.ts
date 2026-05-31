// Mock ResearchProvider — returns the realistic boba / food-safety / CA-labor
// artifacts from the fixture, rebound to the requested business id.

import type { ResearchProvider, ResearchQuery } from '../contracts/research';
import type { ResearchArtifact } from '../../types/index';
import { demoResearch } from './fixtures';

export const mockResearch: ResearchProvider = {
  async research(input: ResearchQuery): Promise<ResearchArtifact[]> {
    // In real life RTRVR scrapes the web and persists structured JSON to storage.
    // The mock echoes the fixture artifacts, rebound to the requested business id
    // so downstream generation (which keys everything by businessId) works offline.
    return demoResearch.map((a) => ({
      ...a,
      businessId: input.businessId,
      structuredKey: `${input.businessId}/research/${a.id}.json`,
    }));
  },
};

export function getMockResearch(): ResearchProvider {
  return mockResearch;
}
