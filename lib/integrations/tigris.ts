// Tigris storage adapter (S3-compatible) — implements StorageAdapter (T2).
//
// Tigris is an S3-compatible object store (https://t3.storage.dev). We talk to
// it with the AWS SDK v3 pointed at the Tigris endpoint. Every object is keyed
// under a `${businessId}/...` prefix so each business's data is isolated.
//
// Falls back to the in-memory mock (lib/mocks/mock-storage) when AWS creds are
// missing or USE_MOCKS==='true', so the app runs end-to-end with zero keys.
// Per the build rules we never *check-and-fail* on keys — absence just selects
// the mock.

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { StorageAdapter } from '../contracts/storage';
import { mockStorage } from '../mocks/mock-storage';

function bucket(): string {
  return process.env.TIGRIS_BUCKET || 'trainr';
}

// One S3 client per process; survives Next.js HMR via globalThis.
const g = globalThis as unknown as { __trainrS3?: S3Client };

function client(): S3Client {
  if (!g.__trainrS3) {
    g.__trainrS3 = new S3Client({
      region: process.env.AWS_REGION || 'auto',
      endpoint: process.env.AWS_ENDPOINT_URL_S3,
      // Tigris accepts both path-style and virtual-hosted; path-style is the
      // most portable (no per-bucket DNS, reliable presigned URLs).
      forcePathStyle: true,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });
  }
  return g.__trainrS3;
}

class TigrisStorage implements StorageAdapter {
  async putObject(
    key: string,
    body: Buffer | Uint8Array | string,
    contentType: string,
  ): Promise<void> {
    await client().send(
      new PutObjectCommand({
        Bucket: bucket(),
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
  }

  async getObject(key: string): Promise<Buffer> {
    const res = await client().send(
      new GetObjectCommand({ Bucket: bucket(), Key: key }),
    );
    if (!res.Body) throw new Error(`Object not found: ${key}`);
    const bytes = await res.Body.transformToByteArray();
    return Buffer.from(bytes);
  }

  async getSignedUrl(key: string, expiresSec = 3600): Promise<string> {
    return getSignedUrl(
      client(),
      new GetObjectCommand({ Bucket: bucket(), Key: key }),
      { expiresIn: expiresSec },
    );
  }

  async list(prefix: string): Promise<string[]> {
    const keys: string[] = [];
    let token: string | undefined;
    do {
      const res = await client().send(
        new ListObjectsV2Command({
          Bucket: bucket(),
          Prefix: prefix,
          ContinuationToken: token,
        }),
      );
      for (const obj of res.Contents ?? []) {
        if (obj.Key) keys.push(obj.Key);
      }
      token = res.IsTruncated ? res.NextContinuationToken : undefined;
    } while (token);
    return keys;
  }
}

const gAdapter = globalThis as unknown as { __trainrTigris?: TigrisStorage };

/** The real Tigris-backed adapter (singleton). */
export function getTigrisStorage(): StorageAdapter {
  if (!gAdapter.__trainrTigris) gAdapter.__trainrTigris = new TigrisStorage();
  return gAdapter.__trainrTigris;
}

/**
 * Resolve the active StorageAdapter: real Tigris when creds are present and
 * mocks aren't forced, otherwise the in-memory mock. This is the single source
 * of truth for the selection; `lib/contracts/storage.ts#getStorage` delegates
 * here so every consumer gets the same instance.
 */
export function getStorage(): StorageAdapter {
  const useMocks =
    process.env.USE_MOCKS === 'true' ||
    !process.env.AWS_ACCESS_KEY_ID ||
    !process.env.AWS_ENDPOINT_URL_S3;
  return useMocks ? mockStorage : getTigrisStorage();
}

// ---------------------------------------------------------------------------
// Key-convention helpers — enforce the per-business prefix layout everywhere.
// (PLAN §4 / storage contract.)
// ---------------------------------------------------------------------------

export const tigrisKeys = {
  upload: (businessId: string, fileId: string) =>
    `${businessId}/uploads/${fileId}`,
  research: (businessId: string, artifactId: string) =>
    `${businessId}/research/${artifactId}.json`,
  program: (businessId: string, version: number) =>
    `${businessId}/program/v${version}/program.json`,
  module: (businessId: string, version: number, moduleId: string) =>
    `${businessId}/program/v${version}/modules/${moduleId}.md`,
  compliance: (businessId: string, version: number) =>
    `${businessId}/program/v${version}/compliance.json`,
  pdf: (businessId: string, filename: string) =>
    `${businessId}/pdf/${filename}`,
  i18n: (businessId: string, lang: string, filename: string) =>
    `${businessId}/i18n/${lang}/${filename}`,
};
