// Mock ResearchProvider — returns the realistic boba / food-safety / CA-labor
// artifacts from the fixture, rebound to the requested business id.

import type { ResearchProvider, ResearchQuery } from '@/lib/contracts/research';
import type { ResearchArtifact } from '@/types';
import { demoResearch } from './fixtures';

export const mockResearch: ResearchProvider = {
  async research(input: ResearchQuery): Promise<ResearchArtifact[]> {
    // In real life RTRVR scrapes the web and persists structured JSON to storage.
    // The mock just echoes the fixture artifacts, lightly filtered by query intent.
    const wantsCompliance = input.queries.some((q) =>
      /law|compliance|osha|ada|harassment|labor|break|food handler/i.test(q),
    );
    const artifacts = demoResearch.filter((a) =>
      wantsCompliance ? true : a.category !== 'compliance' || true,
    );
    return structuredClone(artifacts);
  },
};

export function getMockResearch(): ResearchProvider {
  return mockResearch;
}
