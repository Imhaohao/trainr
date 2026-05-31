// Storage contract — Tigris (S3-compatible). Impl: T2. Mock: lib/mocks/mock-storage.ts
// FROZEN after Phase 0.
//
// Key convention:
//   `${businessId}/uploads/...`
//   `${businessId}/research/...`
//   `${businessId}/program/v${n}/...`
//   `${businessId}/pdf/...`
//   `${businessId}/i18n/<lang>/...`

export interface StorageAdapter {
  putObject(
    key: string,
    body: Buffer | Uint8Array | string,
    contentType: string,
  ): Promise<void>;
  getObject(key: string): Promise<Buffer>;
  getSignedUrl(key: string, expiresSec?: number): Promise<string>;
  list(prefix: string): Promise<string[]>;
}

// Returns the mock storage when USE_MOCKS==='true' or AWS creds are missing,
// otherwise the real Tigris (S3) adapter. Selection lives in the integration
// (lib/integrations/tigris.ts) so there's a single source of truth; this stays
// the stable import surface every consumer uses.
export { getStorage } from '../integrations/tigris';
