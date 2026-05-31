'use client';

import * as React from 'react';
import { Badge, Button, Textarea, Input } from '@/components/ui';
import type { TrainingModule } from '@/types';

type Props = {
  businessId: string;
  module: TrainingModule;
  onSaved: (module: TrainingModule) => void;
};

export function DashboardModuleEditor({ businessId, module, onSaved }: Props) {
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState(module.title);
  const [content, setContent] = React.useState(module.contentMarkdown);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setTitle(module.title);
    setContent(module.contentMarkdown);
  }, [module]);

  async function save() {
    setSaving(true);
    setError(null);
    const res = await fetch(
      `/api/programs/${businessId}/modules/${module.id}`,
      {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ title, contentMarkdown: content }),
      },
    );
    const json = await res.json();
    setSaving(false);
    if (!json.ok) {
      setError(json.error ?? 'Save failed');
      return;
    }
    onSaved(json.data.module);
    setOpen(false);
  }

  return (
    <li className="border-b last:border-b-0">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted/50"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="text-sm tabular-nums text-muted-foreground">
            {module.order}.
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium">{module.title}</p>
            <p className="truncate text-xs text-muted-foreground">
              {module.type.replace(/_/g, ' ')}
            </p>
          </div>
          <Badge tone="neutral">{module.type}</Badge>
        </div>
        {module.quiz ? (
          <span className="shrink-0 text-xs text-muted-foreground">
            {module.quiz.questions.length} quiz Q
          </span>
        ) : null}
      </button>
      {open && (
        <div className="space-y-3 border-t bg-muted/20 px-4 py-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Content (markdown)</label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              className="mt-1 font-mono text-sm"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button size="sm" disabled={saving} onClick={() => void save()}>
            {saving ? 'Saving…' : 'Save module'}
          </Button>
        </div>
      )}
    </li>
  );
}
