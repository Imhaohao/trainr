'use client';

import * as React from 'react';
import { Button, Input, Label } from '@/components/ui';
import type { ContextSource } from '@/types';

export interface ContextImportItem {
  id: string;
  label: string;
  kind: 'pdf' | 'google_doc' | 'upload';
  extractedChars?: number;
  preview?: string;
}

interface DirectContextImportProps {
  businessId: string;
  initialSources?: ContextSource[];
  onImported?: (items: ContextImportItem[]) => void;
  compact?: boolean;
}

export function DirectContextImport({
  businessId,
  initialSources = [],
  onImported,
  compact = false,
}: DirectContextImportProps) {
  const [googleDocUrl, setGoogleDocUrl] = React.useState('');
  const [items, setItems] = React.useState<ContextImportItem[]>(() =>
    initialSources.map((s, i) => ({
      id: s.fileId ?? s.url ?? `src_${i}`,
      label: s.label,
      kind: s.type,
    })),
  );
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function importGoogleDoc() {
    const url = googleDocUrl.trim();
    if (!url) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/business/${businessId}/context`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ googleDocUrl: url }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error ?? 'Could not import Google Doc');
        return;
      }
      const item: ContextImportItem = {
        id: url,
        label: 'Google Doc',
        kind: 'google_doc',
        extractedChars: json.data.extractedChars,
        preview: json.data.preview,
      };
      setItems((prev) => [...prev, item]);
      setGoogleDocUrl('');
      onImported?.([item]);
    } finally {
      setBusy(false);
    }
  }

  async function onPdfUpload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setError(null);
    const imported: ContextImportItem[] = [];
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.set('file', file);
        fd.set('kind', 'upload');
        const res = await fetch(`/api/business/${businessId}/files`, {
          method: 'POST',
          body: fd,
        });
        const json = await res.json();
        if (!json.ok) {
          setError(json.error ?? `Upload failed: ${file.name}`);
          continue;
        }
        const item: ContextImportItem = {
          id: json.data.file.id,
          label: file.name,
          kind: 'pdf',
          extractedChars: json.data.extractedChars,
          preview: json.data.preview,
        };
        imported.push(item);
      }
      if (imported.length) {
        setItems((prev) => [...prev, ...imported]);
        onImported?.(imported);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      <p className="text-sm text-muted-foreground">
        Drop a handbook PDF or paste a Google Doc link — we parse it server-side
        and use it when building your training program. Share Google Docs as
        &quot;Anyone with the link can view&quot;.
      </p>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div>
        <Label htmlFor="google-doc-url">Google Doc link</Label>
        <div className="mt-1 flex flex-wrap gap-2">
          <Input
            id="google-doc-url"
            type="url"
            placeholder="https://docs.google.com/document/d/…"
            value={googleDocUrl}
            onChange={(e) => setGoogleDocUrl(e.target.value)}
            className="min-w-[16rem] flex-1"
          />
          <Button
            type="button"
            variant="outline"
            disabled={busy || !googleDocUrl.trim()}
            onClick={() => void importGoogleDoc()}
          >
            Import doc
          </Button>
        </div>
      </div>

      <div>
        <Label htmlFor="context-pdf">PDF upload</Label>
        <Input
          id="context-pdf"
          type="file"
          accept="application/pdf,.pdf"
          multiple
          className="mt-1"
          disabled={busy}
          onChange={(e) => void onPdfUpload(e.target.files)}
        />
      </div>

      {items.length > 0 && (
        <ul className="space-y-2 text-sm">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-md border border-border/60 bg-muted/30 px-3 py-2"
            >
              <div className="font-medium">
                ✓ {item.label}
                {item.extractedChars
                  ? ` · ${item.extractedChars.toLocaleString()} chars parsed`
                  : ''}
              </div>
              {item.preview && (
                <p className="mt-1 line-clamp-2 text-muted-foreground">
                  {item.preview}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
