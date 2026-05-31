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

// Returns the mock storage when USE_MOCKS==='true' or AWS creds are missing.
// The real Tigris (S3) adapter is wired by T2 in lib/integrations/tigris.ts.
export function getStorage(): StorageAdapter {
  const useMocks =
    process.env.USE_MOCKS === 'true' ||
    !process.env.AWS_ACCESS_KEY_ID ||
    !process.env.AWS_ENDPOINT_URL_S3;
  if (useMocks) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { mockStorage } = require('@/lib/mocks/mock-storage') as typeof import('@/lib/mocks/mock-storage');
    return mockStorage;
  }
  // T2: return real Tigris adapter here once integrations land.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { mockStorage } = require('@/lib/mocks/mock-storage') as typeof import('@/lib/mocks/mock-storage');
  return mockStorage;
}
