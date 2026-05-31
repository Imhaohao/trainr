// BLOCKED: Insforge API credentials are not confirmed for this project.
// See docs/INTEGRATION_LOG.md — when INSFORGE_API_KEY is set, this module should
// implement DbRepository against Insforge's DB CRUD + auth SDK.
//
// Until then, we delegate to LocalRepository so `getDb()` never fails at runtime.

import type { DbRepository } from '@/lib/contracts/db';
import { getLocalDb } from './local-repository';

let warned = false;

export function getInsforgeDb(): DbRepository {
  if (!warned) {
    warned = true;
    console.warn(
      '[trainr] InsforgeRepository is not implemented yet — using LocalRepository. ' +
        'Request INSFORGE_API_URL + INSFORGE_API_KEY to wire the real adapter.',
    );
  }
  return getLocalDb();
}
