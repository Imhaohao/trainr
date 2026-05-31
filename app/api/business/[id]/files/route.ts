// POST /api/business/:id/files (multipart) -> { file }

import { nanoid } from 'nanoid';
import { getDb } from '@/lib/contracts/db';
import { getStorage } from '@/lib/contracts/storage';
import { assertBusinessAccess, requireOwner } from '@/lib/auth/guards';
import {
  appendContextSource,
  extractPdfText,
} from '@/lib/intake/context-extract';
import { ok, fail } from '@/lib/http';
import type { IntakeProfile, StoredFile, StoredFileKind } from '@/types';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireOwner();
  if (!auth.ok) return auth.response;
  const { id: businessId } = await params;
  const denied = await assertBusinessAccess(auth.ctx, businessId);
  if (denied) return denied;

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

  const db = getDb();
  let intake = await db.intake.get(businessId);
  let extractedText: string | undefined;
  let extractedChars = 0;

  const isPdf =
    file.type === 'application/pdf' ||
    file.name.toLowerCase().endsWith('.pdf');

  if (isPdf && kind === 'upload') {
    try {
      extractedText = await extractPdfText(bytes);
      extractedChars = extractedText.length;
      const contextPatch = appendContextSource(
        intake,
        {
          type: 'pdf',
          label: `PDF: ${file.name}`,
          fileId,
          extractedAt: new Date().toISOString(),
        },
        extractedText,
      );

      const next: IntakeProfile = {
        businessId,
        menuImageIds: intake?.menuImageIds ?? [],
        ...intake,
        ...contextPatch,
        uploadedFileIds: [...(intake?.uploadedFileIds ?? []), fileId],
      };
      intake = intake
        ? await db.intake.update(businessId, next)
        : await db.intake.create(next);
    } catch (err) {
      console.error('[files] PDF extraction failed:', err);
    }
  }

  if (!intake || !intake.uploadedFileIds?.includes(fileId)) {
    if (intake) {
      await db.intake.update(businessId, {
        uploadedFileIds:
          kind === 'menu_image'
            ? intake.uploadedFileIds
            : [...(intake.uploadedFileIds ?? []), fileId],
        menuImageIds:
          kind === 'menu_image'
            ? [...(intake.menuImageIds ?? []), fileId]
            : intake.menuImageIds,
      });
    } else {
      await db.intake.create({
        businessId,
        uploadedFileIds: kind === 'menu_image' ? [] : [fileId],
        menuImageIds: kind === 'menu_image' ? [fileId] : [],
      });
    }
  }

  return ok({
    file: stored,
    extractedChars: extractedChars || undefined,
    preview: extractedText?.slice(0, 400),
  });
}
