// POST /api/business/:id/files (multipart) -> { file }  (StoredFile)
// Phase 0 (owner: T1). Parses multipart, writes to storage via StorageAdapter
// (Tigris or mock), and persists a StoredFile row.

import { nanoid } from 'nanoid';
import { getDb } from '@/lib/contracts/db';
import { getStorage } from '@/lib/contracts/storage';
import { ok, fail } from '@/lib/http';
import { ownedBusinessOr403 } from '@/lib/auth';
import {
  appendContextSource,
  extractPdfText,
} from '@/lib/intake/context-extract';
import type { IntakeProfile, StoredFile, StoredFileKind } from '@/types';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: businessId } = await params;

  const owned = await ownedBusinessOr403(businessId);
  if (!owned) return fail('Forbidden.', 403);

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
  const db = getDb();
  await db.files.create(stored);

  let extractedChars: number | undefined;
  let preview: string | undefined;
  const isPdf =
    file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

  if (isPdf) {
    try {
      const extractedText = await extractPdfText(bytes);
      extractedChars = extractedText.length;
      preview = extractedText.slice(0, 400);
      const existing = await db.intake.get(businessId);
      const patch = appendContextSource(
        existing,
        {
          type: 'pdf',
          label: file.name,
          fileId: fileId,
          extractedAt: new Date().toISOString(),
        },
        extractedText,
      );
      const next: IntakeProfile = {
        businessId,
        uploadedFileIds: [
          ...(existing?.uploadedFileIds ?? []),
          fileId,
        ],
        menuImageIds: existing?.menuImageIds ?? [],
        ...existing,
        ...patch,
      };
      if (existing) await db.intake.update(businessId, next);
      else await db.intake.create(next);
    } catch (err) {
      console.error('[files] PDF text extraction failed:', err);
    }
  }

  return ok({ file: stored, extractedChars, preview });
}
