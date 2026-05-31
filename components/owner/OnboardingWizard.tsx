'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { nanoid } from 'nanoid';
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
  Select,
  Textarea,
} from '@/components/ui';
import type { Business, BusinessRole, IntakeProfile, Recipe, User } from '@/types';
import { DirectContextImport } from '@/components/owner/DirectContextImport';

const STEPS = [
  'Business basics',
  'Roles',
  'Operations',
  'Recipes',
  'Your materials',
  'Review & generate',
] as const;

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
];

const LANGUAGE_OPTIONS = [
  { code: 'en', label: 'English' },
  { code: 'zh-Hans', label: 'Chinese (Simplified)' },
  { code: 'zh-Hant', label: 'Chinese (Traditional)' },
  { code: 'es', label: 'Spanish' },
  { code: 'vi', label: 'Vietnamese' },
] as const;

function emptyRecipe(): Recipe {
  return { name: '', ingredients: [''], steps: [''] };
}

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = React.useState(0);
  const [user, setUser] = React.useState<User | null>(null);
  const [business, setBusiness] = React.useState<Business | null>(null);
  const [intake, setIntake] = React.useState<IntakeProfile | null>(null);
  const [roles, setRoles] = React.useState<BusinessRole[]>([]);
  const [recipes, setRecipes] = React.useState<Recipe[]>([emptyRecipe()]);
  const [uploadedFiles, setUploadedFiles] = React.useState<
    { id: string; filename: string; kind: string }[]
  >([]);
  const [languages, setLanguages] = React.useState<string[]>(['en']);
  const [generating, setGenerating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  const businessId = business?.id;

  React.useEffect(() => {
    void (async () => {
      const me = await fetch('/api/auth/me');
      const json = await me.json();
      if (!json.ok) {
        router.replace('/login');
        return;
      }
      setUser(json.data.user);
      if (json.data.user.businessId) {
        const bRes = await fetch(`/api/business/${json.data.user.businessId}`);
        const bJson = await bRes.json();
        if (bJson.ok) {
          setBusiness(bJson.data.business);
          setRoles(bJson.data.business.roles ?? []);
          setLanguages(bJson.data.business.languages ?? ['en']);
        }
        const iRes = await fetch(
          `/api/business/${json.data.user.businessId}/intake`,
        );
        if (iRes.ok) {
          const iJson = await iRes.json();
          if (iJson.ok && iJson.data.intake) {
            setIntake(iJson.data.intake);
            if (iJson.data.intake.recipes?.length) {
              setRecipes(iJson.data.intake.recipes);
            }
          }
        }
      }
    })();
  }, [router]);

  async function ensureBusiness(): Promise<Business | null> {
    if (business) return business;
    const res = await fetch('/api/business', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'My business',
        industry: 'food_service',
        address: '',
        state: 'CA',
        employeeCount: 1,
        languages: ['en'],
        roles: [],
        ownerId: user?.id,
      }),
    });
    const json = await res.json();
    if (!json.ok) {
      setError(json.error ?? 'Could not create business');
      return null;
    }
    setBusiness(json.data.business);
    return json.data.business as Business;
  }

  async function autosaveIntake(patch: Partial<IntakeProfile>) {
    const biz = business ?? (await ensureBusiness());
    if (!biz) return;
    setSaving(true);
    const res = await fetch(`/api/business/${biz.id}/intake`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        ...intake,
        businessId: biz.id,
        recipes,
        ...patch,
      }),
    });
    const json = await res.json();
    setSaving(false);
    if (json.ok) setIntake(json.data.intake);
  }

  async function saveBusinessBasics(form: FormData) {
    const biz = await ensureBusiness();
    if (!biz) return;
    const langs = languages.length ? languages : ['en'];
    const res = await fetch(`/api/business/${biz.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: String(form.get('name') ?? biz.name),
        industry: String(form.get('industry') ?? biz.industry),
        address: String(form.get('address') ?? ''),
        website: String(form.get('website') ?? '') || undefined,
        phone: String(form.get('phone') ?? '') || undefined,
        state: String(form.get('state') ?? 'CA'),
        employeeCount: Number(form.get('employeeCount') ?? 1),
        demographics: String(form.get('demographics') ?? '') || undefined,
        languages: langs,
        mission: String(form.get('mission') ?? '') || undefined,
      }),
    });
    const json = await res.json();
    if (json.ok) setBusiness(json.data.business);
    else setError(json.error);
  }

  async function saveRoles() {
    const biz = await ensureBusiness();
    if (!biz) return;
    const res = await fetch(`/api/business/${biz.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ roles }),
    });
    const json = await res.json();
    if (json.ok) setBusiness(json.data.business);
  }

  async function nextStep() {
    setError(null);
    if (step === 1) await saveRoles();
    if (step === 2) {
      await autosaveIntake({
        openingClosing: intake?.openingClosing,
        cleaning: intake?.cleaning,
        machineOperations: intake?.machineOperations,
        drinkProduction: intake?.drinkProduction,
        notes: intake?.notes,
      });
    }
    if (step === 3) await autosaveIntake({ recipes });
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  async function onUpload(files: FileList | null, kind: 'upload' | 'menu_image') {
    const biz = business ?? (await ensureBusiness());
    if (!biz || !files?.length) return;
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.set('file', file);
      fd.set('kind', kind);
      const res = await fetch(`/api/business/${biz.id}/files`, {
        method: 'POST',
        body: fd,
      });
      const json = await res.json();
      if (json.ok) {
        setUploadedFiles((prev) => [
          ...prev,
          {
            id: json.data.file.id,
            filename: json.data.file.filename,
            kind: json.data.file.kind,
          },
        ]);
      }
    }
  }

  async function runGenerate() {
    const biz = business ?? (await ensureBusiness());
    if (!biz) return;
    setGenerating(true);
    setError(null);
    await autosaveIntake({ recipes });
    const res = await fetch(`/api/pipeline/${biz.id}/run`, { method: 'POST' });
    const json = await res.json();
    setGenerating(false);
    if (!json.ok) {
      setError(json.error ?? 'Could not start generation');
      return;
    }
    router.push('/dashboard');
  }

  if (!user) {
    return <p className="text-muted-foreground text-sm">Loading…</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Set up your training program</h1>
        <p className="text-muted-foreground">
          Dump everything you know — Trainr structures it. Each step autosaves
          {saving ? ' (saving…)' : ''}.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {STEPS.map((label, i) => (
          <Badge key={label} tone={i === step ? 'brand' : 'neutral'}>
            {i + 1}. {label}
          </Badge>
        ))}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {step === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Business basics</CardTitle>
            <CardDescription>
              Name, address, and website — we research your business and nearby
              competitors automatically. Only name is required.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                await saveBusinessBasics(new FormData(e.currentTarget));
                await nextStep();
              }}
            >
              <div>
                <Label htmlFor="name">Business name</Label>
                <Input id="name" name="name" defaultValue={business?.name} required />
              </div>
              <div>
                <Label htmlFor="industry">Industry</Label>
                <Select id="industry" name="industry" defaultValue={business?.industry ?? 'food_service'}>
                  <option value="food_service">Food & beverage</option>
                  <option value="retail">Retail</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="other">Other</option>
                </Select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="address">Street address</Label>
                  <Input
                    id="address"
                    name="address"
                    placeholder="123 Main St, City"
                    defaultValue={business?.address}
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Select id="state" name="state" defaultValue={business?.state ?? 'CA'}>
                    {US_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="website">Website (optional)</Label>
                  <Input
                    id="website"
                    name="website"
                    type="url"
                    placeholder="https://yourbusiness.com"
                    defaultValue={business?.website}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone (optional)</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="(555) 123-4567"
                    defaultValue={business?.phone}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="employeeCount">Number of employees</Label>
                <Input
                  id="employeeCount"
                  name="employeeCount"
                  type="number"
                  min={1}
                  defaultValue={business?.employeeCount ?? 5}
                />
              </div>
              <div>
                <Label>Languages spoken on the floor</Label>
                <div className="mt-2 flex flex-wrap gap-3">
                  {LANGUAGE_OPTIONS.map((lang) => (
                    <label key={lang.code} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={languages.includes(lang.code)}
                        onChange={(e) => {
                          setLanguages((prev) =>
                            e.target.checked
                              ? [...prev, lang.code]
                              : prev.filter((c) => c !== lang.code),
                          );
                        }}
                      />
                      {lang.label}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="demographics">Team demographics (optional)</Label>
                <Textarea id="demographics" name="demographics" rows={2} defaultValue={business?.demographics} />
              </div>
              <div>
                <Label htmlFor="mission">Mission (optional)</Label>
                <Textarea id="mission" name="mission" rows={2} defaultValue={business?.mission} />
              </div>
              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => void nextStep()}>
                  Skip for now
                </Button>
                <Button type="submit">Save & continue</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Roles</CardTitle>
            <CardDescription>Who works the floor? Mark customer-facing roles.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {roles.map((role, idx) => (
              <div key={role.id} className="flex flex-wrap items-end gap-3 rounded-lg border p-3">
                <div className="min-w-[12rem] flex-1">
                  <Label>Title</Label>
                  <Input
                    value={role.title}
                    onChange={(e) => {
                      const next = [...roles];
                      next[idx] = { ...role, title: e.target.value };
                      setRoles(next);
                    }}
                  />
                </div>
                <label className="flex items-center gap-2 pb-2 text-sm">
                  <input
                    type="checkbox"
                    checked={role.customerFacing}
                    onChange={(e) => {
                      const next = [...roles];
                      next[idx] = { ...role, customerFacing: e.target.checked };
                      setRoles(next);
                    }}
                  />
                  Customer-facing
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRoles(roles.filter((_, i) => i !== idx))}
                >
                  Remove
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setRoles([
                  ...roles,
                  { id: `role_${nanoid(6)}`, title: '', customerFacing: true },
                ])
              }
            >
              Add role
            </Button>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setStep(0)}>Back</Button>
              <Button type="button" onClick={() => void nextStep()}>Save & continue</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Operations</CardTitle>
            <CardDescription>Paste SOPs, opening checklists, anything messy.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(
              [
                ['openingClosing', 'Opening & closing'],
                ['cleaning', 'Cleaning & sanitation'],
                ['machineOperations', 'Machines & equipment'],
                ['drinkProduction', 'Drink production'],
                ['notes', 'Anything else'],
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <Label>{label}</Label>
                <Textarea
                  rows={4}
                  className="mt-1"
                  value={(intake?.[key] as string | undefined) ?? ''}
                  onChange={(e) => {
                    setIntake((prev) => ({
                      businessId: businessId ?? '',
                      uploadedFileIds: prev?.uploadedFileIds ?? [],
                      menuImageIds: prev?.menuImageIds ?? [],
                      ...prev,
                      [key]: e.target.value,
                    }));
                  }}
                  onBlur={() => void autosaveIntake({ [key]: intake?.[key] })}
                />
              </div>
            ))}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button type="button" onClick={() => void nextStep()}>Save & continue</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Recipes</CardTitle>
            <CardDescription>Top drinks or prep steps — one block per recipe.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recipes.map((recipe, rIdx) => (
              <div key={rIdx} className="space-y-2 rounded-lg border p-3">
                <Label>Recipe name</Label>
                <Input
                  value={recipe.name}
                  onChange={(e) => {
                    const next = [...recipes];
                    next[rIdx] = { ...recipe, name: e.target.value };
                    setRecipes(next);
                  }}
                />
                <Label>Ingredients (one per line)</Label>
                <Textarea
                  rows={3}
                  value={recipe.ingredients.join('\n')}
                  onChange={(e) => {
                    const next = [...recipes];
                    next[rIdx] = {
                      ...recipe,
                      ingredients: e.target.value.split('\n').filter(Boolean),
                    };
                    setRecipes(next);
                  }}
                />
                <Label>Steps (one per line)</Label>
                <Textarea
                  rows={3}
                  value={recipe.steps.join('\n')}
                  onChange={(e) => {
                    const next = [...recipes];
                    next[rIdx] = {
                      ...recipe,
                      steps: e.target.value.split('\n').filter(Boolean),
                    };
                    setRecipes(next);
                  }}
                />
              </div>
            ))}
            <Button type="button" variant="outline" onClick={() => setRecipes([...recipes, emptyRecipe()])}>
              Add recipe
            </Button>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setStep(2)}>Back</Button>
              <Button type="button" onClick={() => void nextStep()}>Save & continue</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 4 && businessId && (
        <Card>
          <CardHeader>
            <CardTitle>Your materials</CardTitle>
            <CardDescription>
              PDF handbooks and Google Docs — or skip and let us research from
              your address and website.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <DirectContextImport
              businessId={businessId}
              initialSources={intake?.contextSources}
              onImported={() => {
                void fetch(`/api/business/${businessId}/intake`)
                  .then((r) => r.json())
                  .then((json) => {
                    if (json.ok) setIntake(json.data.intake);
                  });
              }}
            />
            <div>
              <Label>Menu images (optional)</Label>
              <Input
                type="file"
                accept="image/*"
                multiple
                className="mt-1"
                onChange={(e) => void onUpload(e.target.files, 'menu_image')}
              />
            </div>
            {uploadedFiles.filter((f) => f.kind === 'menu_image').length > 0 && (
              <ul className="text-sm text-muted-foreground">
                {uploadedFiles
                  .filter((f) => f.kind === 'menu_image')
                  .map((f) => (
                    <li key={f.id}>✓ {f.filename}</li>
                  ))}
              </ul>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setStep(3)}>Back</Button>
              <Button type="button" onClick={() => void nextStep()}>Continue</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 4 && !businessId && (
        <Card>
          <CardContent className="py-8 text-sm text-muted-foreground">
            Save business basics first to upload materials.
          </CardContent>
        </Card>
      )}

      {step === 5 && (
        <Card>
          <CardHeader>
            <CardTitle>Review & generate</CardTitle>
            <CardDescription>
              {business?.name ?? 'Your business'} · join code{' '}
              <span className="font-mono font-bold">{business?.joinCode ?? '…'}</span>{' '}
              after basics are saved.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {roles.length} roles · {recipes.filter((r) => r.name).length} recipes ·{' '}
              {(intake?.contextSources?.length ?? 0) +
                uploadedFiles.filter((f) => f.kind === 'menu_image').length}{' '}
              materials
            </p>
            <p className="text-sm text-muted-foreground">
              We will scrape your website, local listings, and competitors (via
              RTRVR), plus any PDFs and Google Docs you added.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => setStep(4)}>Back</Button>
              <Button type="button" disabled={generating} onClick={() => void runGenerate()}>
                {generating ? 'Starting…' : 'Generate training program'}
              </Button>
              <Link href="/dashboard">
                <Button variant="outline">Skip to dashboard</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
