// POST /api/business/:id/files (multipart) -> { file }  (StoredFile)
// Phase 0 (owner: T1). Parses multipart, writes to storage via StorageAdapter
// (Tigris or mock), and persists a StoredFile row.

import { nanoid } from 'nanoid';
import { getDb } from '@/lib/contracts/db';
import { getStorage } from '@/lib/contracts/storage';
import { ok, fail } from '@/lib/http';
import type { StoredFile, StoredFileKind } from '@/types';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: businessId } = await params;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fail('Expected multipart/form-data');
  }

  const file = form.get('file');
  if (!(file instanceof File)) return fail('Missing "file" field');

  const kind = (form.get('kind') as StoredFileKind | null) ?? 'upload';
  const fileId = `file_${nanoid(10)}`;
  const key = `${businessId}/uploads/${fileId}`;

  const bytes = Buffer.from(await file.arrayBuffer());
  await getStorage().putObject(
    key,
    bytes,
    file.type || 'application/octet-stream',
  );

  const stored: StoredFile = {
    id: fileId,
    businessId,
    key,
    filename: file.name,
    contentType: file.type || 'application/octet-stream',
    kind,
    createdAt: new Date().toISOString(),
  };
  await getDb().files.create(stored);

  return ok({ file: stored });
}
