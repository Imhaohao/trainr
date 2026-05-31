'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Progress,
  Select,
  Spinner,
  Textarea,
  cn,
} from '@/components/ui';
import { DirectContextImport } from '@/components/owner/DirectContextImport';
import {
  toBusinessRoles,
  type ExtractedIntake,
} from '@/lib/intake/extract-types';
import { INDUSTRIES } from '@/lib/intake/industries';
import { computeMissingIntakeFields } from '@/lib/intake/missing-fields';
import type {
  Business,
  BusinessRole,
  IntakeProfile,
  LanguageCode,
  Recipe,
  StoredFile,
} from '@/types';

const STEPS = [
  [
    'Import business info',
    'Upload a PDF or Word doc (.docx), or paste a Google Doc with your handbook, SOPs, and recipes.',
  ],
  ['Business basics', 'Name, industry, address, size, languages, mission.'],
  ['Roles', 'Add roles and mark which are customer-facing.'],
  ['Operations', 'Opening/closing, cleaning, machines, drink production.'],
  ['Recipes', 'Name, ingredients, steps — or upload instead.'],
  ['More uploads', 'Extra docs and menu images (optional).'],
  ['Review & Generate', 'Kick off the training pipeline.'],
] as const;

const IMPORT_STEP = 0;

const LANGUAGES: { code: LanguageCode; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'zh-Hans', label: '简体中文' },
  { code: 'zh-Hant', label: '繁體中文' },
  { code: 'es', label: 'Español' },
  { code: 'vi', label: 'Tiếng Việt' },
];

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY',
];

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

interface Basics {
  name: string;
  industry: string;
  address: string;
  state: string;
  employeeCount: number;
  demographics: string;
  languages: LanguageCode[];
  mission: string;
}

interface Ops {
  openingClosing: string;
  cleaning: string;
  machineOperations: string;
  drinkProduction: string;
  notes: string;
}

async function api<T = unknown>(
  path: string,
  method: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(path, {
    method,
    headers: body ? { 'content-type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || 'Request failed');
  return json.data as T;
}

function textToList(value: string): string[] {
  return value
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function OnboardingWizard({
  initialBusiness,
  initialIntake,
  initialFiles,
}: {
  initialBusiness: Business | null;
  initialIntake: IntakeProfile | null;
  initialFiles: StoredFile[];
}) {
  const router = useRouter();
  const hasImportedContext = Boolean(
    initialIntake?.directContext && initialIntake.directContext.length > 80,
  );
  const [step, setStep] = React.useState(hasImportedContext ? 1 : 0);
  const [businessId, setBusinessId] = React.useState<string | null>(
    initialBusiness?.id ?? null,
  );
  const [joinCode, setJoinCode] = React.useState<string | null>(
    initialBusiness?.joinCode ?? null,
  );
  const [saveState, setSaveState] = React.useState<SaveState>('idle');
  const [error, setError] = React.useState<string | null>(null);
  const [generating, setGenerating] = React.useState(false);

  const [basics, setBasics] = React.useState<Basics>({
    name: initialBusiness?.name ?? '',
    industry: initialBusiness?.industry ?? INDUSTRIES[0],
    address: initialBusiness?.address ?? '',
    state: initialBusiness?.state ?? 'CA',
    employeeCount: initialBusiness?.employeeCount ?? 0,
    demographics: initialBusiness?.demographics ?? '',
    languages: initialBusiness?.languages ?? ['en'],
    mission: initialBusiness?.mission ?? '',
  });
  const [roles, setRoles] = React.useState<BusinessRole[]>(
    initialBusiness?.roles ?? [],
  );
  const [ops, setOps] = React.useState<Ops>({
    openingClosing: initialIntake?.openingClosing ?? '',
    cleaning: initialIntake?.cleaning ?? '',
    machineOperations: initialIntake?.machineOperations ?? '',
    drinkProduction: initialIntake?.drinkProduction ?? '',
    notes: initialIntake?.notes ?? '',
  });
  const [recipes, setRecipes] = React.useState<Recipe[]>(
    initialIntake?.recipes ?? [],
  );
  const [files, setFiles] = React.useState<StoredFile[]>(initialFiles);
  const [contextReady, setContextReady] = React.useState(hasImportedContext);
  const [prefilledFromDoc, setPrefilledFromDoc] = React.useState(false);
  const [extracting, setExtracting] = React.useState(false);

  const missingFields = React.useMemo(
    () =>
      computeMissingIntakeFields({
        name: basics.name,
        address: basics.address,
        employeeCount: basics.employeeCount,
        mission: basics.mission,
        demographics: basics.demographics,
        rolesCount: roles.filter((r) => r.title.trim()).length,
        openingClosing: ops.openingClosing,
        cleaning: ops.cleaning,
        machineOperations: ops.machineOperations,
        drinkProduction: ops.drinkProduction,
        recipesCount: recipes.filter((r) => r.name.trim()).length,
      }),
    [basics, roles, ops, recipes],
  );

  const dirty = React.useRef(false);
  const markDirty = () => {
    dirty.current = true;
  };

  // Creates the business on first save if it doesn't exist yet.
  const ensureBusiness = React.useCallback(async (): Promise<string> => {
    if (businessId) return businessId;
    const { business } = await api<{ business: Business }>(
      '/api/business',
      'POST',
      {
        name: basics.name || 'Untitled Business',
        industry: basics.industry,
        address: basics.address,
        state: basics.state,
        employeeCount: basics.employeeCount,
        demographics: basics.demographics || undefined,
        languages: basics.languages,
        mission: basics.mission || undefined,
        roles,
      },
    );
    setBusinessId(business.id);
    setJoinCode(business.joinCode);
    return business.id;
  }, [businessId, basics, roles]);

  const saveAll = React.useCallback(async () => {
    setSaveState('saving');
    setError(null);
    try {
      const id = await ensureBusiness();
      await api(`/api/business/${id}`, 'PATCH', {
        name: basics.name || 'Untitled Business',
        industry: basics.industry,
        address: basics.address,
        state: basics.state,
        employeeCount: Number(basics.employeeCount) || 0,
        demographics: basics.demographics || undefined,
        languages: basics.languages,
        mission: basics.mission || undefined,
        roles,
      });
      await api(`/api/business/${id}/intake`, 'POST', {
        openingClosing: ops.openingClosing || undefined,
        cleaning: ops.cleaning || undefined,
        machineOperations: ops.machineOperations || undefined,
        drinkProduction: ops.drinkProduction || undefined,
        notes: ops.notes || undefined,
        recipes,
        uploadedFileIds: files
          .filter((f) => f.kind !== 'menu_image')
          .map((f) => f.id),
        menuImageIds: files
          .filter((f) => f.kind === 'menu_image')
          .map((f) => f.id),
      });
      setSaveState('saved');
      dirty.current = false;
    } catch (e) {
      setSaveState('error');
      setError(e instanceof Error ? e.message : 'Autosave failed');
    }
  }, [ensureBusiness, basics, roles, ops, recipes, files]);

  // Debounced autosave after edits (only once the user has touched something).
  React.useEffect(() => {
    if (!dirty.current) return;
    const t = setTimeout(() => {
      void saveAll();
    }, 900);
    return () => clearTimeout(t);
  }, [basics, roles, ops, recipes, saveAll]);

  async function onUpload(fileList: FileList | null, kind: StoredFile['kind']) {
    if (!fileList || fileList.length === 0) return;
    setError(null);
    try {
      const id = await ensureBusiness();
      for (const file of Array.from(fileList)) {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('kind', kind);
        const res = await fetch(`/api/business/${id}/files`, {
          method: 'POST',
          body: fd,
        });
        const json = await res.json();
        if (!json.ok) throw new Error(json.error || 'Upload failed');
        setFiles((prev) => [...prev, json.data.file as StoredFile]);
      }
      markDirty();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    }
  }

  function applyExtracted(data: ExtractedIntake) {
    if (data.name?.trim()) setBasics((b) => ({ ...b, name: data.name!.trim() }));
    if (
      data.industry?.trim() &&
      (INDUSTRIES as readonly string[]).includes(data.industry)
    ) {
      setBasics((b) => ({ ...b, industry: data.industry! }));
    }
    if (data.address?.trim()) {
      setBasics((b) => ({ ...b, address: data.address!.trim() }));
    }
    if (data.state?.trim()) {
      setBasics((b) => ({ ...b, state: data.state!.trim().toUpperCase().slice(0, 2) }));
    }
    if (data.employeeCount && data.employeeCount > 0) {
      setBasics((b) => ({ ...b, employeeCount: data.employeeCount! }));
    }
    if (data.demographics?.trim()) {
      setBasics((b) => ({ ...b, demographics: data.demographics!.trim() }));
    }
    if (data.mission?.trim()) {
      setBasics((b) => ({ ...b, mission: data.mission!.trim() }));
    }
    if (data.languages?.length) {
      const langs = data.languages as LanguageCode[];
      setBasics((b) => ({ ...b, languages: langs.length ? langs : b.languages }));
    }
    if (data.roles?.length) {
      setRoles(toBusinessRoles(data.roles));
    }
    if (data.openingClosing?.trim()) {
      setOps((o) => ({ ...o, openingClosing: data.openingClosing!.trim() }));
    }
    if (data.cleaning?.trim()) {
      setOps((o) => ({ ...o, cleaning: data.cleaning!.trim() }));
    }
    if (data.machineOperations?.trim()) {
      setOps((o) => ({
        ...o,
        machineOperations: data.machineOperations!.trim(),
      }));
    }
    if (data.drinkProduction?.trim()) {
      setOps((o) => ({
        ...o,
        drinkProduction: data.drinkProduction!.trim(),
      }));
    }
    if (data.notes?.trim()) {
      setOps((o) => ({ ...o, notes: data.notes!.trim() }));
    }
    if (data.recipes?.length) {
      setRecipes(
        data.recipes.map((r) => ({
          name: r.name.trim(),
          ingredients: r.ingredients ?? [],
          steps: r.steps ?? [],
        })),
      );
    }
    markDirty();
    setPrefilledFromDoc(true);
  }

  async function runExtractAndAdvance() {
    setExtracting(true);
    setError(null);
    try {
      const id = await ensureBusiness();
      await saveAll();
      const res = await fetch(`/api/business/${id}/intake/extract`, {
        method: 'POST',
      });
      const json = await res.json();
      if (!json.ok) {
        throw new Error(json.error || 'Could not read your document');
      }
      applyExtracted(json.data.extracted as ExtractedIntake);
      setStep(1);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Extraction failed');
    } finally {
      setExtracting(false);
    }
  }

  async function next() {
    if (step === IMPORT_STEP) {
      if (!contextReady) {
        setError(
          'Upload a PDF or Word doc (.docx), import a Google Doc, or choose “Fill out manually instead”.',
        );
        return;
      }
      await runExtractAndAdvance();
      return;
    }
    await saveAll();
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  }

  function skipToManual() {
    setError(null);
    setContextReady(true);
    setStep(1);
  }

  function back() {
    setStep((s) => Math.max(0, s - 1));
  }

  async function onGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const id = await ensureBusiness();
      await saveAll();
      await api(`/api/pipeline/${id}/run`, 'POST', {});
      router.push('/dashboard');
    } catch (e) {
      setGenerating(false);
      setError(e instanceof Error ? e.message : 'Could not start generation');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Set up your training program</h1>
          <p className="text-muted">
            Start with your handbook or SOP doc when you have one — we pre-fill
            what we can, then you complete the rest. Every step autosaves.
          </p>
        </div>
        <SaveIndicator state={saveState} />
      </div>

      <Progress
        value={((step + 1) / STEPS.length) * 100}
        label={`Step ${step + 1} of ${STEPS.length}: ${STEPS[step][0]}`}
      />

      {joinCode && (
        <p className="text-sm text-muted">
          Your join code:{' '}
          <span className="font-bold tracking-widest text-foreground">
            {joinCode}
          </span>
        </p>
      )}

      <div className="grid gap-6 md:grid-cols-[200px_1fr]">
        {/* Step rail */}
        <ol className="hidden flex-col gap-1 md:flex">
          {STEPS.map(([title], i) => (
            <li key={title}>
              <button
                type="button"
                onClick={() => setStep(i)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-[var(--radius)] px-3 py-2 text-left text-sm transition',
                  i === step
                    ? 'bg-brand-soft font-medium text-brand-foreground'
                    : 'text-muted hover:bg-brand-soft hover:text-foreground',
                )}
              >
                <span
                  className={cn(
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs',
                    i < step
                      ? 'bg-success text-white'
                      : i === step
                        ? 'bg-brand text-brand-foreground'
                        : 'bg-stone-200 text-stone-600',
                  )}
                >
                  {i < step ? '✓' : i + 1}
                </span>
                {title}
              </button>
            </li>
          ))}
        </ol>

        {/* Step content */}
        <Card>
          <CardHeader>
            <CardTitle>{STEPS[step][0]}</CardTitle>
            <CardDescription>{STEPS[step][1]}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === IMPORT_STEP && (
              <ImportStep
                businessId={businessId}
                onEnsureBusiness={ensureBusiness}
                onContextReady={() => setContextReady(true)}
              />
            )}
            {step > IMPORT_STEP && step < STEPS.length - 1 && (
              <MissingFieldsBanner
                missing={missingFields}
                prefilledFromDoc={prefilledFromDoc}
              />
            )}
            {step === 1 && (
              <BasicsStep
                basics={basics}
                onChange={(patch) => {
                  markDirty();
                  setBasics((b) => ({ ...b, ...patch }));
                }}
              />
            )}
            {step === 2 && (
              <RolesStep
                roles={roles}
                onChange={(next) => {
                  markDirty();
                  setRoles(next);
                }}
              />
            )}
            {step === 3 && (
              <OpsStep
                ops={ops}
                onChange={(patch) => {
                  markDirty();
                  setOps((o) => ({ ...o, ...patch }));
                }}
              />
            )}
            {step === 4 && (
              <RecipesStep
                recipes={recipes}
                onChange={(next) => {
                  markDirty();
                  setRecipes(next);
                }}
              />
            )}
            {step === 5 && (
              <UploadsStep files={files} onUpload={onUpload} />
            )}
            {step === 6 && (
              <ReviewStep
                basics={basics}
                roles={roles}
                recipes={recipes}
                files={files}
              />
            )}

            {error && <p className="text-sm text-danger">{error}</p>}
          </CardContent>
        </Card>
      </div>

      {/* Footer nav */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="ghost" onClick={back} disabled={step === 0}>
          Back
        </Button>
        {step === IMPORT_STEP ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" onClick={skipToManual}>
              Fill out manually instead
            </Button>
            <Button onClick={next} disabled={extracting || !contextReady}>
              {extracting ? (
                <>
                  <Spinner size={16} /> Reading document…
                </>
              ) : (
                'Continue with document'
              )}
            </Button>
          </div>
        ) : step < STEPS.length - 1 ? (
          <Button onClick={next}>Save & continue</Button>
        ) : (
          <Button onClick={onGenerate} disabled={generating}>
            {generating ? (
              <>
                <Spinner size={16} /> Starting…
              </>
            ) : (
              'Generate training program'
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

function MissingFieldsBanner({
  missing,
  prefilledFromDoc,
}: {
  missing: string[];
  prefilledFromDoc: boolean;
}) {
  if (!missing.length && !prefilledFromDoc) return null;
  return (
    <div className="rounded-[var(--radius)] border border-brand/40 bg-brand-soft px-4 py-3 text-sm">
      {prefilledFromDoc && (
        <p className="font-medium text-brand-foreground">
          We pre-filled fields from your document. Complete anything still
          missing below.
        </p>
      )}
      {missing.length > 0 && (
        <p className={prefilledFromDoc ? 'mt-2 text-muted' : 'text-muted'}>
          Still needed: {missing.join(' · ')}
        </p>
      )}
    </div>
  );
}

function ImportStep({
  businessId,
  onEnsureBusiness,
  onContextReady,
}: {
  businessId: string | null;
  onEnsureBusiness: () => Promise<string>;
  onContextReady: () => void;
}) {
  const [readyId, setReadyId] = React.useState<string | null>(businessId);
  const [booting, setBooting] = React.useState(!businessId);

  React.useEffect(() => {
    if (businessId) {
      setReadyId(businessId);
      setBooting(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const id = await onEnsureBusiness();
        if (!cancelled) setReadyId(id);
      } finally {
        if (!cancelled) setBooting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [businessId, onEnsureBusiness]);

  if (booting || !readyId) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted">
        <Spinner size={16} /> Preparing upload…
      </p>
    );
  }

  return (
    <DirectContextImport
      businessId={readyId}
      onImported={() => onContextReady()}
    />
  );
}

function SaveIndicator({ state }: { state: SaveState }) {
  if (state === 'idle') return null;
  const map: Record<Exclude<SaveState, 'idle'>, { tone: 'accent' | 'success' | 'danger'; label: string }> = {
    saving: { tone: 'accent', label: 'Saving…' },
    saved: { tone: 'success', label: 'Saved' },
    error: { tone: 'danger', label: 'Save failed' },
  };
  const { tone, label } = map[state];
  return (
    <Badge tone={tone}>
      {state === 'saving' && <Spinner size={12} className="mr-1" />}
      {label}
    </Badge>
  );
}

function BasicsStep({
  basics,
  onChange,
}: {
  basics: Basics;
  onChange: (patch: Partial<Basics>) => void;
}) {
  function toggleLang(code: LanguageCode) {
    const has = basics.languages.includes(code);
    const next = has
      ? basics.languages.filter((l) => l !== code)
      : [...basics.languages, code];
    onChange({ languages: next.length ? next : ['en'] });
  }
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="name">Business name</Label>
          <Input
            id="name"
            value={basics.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="Happy Lemon — Mission St"
          />
        </div>
        <div>
          <Label htmlFor="industry">Industry</Label>
          <Select
            id="industry"
            value={basics.industry}
            onChange={(e) => onChange({ industry: e.target.value })}
          >
            {INDUSTRIES.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="employeeCount">Number of employees</Label>
          <Input
            id="employeeCount"
            type="number"
            min={0}
            value={basics.employeeCount || ''}
            onChange={(e) =>
              onChange({ employeeCount: Number(e.target.value) || 0 })
            }
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            value={basics.address}
            onChange={(e) => onChange({ address: e.target.value })}
            placeholder="2400 Mission St, San Francisco, CA 94110"
          />
        </div>
        <div>
          <Label htmlFor="state">State</Label>
          <Select
            id="state"
            value={basics.state}
            onChange={(e) => onChange({ state: e.target.value })}
          >
            {US_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div>
        <Label>Languages your team speaks</Label>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map((l) => {
            const active = basics.languages.includes(l.code);
            return (
              <button
                key={l.code}
                type="button"
                onClick={() => toggleLang(l.code)}
                className={cn(
                  'rounded-full border px-3 py-1 text-sm transition',
                  active
                    ? 'border-brand bg-brand-soft text-brand-foreground'
                    : 'border-border text-muted hover:bg-brand-soft',
                )}
              >
                {l.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <Label htmlFor="demographics">Team demographics (optional)</Label>
        <Textarea
          id="demographics"
          value={basics.demographics}
          onChange={(e) => onChange({ demographics: e.target.value })}
          placeholder="e.g. Mostly first- and second-generation immigrant staff; many Mandarin and Spanish speakers."
        />
      </div>

      <div>
        <Label htmlFor="mission">Mission / vibe (optional)</Label>
        <Textarea
          id="mission"
          value={basics.mission}
          onChange={(e) => onChange({ mission: e.target.value })}
          placeholder="What do you want every customer and teammate to feel?"
        />
      </div>
    </>
  );
}

function RolesStep({
  roles,
  onChange,
}: {
  roles: BusinessRole[];
  onChange: (next: BusinessRole[]) => void;
}) {
  function addRole() {
    onChange([
      ...roles,
      {
        id: `role_${Math.random().toString(36).slice(2, 8)}`,
        title: '',
        customerFacing: true,
      },
    ]);
  }
  function update(id: string, patch: Partial<BusinessRole>) {
    onChange(roles.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }
  function remove(id: string) {
    onChange(roles.filter((r) => r.id !== id));
  }
  return (
    <div className="space-y-3">
      {roles.length === 0 && (
        <p className="text-sm text-muted">
          Add the roles people are hired into — e.g. Barista, Cashier, Shift
          Lead.
        </p>
      )}
      {roles.map((role) => (
        <div
          key={role.id}
          className="rounded-[var(--radius)] border border-border p-3"
        >
          <div className="flex items-center gap-2">
            <Input
              value={role.title}
              onChange={(e) => update(role.id, { title: e.target.value })}
              placeholder="Role title (e.g. Barista)"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => remove(role.id)}
              aria-label="Remove role"
            >
              ✕
            </Button>
          </div>
          <Textarea
            className="mt-2"
            rows={2}
            value={role.description ?? ''}
            onChange={(e) => update(role.id, { description: e.target.value })}
            placeholder="What does this role do day-to-day?"
          />
          <label className="mt-2 flex items-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              checked={role.customerFacing}
              onChange={(e) =>
                update(role.id, { customerFacing: e.target.checked })
              }
            />
            Customer-facing
          </label>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addRole}>
        + Add role
      </Button>
    </div>
  );
}

function OpsStep({
  ops,
  onChange,
}: {
  ops: Ops;
  onChange: (patch: Partial<Ops>) => void;
}) {
  const fields: [keyof Ops, string, string][] = [
    ['openingClosing', 'Opening & closing', 'Walk through what happens when you open and close.'],
    ['cleaning', 'Cleaning & sanitation', 'Daily/weekly cleaning, sanitizing, who does what.'],
    ['machineOperations', 'Machine operations', 'Sealers, blenders, tea brewers — how to run them safely.'],
    ['drinkProduction', 'Drink production', 'Standard build steps, portions, quality checks.'],
  ];
  return (
    <div className="space-y-4">
      {fields.map(([key, label, placeholder]) => (
        <div key={key}>
          <Label htmlFor={key}>{label}</Label>
          <Textarea
            id={key}
            rows={4}
            value={ops[key]}
            onChange={(e) => onChange({ [key]: e.target.value })}
            placeholder={placeholder}
          />
        </div>
      ))}
      <div>
        <Label htmlFor="notes">Anything else?</Label>
        <Textarea
          id="notes"
          rows={3}
          value={ops.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          placeholder="Paste anything — policies, do's and don'ts, common mistakes."
        />
      </div>
    </div>
  );
}

function RecipesStep({
  recipes,
  onChange,
}: {
  recipes: Recipe[];
  onChange: (next: Recipe[]) => void;
}) {
  function add() {
    onChange([...recipes, { name: '', ingredients: [], steps: [] }]);
  }
  function update(idx: number, patch: Partial<Recipe>) {
    onChange(recipes.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  }
  function remove(idx: number) {
    onChange(recipes.filter((_, i) => i !== idx));
  }
  return (
    <div className="space-y-3">
      {recipes.length === 0 && (
        <p className="text-sm text-muted">
          Add signature recipes, or skip and upload a recipe sheet in the next
          step.
        </p>
      )}
      {recipes.map((recipe, idx) => (
        <div
          key={idx}
          className="rounded-[var(--radius)] border border-border p-3 space-y-2"
        >
          <div className="flex items-center gap-2">
            <Input
              value={recipe.name}
              onChange={(e) => update(idx, { name: e.target.value })}
              placeholder="Recipe name (e.g. Brown Sugar Boba Milk)"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => remove(idx)}
              aria-label="Remove recipe"
            >
              ✕
            </Button>
          </div>
          <div>
            <Label>Ingredients (one per line)</Label>
            <Textarea
              rows={3}
              value={recipe.ingredients.join('\n')}
              onChange={(e) =>
                update(idx, { ingredients: textToList(e.target.value) })
              }
              placeholder={'Tapioca pearls\nBrown sugar syrup\nFresh milk'}
            />
          </div>
          <div>
            <Label>Steps (one per line)</Label>
            <Textarea
              rows={3}
              value={recipe.steps.join('\n')}
              onChange={(e) =>
                update(idx, { steps: textToList(e.target.value) })
              }
              placeholder={'Boil pearls 20 min\nLayer syrup in cup\nAdd milk and pearls'}
            />
          </div>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={add}>
        + Add recipe
      </Button>
    </div>
  );
}

function UploadsStep({
  files,
  onUpload,
}: {
  files: StoredFile[];
  onUpload: (list: FileList | null, kind: StoredFile['kind']) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <UploadBox
          label="Documents"
          hint="Handbooks, recipe sheets, policies (PDF, Word .docx)."
          accept="application/pdf,.pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx"
          onPick={(l) => onUpload(l, 'upload')}
        />
        <UploadBox
          label="Menu images"
          hint="Photos of your menu board or drink list."
          accept="image/*"
          onPick={(l) => onUpload(l, 'menu_image')}
        />
      </div>
      {files.length > 0 && (
        <div>
          <Label>Uploaded ({files.length})</Label>
          <ul className="divide-y divide-border rounded-[var(--radius)] border border-border">
            {files.map((f) => (
              <li
                key={f.id}
                className="flex items-center justify-between gap-2 px-3 py-2 text-sm"
              >
                <span className="truncate">{f.filename}</span>
                <Badge tone={f.kind === 'menu_image' ? 'accent' : 'neutral'}>
                  {f.kind === 'menu_image' ? 'menu image' : 'document'}
                </Badge>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function UploadBox({
  label,
  hint,
  accept,
  onPick,
}: {
  label: string;
  hint: string;
  accept?: string;
  onPick: (list: FileList | null) => void;
}) {
  const ref = React.useRef<HTMLInputElement>(null);
  const [drag, setDrag] = React.useState(false);
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        onPick(e.dataTransfer.files);
      }}
      onClick={() => ref.current?.click()}
      className={cn(
        'flex cursor-pointer flex-col items-center justify-center rounded-[var(--radius)] border-2 border-dashed p-6 text-center transition',
        drag ? 'border-brand bg-brand-soft' : 'border-border hover:bg-brand-soft',
      )}
    >
      <span className="font-medium">{label}</span>
      <span className="mt-1 text-xs text-muted">{hint}</span>
      <span className="mt-2 text-xs text-accent underline">
        Click or drag files here
      </span>
      <input
        ref={ref}
        type="file"
        multiple
        accept={accept}
        className="hidden"
        onChange={(e) => onPick(e.target.files)}
      />
    </div>
  );
}

function ReviewStep({
  basics,
  roles,
  recipes,
  files,
}: {
  basics: Basics;
  roles: BusinessRole[];
  recipes: Recipe[];
  files: StoredFile[];
}) {
  const rows: [string, string][] = [
    ['Business', basics.name || '—'],
    ['Industry', basics.industry],
    ['Location', `${basics.address || '—'} (${basics.state})`],
    ['Employees', String(basics.employeeCount || 0)],
    ['Languages', basics.languages.join(', ')],
    ['Roles', roles.map((r) => r.title).filter(Boolean).join(', ') || '—'],
    ['Recipes', String(recipes.length)],
    ['Uploads', String(files.length)],
  ];
  return (
    <div className="space-y-4">
      <dl className="divide-y divide-border rounded-[var(--radius)] border border-border">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 px-3 py-2 text-sm">
            <dt className="text-muted">{k}</dt>
            <dd className="text-right font-medium">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="text-sm text-muted">
        Generating runs research → curriculum → compliance and builds your
        modules. You can review and edit everything afterward on the dashboard.
      </p>
    </div>
  );
}
