import Link from 'next/link';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui';

// Phase 0 scaffold for the intake wizard. Phase 1 replaces this with the full
// 6-step, autosave, dump-friendly wizard (basics → roles → operations →
// recipes → uploads → review/generate) wired to /api/business/:id/intake and
// /api/business/:id/files.
const STEPS = [
  ['Business basics', 'Name, industry, address, state, size, languages, mission.'],
  ['Roles', 'Add roles and mark which are customer-facing.'],
  ['Operations', 'Opening/closing, cleaning, machines, drink production.'],
  ['Recipes', 'Name, ingredients, steps — or upload instead.'],
  ['Uploads', 'Drag in docs and menu images.'],
  ['Review & Generate', 'Kick off the pipeline.'],
];

export default function OnboardingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Set up your training program</h1>
        <p className="text-muted">
          Dump everything you know — Trainr does the structuring. Each step
          autosaves.
        </p>
      </div>

      <ol className="space-y-3">
        {STEPS.map(([title, desc], i) => (
          <li key={title}>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Badge tone="brand">Step {i + 1}</Badge>
                  <CardTitle>{title}</CardTitle>
                </div>
                <CardDescription>{desc}</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted">
                Wizard step UI lands in Phase 1.
              </CardContent>
            </Card>
          </li>
        ))}
      </ol>

      <div className="flex justify-end">
        <Link href="/dashboard">
          <Button>Go to dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
