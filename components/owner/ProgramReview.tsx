'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Spinner,
  Textarea,
} from '@/components/ui';
import type { TrainingModule, TrainingProgram } from '@/types';

// Owner program review + inline module editing. Edits PATCH the module via
// /api/programs/:businessId/modules/:moduleId and update local state on success.
export function ProgramReview({
  businessId,
  program,
}: {
  businessId: string;
  program: TrainingProgram;
}) {
  const [modules, setModules] = React.useState<TrainingModule[]>(
    [...program.modules].sort((a, b) => a.order - b.order),
  );
  const [openId, setOpenId] = React.useState<string | null>(null);

  function onSaved(updated: TrainingModule) {
    setModules((prev) =>
      prev.map((m) => (m.id === updated.id ? updated : m)),
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle>Training program</CardTitle>
            <CardDescription>
              Version {program.version} · {modules.length} modules ·{' '}
              {program.status}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Link href="/compliance">
              <Button variant="outline" size="sm">
                Compliance
              </Button>
            </Link>
            <Link href="/deploy">
              <Button size="sm">Publish</Button>
            </Link>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="divide-y divide-border">
          {modules.map((mod) => (
            <ModuleRow
              key={mod.id}
              businessId={businessId}
              module={mod}
              open={openId === mod.id}
              onToggle={() =>
                setOpenId((id) => (id === mod.id ? null : mod.id))
              }
              onSaved={onSaved}
            />
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function ModuleRow({
  businessId,
  module,
  open,
  onToggle,
  onSaved,
}: {
  businessId: string;
  module: TrainingModule;
  open: boolean;
  onToggle: () => void;
  onSaved: (m: TrainingModule) => void;
}) {
  const [editing, setEditing] = React.useState(false);
  const [title, setTitle] = React.useState(module.title);
  const [content, setContent] = React.useState(module.contentMarkdown);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/programs/${businessId}/modules/${module.id}`,
        {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ title, contentMarkdown: content }),
        },
      );
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'Save failed');
      onSaved(json.data.module as TrainingModule);
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    setTitle(module.title);
    setContent(module.contentMarkdown);
    setEditing(false);
    setError(null);
  }

  return (
    <li className="py-3">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onToggle}
          className="flex flex-1 items-center gap-3 text-left"
        >
          <span className="text-sm text-muted">{module.order}.</span>
          <span className="font-medium">{module.title}</span>
          <Badge tone="neutral">{module.type}</Badge>
          {module.quiz && (
            <span className="text-xs text-muted">
              {module.quiz.questions.length} quiz Q
            </span>
          )}
        </button>
        <span className="text-muted">{open ? '▾' : '▸'}</span>
      </div>

      {open && (
        <div className="mt-3 space-y-3 rounded-[var(--radius)] bg-stone-50 p-3">
          {editing ? (
            <>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Module title"
              />
              <Textarea
                rows={10}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="font-mono text-xs"
              />
              {error && <p className="text-sm text-danger">{error}</p>}
              <div className="flex gap-2">
                <Button size="sm" onClick={save} disabled={saving}>
                  {saving ? <Spinner size={14} /> : 'Save'}
                </Button>
                <Button variant="ghost" size="sm" onClick={cancel}>
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <>
              <pre className="max-h-72 overflow-auto whitespace-pre-wrap text-sm text-foreground">
                {module.contentMarkdown}
              </pre>
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                Edit module
              </Button>
            </>
          )}
        </div>
      )}
    </li>
  );
}
