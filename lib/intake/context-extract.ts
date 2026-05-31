// Server-side extraction for owner-provided context (PDFs, Word docs, Google Docs).

import type { ContextSource, IntakeProfile } from '@/types';

const MAX_EXTRACT_CHARS = 48_000;
const GOOGLE_DOC_ID =
  /docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/;

export function truncateContext(text: string, max = MAX_EXTRACT_CHARS): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max)}\n\n[… truncated for length …]`;
}

export function parseGoogleDocId(url: string): string | null {
  const match = url.trim().match(GOOGLE_DOC_ID);
  return match?.[1] ?? null;
}

export function googleDocExportUrl(docId: string): string {
  return `https://docs.google.com/document/d/${docId}/export?format=txt`;
}

export async function extractPdfText(bytes: Buffer): Promise<string> {
  // pdf-parse is CJS; dynamic import keeps Next bundling happy.
  const pdfParse = (await import('pdf-parse')).default;
  const result = await pdfParse(bytes);
  return truncateContext(result.text ?? '');
}

export function isPdfFile(name: string, contentType: string): boolean {
  return contentType === 'application/pdf' || name.toLowerCase().endsWith('.pdf');
}

export function isDocxFile(name: string, contentType: string): boolean {
  const lower = name.toLowerCase();
  return (
    contentType ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    lower.endsWith('.docx')
  );
}

export async function extractDocxText(bytes: Buffer): Promise<string> {
  const mammoth = await import('mammoth');
  const result = await mammoth.extractRawText({ buffer: bytes });
  return truncateContext(result.value ?? '');
}

export async function fetchGoogleDocText(url: string): Promise<string> {
  const docId = parseGoogleDocId(url);
  if (!docId) {
    throw new Error(
      'Paste a Google Docs link (Share → Anyone with the link can view).',
    );
  }

  const exportUrl = googleDocExportUrl(docId);
  const res = await fetch(exportUrl, {
    headers: { 'User-Agent': 'Trainr/1.0 (+https://trainr.ai)' },
    redirect: 'follow',
  });

  if (!res.ok) {
    throw new Error(
      `Could not read that Google Doc (${res.status}). Make sure sharing is set to "Anyone with the link can view".`,
    );
  }

  const text = await res.text();
  if (!text.trim()) {
    throw new Error('Google Doc returned empty content.');
  }
  return truncateContext(text);
}

export function formatContextBlock(label: string, text: string): string {
  return `--- ${label} ---\n${text.trim()}`;
}

export function mergeDirectContext(
  existing: string | undefined,
  block: string,
): string {
  const parts = [existing?.trim(), block.trim()].filter(Boolean);
  const merged = parts.join('\n\n');
  return truncateContext(merged);
}

export function appendContextSource(
  intake: IntakeProfile | null | undefined,
  source: ContextSource,
  extractedText: string,
): Pick<IntakeProfile, 'directContext' | 'contextSources'> {
  const label = source.label;
  const block = formatContextBlock(label, extractedText);
  return {
    directContext: mergeDirectContext(intake?.directContext, block),
    contextSources: [...(intake?.contextSources ?? []), source],
  };
}

export function normalizeWebsiteUrl(raw: string): string | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}
