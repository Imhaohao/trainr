// In-memory StorageAdapter — stands in for Tigris (S3) during dev.
// getSignedUrl returns a data: URL so the browser can actually render it.

import type { StorageAdapter } from '@/lib/contracts/storage';

interface StoredBlob {
  body: Buffer;
  contentType: string;
}

const g = globalThis as unknown as { __trainrMockStorage?: Map<string, StoredBlob> };

function store(): Map<string, StoredBlob> {
  if (!g.__trainrMockStorage) g.__trainrMockStorage = new Map();
  return g.__trainrMockStorage;
}

function toBuffer(body: Buffer | Uint8Array | string): Buffer {
  if (typeof body === 'string') return Buffer.from(body, 'utf8');
  return Buffer.from(body);
}

export const mockStorage: StorageAdapter = {
  async putObject(key, body, contentType) {
    store().set(key, { body: toBuffer(body), contentType });
  },

  async getObject(key) {
    const blob = store().get(key);
    if (!blob) throw new Error(`Object not found: ${key}`);
    return blob.body;
  },

  async getSignedUrl(key) {
    const blob = store().get(key);
    if (!blob) {
      // Return a harmless placeholder so UI doesn't hard-crash on demo keys.
      return `data:text/plain;base64,${Buffer.from(`mock:${key}`).toString('base64')}`;
    }
    return `data:${blob.contentType};base64,${blob.body.toString('base64')}`;
  },

  async list(prefix) {
    return [...store().keys()].filter((k) => k.startsWith(prefix));
  },
};

export function getStorage(): StorageAdapter {
  return mockStorage;
}
