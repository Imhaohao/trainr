# Trainr.ai — Hackathon Master Plan

> AI agent that turns a small/minority-owned business's raw operational knowledge into a structured, multilingual employee training program — with compliance baked in, organizational memory, and an auditable deploy pipeline.
>
> **Theme fit:** "Agents That Act" / Education & Small Business. Not a chatbot — an autonomous pipeline (research → synthesize → localize → comply → deploy) that compresses 60–80 hrs of manual training into minutes.

---

## 0. Read this first (everyone)

- **Stack:** Next.js **16.2.6** full-stack (App Router, TypeScript), React 19, Tailwind v4. **Single repo, single deploy.**
- ⚠️ **Next.js 16 is newer than your training data.** Before writing any Next.js code, read the relevant guide in `node_modules/next/dist/docs/` (route handlers, server actions, app router). `AGENTS.md` enforces this. Do **not** assume `pages/`-era or older App Router APIs.
- **Path alias:** `@/*` → repo root (e.g. `@/types`, `@/lib/contracts/db`).
- **Language:** TypeScript everywhere. No Python service — the agent pipeline runs in Next.js route handlers / server modules.
- **Models:** Employee coach = `claude-sonnet-4-6`. Curriculum + compliance generation = `claude-sonnet-4-6` (default) with `claude-opus-4-8` as an optional quality upgrade for the final handbook. Use the **`claude-api` skill** when writing any Anthropic SDK code, and **enable prompt caching** (system prompt + business profile + research context are reused across calls).
- **Do not run live API calls or check for env keys during dev** unless explicitly told — the user manages keys. Build behind adapters; develop against mocks.

### The four tracks (disjoint ownership — see §6 matrix)
| Track | Owner focus | One-liner |
|---|---|---|
| **T1** | Foundation + Owner experience | Scaffolding, shared contracts (Phase 0), Insforge data layer + auth, owner onboarding wizard & dashboard |
| **T2** | Knowledge & Generation pipeline | RTRVR research adapter, Tigris storage adapter, Claude curriculum + compliance generation, orchestrator |
| **T3** | Employee experience + Coach agent | Employee dashboard, module viewer, quizzes, Claude Sonnet coach with retrieval + Claude Skills |
| **T4** | Deploy + Compliance governance + Demo | Opsera MCP (real scans), publish pipeline, audit trail, PDF export, multilingual layer, compliance dashboard, demo script |

**Golden rule for every track:** _Do not declare your track finished until **every** item in your Definition of Done passes._ That explicitly includes `npm run build` succeeding, `npx tsc --noEmit` clean, your routes returning real (non-error) responses against mocks, and your slice of the demo script working end-to-end. If you hit a blocker you can't resolve, leave a `// BLOCKED:` comment and a note in `docs/INTEGRATION_LOG.md` — do not silently stub-and-claim-done.

---

## 1. Product recap (what we're building)

Two personas, one business:

1. **Owner** (e.g. Mrs. Xiao, Happy Lemon): signs up, creates a business, dumps operational knowledge via an easy wizard (recipes, roles, opening/closing, machines, uploads menu images & docs). Gets a **join code**. Clicks **Generate** → pipeline runs → reviews/edits modules → clicks **Publish**. Sees a compliance dashboard + audit trail.
2. **Employee**: enters the **join code**, lands in a clean dashboard of training modules, takes interactive quizzes, and chats with an **AI coach** that answers from the owner's actual docs/policies ("What do I do if a customer complains?" → cites policy, gives scenarios, grades responses). Think **Duolingo + corporate training**, multilingual.

### The pipeline (server-side, orchestrated)
```
Owner intake  ─▶  RTRVR research ─▶  Tigris (raw + structured)
                        │
                        ▼
              Claude curriculum gen ─▶ modules + SOPs + quizzes + weekly schedule
                        │
                        ▼
              Claude compliance gen ─▶ ADA / CA labor / OSHA / harassment / HIPAA modules + ComplianceSnapshot
                        │
                        ▼
              Tigris (generated program, per-business) + Insforge (metadata)
                        │
                        ▼
              Opsera publish workflow ─▶ validate → PDF → version bump → audit trail → deploy
                        │
                        ▼
              Employee coach (Sonnet) reads program + docs from Tigris
```

### Sponsor mapping (must feel essential, not bolted on)
- **RTRVR.ai** = intelligence acquisition layer (web research/scraping of training standards + compliance).
- **Tigris** = organizational memory layer (per-business S3 buckets: uploads, research, generated modules, PDFs, translations).
- **Insforge** = backend layer for agents (DB + auth + functions): businesses, users, join codes, progress, snapshots, audit.
- **Opsera MCP** = governance & deploy layer (compliance/security/architecture scans + auditable publish pipeline). Targeting the **$500 Opsera MCP track**.

---

## 2. API keys & environment

Create `.env.local` (gitignored). **The user provides keys** — agents must NOT echo, check-for, or hard-fail on keys during dev; read from `process.env` and fall back to mocks when unset.

```bash
# Anthropic (READY)
ANTHROPIC_API_KEY=

# Tigris — S3-compatible (READY)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_ENDPOINT_URL_S3=https://t3.storage.dev   # Tigris endpoint
AWS_REGION=auto
TIGRIS_BUCKET=trainr                          # objects keyed by business id prefix

# RTRVR.ai (READY)
RTRVR_API_KEY=
RTRVR_BASE_URL=https://api.rtrvr.ai           # confirm exact base + /scrape path from their docs

# Opsera MCP (READY) — used by the IDE agent + optional server triggers
OPSERA_MCP_URL=https://mcp.opsera.io/mcp
OPSERA_MCP_TOKEN=

# Insforge (⚠️ KEY NOT CONFIRMED READY — see note)
INSFORGE_API_URL=
INSFORGE_API_KEY=
INSFORGE_PROJECT_ID=

# App
APP_BASE_URL=http://localhost:3000
USE_MOCKS=true   # global flag; flip per-adapter when real creds land
```

> ⚠️ **Insforge key gap.** Insforge was chosen as the DB/auth backend but no Insforge key was confirmed. **T1 must build the data layer behind the `DbRepository` interface** (§4) with two implementations: `InsforgeRepository` (real) and `LocalRepository` (file/SQLite-backed fallback). Selection is via `USE_MOCKS`/presence of `INSFORGE_API_KEY`. The demo must run fully even if Insforge creds never arrive. **Action item: request Insforge project URL + API key from the user ASAP.**

> **Opsera reality check.** Opsera's primary value here is the **MCP DevSecOps agent run by the IDE coding agent** (real compliance/security/architecture scans of our codebase, outputs committed as artifacts) **plus** an in-app publish pipeline that records the governance/audit trail. T4 must actually invoke the Opsera MCP scans and commit the reports — that's the prize-winning evidence. Do not fabricate scan output.

---

## 3. Repo layout & ownership (disjoint by design)

```
trainr/
├─ types/                      # SHARED — frozen after Phase 0 (T1 authors)
│  └─ index.ts
├─ lib/
│  ├─ contracts/               # SHARED — adapter interfaces, frozen after Phase 0 (T1 authors)
│  │  ├─ db.ts  storage.ts  research.ts  llm.ts
│  ├─ mocks/                   # SHARED — mock impls + demo fixtures (T1 seeds, others extend additively)
│  │  ├─ fixtures.ts  mock-db.ts  mock-storage.ts  mock-research.ts  mock-llm.ts
│  ├─ db/                      # T1 — Insforge + Local repository impls
│  ├─ auth/                    # T1 — session, owner signup, employee join
│  ├─ integrations/            # T2 — tigris.ts, rtrvr.ts, anthropic.ts
│  ├─ agents/                  # T2 — research/curriculum/compliance generators + orchestrator
│  ├─ coach/                   # T3 — retrieval + coach prompt assembly
│  ├─ opsera/                  # T4 — MCP client + publish workflow
│  ├─ pdf/                     # T4 — handbook/module PDF generation
│  └─ i18n/                    # T4 — translation layer + language store
├─ app/
│  ├─ layout.tsx globals.css   # SHARED — Phase 0 (theme, providers, fonts)
│  ├─ page.tsx                 # T1 — landing/role chooser
│  ├─ (auth)/                  # T1 — login, owner signup, employee join
│  ├─ (owner)/
│  │  ├─ layout.tsx            # T1 — owner shell + nav (nav entries for ALL owner routes pre-seeded in Phase 0)
│  │  ├─ onboarding/           # T1 — intake wizard
│  │  ├─ dashboard/            # T1 — program review/edit, generate button
│  │  ├─ compliance/           # T4 — compliance dashboard
│  │  └─ deploy/               # T4 — publish pipeline + audit trail UI
│  ├─ (employee)/              # T3 — employee dashboard, module viewer, quiz, coach chat
│  └─ api/
│     ├─ auth/   business/     # T1
│     ├─ pipeline/ research/ curriculum/ compliance/   # T2  (compliance = generation)
│     ├─ coach/ quiz/ progress/                          # T3
│     └─ deploy/ audit/ compliance-report/               # T4 (compliance-report = governance/snapshot read)
├─ components/
│  ├─ ui/        # SHARED primitives — Phase 0 seeds Button/Card/Input/etc; extend ADDITIVELY (new file per component)
│  ├─ owner/     # T1
│  ├─ employee/  # T3
│  └─ compliance/# T4
├─ skills/        # T3 — Claude Skills for the coach (grading, scenario)
├─ scripts/
│  ├─ seed.ts     # T1 — seed demo business
│  └─ demo/       # T4 — end-to-end demo driver
└─ docs/
   ├─ PLAN.md  INTEGRATION_LOG.md
   └─ tracks/ TRACK_1..4.md
```

**Conflict-avoidance rules**
- `types/index.ts` and `lib/contracts/*` are **frozen** after Phase 0. Need a change? Post in `docs/INTEGRATION_LOG.md`, get a 👍, then edit in a tiny dedicated commit. Never reshape shared types inside a feature commit.
- `components/ui/`: **one component per file**; never reorganize someone else's file. Additive only.
- `package.json`: Phase 0 installs all known core deps. Niche deps go in small dedicated commits; resolve conflicts by **union** (keep both). Run `npm install` after every rebase.
- Each track works on a branch `track/<n>-<slug>` off `main` after Phase 0 is merged. **Rebase onto `main` at every integration checkpoint** (§7).

---

## 4. Shared contracts (Phase 0 deliverable — authored by T1, consumed by all)

> These are the seams that let four agents build in parallel without touching each other's code. Implement to these signatures exactly.

### `types/index.ts` (canonical entities)
Entities (full field lists in the T1 brief): `User`, `Business`, `BusinessRole`, `IntakeProfile`, `Recipe`, `StoredFile`, `ResearchArtifact`, `TrainingProgram`, `TrainingModule`, `Quiz`, `QuizQuestion`, `OnboardingWeek`, `EmployeeProgress`, `ComplianceSnapshot`, `AppliedLaw`, `AuditEvent`, `ChatMessage`. Languages are BCP-47 strings (`'en' | 'zh-Hans' | 'zh-Hant' | 'es' | 'vi' | string`).

### `lib/contracts/storage.ts` — Tigris (impl: T2)
```ts
export interface StorageAdapter {
  putObject(key: string, body: Buffer | Uint8Array | string, contentType: string): Promise<void>;
  getObject(key: string): Promise<Buffer>;
  getSignedUrl(key: string, expiresSec?: number): Promise<string>;
  list(prefix: string): Promise<string[]>;
}
// Key convention: `${businessId}/uploads/...`, `${businessId}/research/...`,
//                 `${businessId}/program/v${n}/...`, `${businessId}/pdf/...`, `${businessId}/i18n/<lang>/...`
```

### `lib/contracts/db.ts` — Insforge (impl: T1)
```ts
export interface CrudRepo<T> {
  get(id: string): Promise<T | null>;
  list(filter?: Partial<T>): Promise<T[]>;
  create(value: T): Promise<T>;
  update(id: string, patch: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
}
export interface DbRepository {
  businesses: CrudRepo<Business>;
  users: CrudRepo<User>;
  intake: CrudRepo<IntakeProfile>;
  files: CrudRepo<StoredFile>;
  research: CrudRepo<ResearchArtifact>;
  programs: CrudRepo<TrainingProgram>;
  progress: CrudRepo<EmployeeProgress>;
  compliance: CrudRepo<ComplianceSnapshot>;
  audit: CrudRepo<AuditEvent>;
  chat: CrudRepo<ChatMessage>;
  findBusinessByJoinCode(code: string): Promise<Business | null>;
}
export function getDb(): DbRepository; // returns Insforge or Local based on env
```

### `lib/contracts/research.ts` — RTRVR (impl: T2)
```ts
export interface ResearchQuery { industry: string; state: string; queries: string[]; }
export interface ResearchProvider {
  research(input: ResearchQuery): Promise<ResearchArtifact[]>; // also persists structured DOM/JSON to storage
}
```

### `lib/contracts/llm.ts` — Anthropic (impl: T2; T3 uses for coach)
```ts
export interface LlmMessage { role: 'user' | 'assistant'; content: string; }
export interface GenerateOpts {
  model?: string; system?: string; messages: LlmMessage[];
  maxTokens?: number; cache?: boolean; tools?: unknown[];
}
export interface LlmProvider {
  generate(opts: GenerateOpts): Promise<string>;
  stream(opts: GenerateOpts): AsyncIterable<string>;
}
export function getLlm(): LlmProvider;
```

Every adapter ships a **mock** in `lib/mocks/` returning the demo fixture so UI tracks build immediately.

---

## 5. API route contract (App Router `app/api/**/route.ts`)

> Request/response bodies use the `types/` entities. All routes return `{ ok: true, data }` or `{ ok: false, error }`. Auth via session cookie (T1). Owner-only routes check `role === 'owner'`.

**T1 (auth + business)**
- `POST /api/auth/owner/signup` `{name,email,password?}` → `{user, business?}`
- `POST /api/auth/login` → `{user}`
- `POST /api/auth/employee/join` `{joinCode,name}` → `{user, businessId}`
- `POST /api/business` `{...Business}` → `{business}` (generates joinCode)
- `GET /api/business/:id` · `PATCH /api/business/:id`
- `POST /api/business/:id/intake` `{...IntakeProfile}`
- `POST /api/business/:id/files` (multipart) → uploads to Tigris via `StorageAdapter`, returns `StoredFile`

**T2 (pipeline)**
- `POST /api/pipeline/:businessId/run` → starts research→curriculum→compliance; returns `{runId}`
- `GET /api/pipeline/:businessId/status` → `{stage, pct, programId?}` (checkpointed)
- `GET /api/programs/:businessId` → `{program}`
- `PATCH /api/programs/:businessId/modules/:moduleId` (owner edit) → `{module}`

**T3 (employee)**
- `POST /api/coach/:businessId/chat` `{sessionId,message}` → **streamed** assistant tokens + citations
- `POST /api/quiz/:moduleId/grade` `{answers}` → `{score, perQuestion, feedback}`
- `GET /api/progress/:employeeId` · `POST /api/progress` `{employeeId,moduleId,status,quizScore}`

**T4 (governance/deploy)**
- `POST /api/deploy/:businessId/publish` → validate→PDF→version bump→audit; returns `{version, pdfUrls, auditId}`
- `GET /api/audit/:businessId` → `AuditEvent[]`
- `GET /api/compliance-report/:businessId` → `{snapshot, laws}`
- `POST /api/i18n/:businessId/translate` `{lang}` → generates/stores language variants

---

## 6. Ownership matrix (who edits what — keep it disjoint)

| Path | T1 | T2 | T3 | T4 | Phase 0 |
|---|:--:|:--:|:--:|:--:|:--:|
| `types/`, `lib/contracts/`, `lib/mocks/` | author | read | read | read | ✅ frozen |
| `app/layout.tsx`, `globals.css`, `components/ui/*` (seed) | | | | | ✅ |
| `lib/db/`, `lib/auth/`, `app/(auth)/`, `app/(owner)/onboarding|dashboard/`, `app/api/auth|business/`, `components/owner/` | ✅ | | | | |
| `lib/integrations/`, `lib/agents/`, `app/api/pipeline|research|curriculum|compliance/` | | ✅ | | | |
| `app/(employee)/`, `lib/coach/`, `app/api/coach|quiz|progress/`, `components/employee/`, `skills/` | | | ✅ | | |
| `app/(owner)/compliance|deploy/`, `lib/opsera|pdf|i18n/`, `app/api/deploy|audit|compliance-report|i18n/`, `components/compliance/`, `scripts/demo/` | | | | ✅ | |

No two tracks own the same file. The only shared, after-Phase-0 surfaces are `types/`/`contracts/` (frozen) and `components/ui/` (additive, one-file-per-component) and `package.json` (union merges).

---

## 7. Timeline & integration checkpoints (phase-based, not clock-rigid)

- **Phase 0 — Foundation (T1 solo, ~60–90 min, blocking).** Everyone waits. T1 lands: shared types, contracts, all mocks + demo fixture, theme/layout, owner nav skeleton (incl. links to T4 routes), seeded `getDb()/getLlm()` switches, `env.local.example`, stub route handlers that return mock data for every endpoint in §5. Merge to `main`. **Then the other three branch.**
- **Phase 1 — Parallel build against mocks.** All four build their UI/logic against mocks. No real keys needed. Frequent rebase.
- **CP-1 (integration #1):** T1 auth+business real (Insforge or Local), T2 pipeline runs end-to-end against **mock** RTRVR/LLM and **real or mock** Tigris, T3 coach works against mock program, T4 publish writes audit + generates a PDF. Rebase all → smoke test the happy path.
- **Phase 2 — Real integrations.** Swap mocks for real adapters as keys land (Tigris, RTRVR, Anthropic, Insforge, Opsera). `USE_MOCKS=false` per adapter.
- **CP-2 (integration #2):** Full demo dry-run via `scripts/demo/` (T4). Fix seams.
- **Phase 3 — Polish & demo.** T4 owns demo script + deploy (Render/Vercel). Run Opsera MCP scans, commit reports. Rehearse the 2-minute judge flow.

`docs/INTEGRATION_LOG.md` is the async channel: contract change requests, "X is ready", blockers.

---

## 8. Demo script (target: judge sees value in <2 min)

Business: Asian-immigrant-owned Happy Lemon, California, 20 employees, recipes uploaded.
1. Owner signs up → creates "Happy Lemon — Mission St" → gets join code `HLEMON`.
2. Owner dumps intake (pre-filled from fixture in demo mode) + uploads menu image & recipe PDF → clicks **Generate**.
3. Pipeline (RTRVR → curriculum → compliance) runs with a live progress bar; modules stream in.
4. Owner sees **8 modules** (company intro, role-specific barista/cashier, operations, compliance), quizzes, a weekly schedule; edits one line; clicks **Publish**.
5. **Opsera pipeline** animates: validate → PDF (20-page handbook) → version → audit trail. Compliance dashboard shows ADA / CA labor / OSHA / harassment laws applied with provenance.
6. Switch to employee: enter `HLEMON` → open coach → ask *"What do I do if a customer complains?"* → coach answers from the owner's policy, cites the module, gives a scenario, grades a practice response. Toggle language → 中文.

**What's on screen at the end:** 20-page handbook, 8 modules, quizzes, multilingual support, compliance dashboard, deploy pipeline + audit trail.

---

## 9. Stretch / optional sponsors (only if core is done)
- **NEAR AI** — confidential/verifiable inference for the compliance agent, or user-owned employee records (strong "trust for vulnerable owners" story). Heavy; stretch only.
- **Render** — production deploy target (`render.yaml`) if not using Vercel.
- **Apify** — fallback/secondary scraper if RTRVR coverage is thin.
- **Daytona / Nebius** — sandboxed execution / GPU; not needed for this build.

Keep core (RTRVR + Tigris + Insforge + Opsera + Claude) rock-solid before touching these.
