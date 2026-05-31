# Integration Log

Async coordination channel for the 4 tracks. Append-only; newest at top. Use for: contract-change requests (types/contracts are frozen after Phase 0 — propose here, get a 👍, then make a tiny dedicated commit), "X is ready" announcements, and `BLOCKED:` notes.

## Format
```
### [TIME] [TRACK] <title>
status: ready | blocked | proposal | done
detail: ...
```

## Open items
- (none)

## Log
### [2026-05-31] [T3] BLOCKED(mcp): Equipment sim adapter — fixture-backed boba station
status: blocked
detail: |
  Interactive **Practice Station** (`sim_boba_station`) ships on `mod_drink_build` via `getEquipmentSim()` / `getSimForModule()` in `lib/employee/equipment.ts`. Content is a **clearly labeled fixture** (`lib/employee/equipment-fixture.ts`, `source.kind: "fixture"`).
  **MCP swap:** when an equipment/operating-procedure MCP exists, replace fixture lookup with an MCP tool call returning the same `EquipmentSim` shape scoped by `business_id`, with `source.kind: "mcp"` and `source.ref` / `retrievedAt` from the server.
  Grading: `POST /api/sim/:businessId/grade` → `gradeSimRun()` + scenario-coach debrief (`lib/coach/llm.ts` / mock fallback). Module certification requires **both** quiz pass (if quiz) and sim pass (if `simId`) via `evaluateModuleCompletion()`.

### [Phase 1] [T1] Google Sign-In (OAuth 2.0 Authorization Code flow)
status: ready
detail: "Continue with Google" on /login and /signup. Server-side code flow
  (client secret never reaches the browser), new dep `google-auth-library`.
    - `lib/auth/google.ts`: build consent URL, exchange code→tokens with the
      secret, verify the id_token (signature/iss/aud/exp) via OAuth2Client.
    - `GET /api/auth/google/start`: sets a 10-min httpOnly `trainr_oauth_state`
      CSRF cookie, 307s to Google.
    - `GET /api/auth/google/callback`: constant-time state check, code exchange,
      then find-or-create owner by email (case-insensitive — links to an existing
      email/password owner instead of duplicating), `setSession`, redirect to
      /dashboard. Failures → /login?error=<code>.
    - `components/auth/GoogleButton.tsx` (full-navigation link, not fetch).
    - env: `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` in .env.local (placeholders
      in env.local.example). Register redirect URI in Google console:
      `<APP_BASE_URL>/api/auth/google/callback`.
  Verified: auth URL params correct; /start → 307 to Google + state cookie;
  bad-state callback → /login?error=google_state. tsc + build clean.
  NOTE for all tracks: no contract changes — `User` is unchanged (Google users are
  just owner Users with an email and no credential entry).

### [Phase 1] [T1] Insforge backend live + verified — UNBLOCKED
status: ready
detail: Credentials landed and the `trainr_*` schema was provisioned in Insforge
  (user ran `scripts/insforge-schema.sql`). Verified end-to-end against the live
  backend via `getDb()` → `InsforgeRepository`:
    - All 10 tables reachable (GET /api/database/records/trainr_* → 200).
    - `npm run seed` wrote the full Happy Lemon fixture (1 business, 3 users,
      8-module program, intake/files/compliance/audit/chat) through the adapter.
    - Read-back confirms nested jsonb round-trips (businesses.roles/languages,
      programs.modules) and `findBusinessByJoinCode` (HLEMON → 1 row).
    - Full CRUD contract passes: create → get → update → findByJoinCode
      (case-insensitive) → filtered list → delete.
  `.env.local` flipped to `USE_MOCKS=false`, so the app now runs on Insforge.
  The mock demo bypass (one-click owner page) only applies when USE_MOCKS=true;
  on Insforge the demo logs in normally (xiao@happylemon-demo.com / demo1234 —
  credential provisioned by `npm run seed` via ensureDemoCredential()).

### [Phase 1] [T1] Security hardening + cross-track guard patches
status: ready
detail: Audit follow-ups. T1-owned fixes:
  - env: real keys moved OUT of the tracked `env.local.example` (placeholders
    only) into gitignored `.env.local`; added `SESSION_SECRET` (+ generated one
    in .env.local). NOTE: the committed example never contained the key, so it's
    not in git history — rotate anyway if it was shared elsewhere.
  - Owner signup now REQUIRES a password (min 8 chars) — API (zod) + form.
  - `POST /api/business` is now idempotent per owner: returns the existing
    business instead of creating duplicates.
  - Sign-out added to the owner nav (`components/owner/OwnerNav.tsx` →
    `POST /api/auth/logout`).
  - Demo login made robust on Local/Insforge: the demo credential is auto-seeded
    only in mock mode; `scripts/seed.ts` now provisions it via
    `ensureDemoCredential()` so login works after `npm run seed`.
  - `getDb()` now requires BOTH `INSFORGE_API_URL` and `INSFORGE_API_KEY` before
    selecting Insforge (avoids a runtime throw when only one is set).
  - Added `scripts/insforge-schema.sql` (CREATE TABLE for all 10 `trainr_*`
    tables, camelCase quoted columns, jsonb for nested fields) to unblock the
    real backend.

  ⚠️ CROSS-TRACK PATCHES (T2-owned routes): I added owner-only guards
  (`ownedBusinessOr403`) to three T2 routes because T1's owner UI calls them and
  they were unauthenticated (any client could hit any businessId):
    - `PATCH /api/programs/:businessId/modules/:moduleId` (inline module editor)
    - `POST  /api/pipeline/:businessId/run` (Generate trigger)
    - `GET   /api/pipeline/:businessId/status` (dashboard poll)
  UPDATE (rebase onto T2's pipeline work): T2 implemented the real run/status
  bodies (orchestrator + checkpointed run-status). I kept their bodies and merged
  the owner guard back in at the top of both routes, so the guard survives. The
  module PATCH guard is unchanged.

### [Phase 1] [T1] Auth + owner experience real (CP-1)
status: ready
detail: Owner flow is live end-to-end on the Local/mock backends (verified over HTTP):
  - Auth: signed httpOnly-cookie sessions (`lib/auth/`), scrypt password hashing,
    owner signup/login, employee join (no-password), logout. New routes:
    `POST /api/auth/logout`, `GET /api/auth/me`.
  - Guards: `requireOwnerPage` (server components → redirect /login),
    `requireApiOwner` + `ownedBusinessOr403` (API). Verified: unauth create → 401,
    cross-business intake → 403. Demo affordance: when USE_MOCKS==='true' and no
    session, owner pages resolve the demo owner so the dashboard is one-click.
  - Onboarding: full 6-step wizard (`components/owner/OnboardingWizard.tsx`) with
    debounced autosave to `/api/business/:id` + `/intake` + `/files`, drag-drop
    uploads, and a Generate trigger that calls `POST /api/pipeline/:id/run`.
  - Dashboard: session-scoped business, copyable join code, generation status
    poll (`GenerationPanel`), inline module review/edit (`ProgramReview` →
    `PATCH /api/programs/:businessId/modules/:moduleId`), and employee roster.

### [Phase 1] [T1] Data layer + getDb() selection
status: ready
detail: `lib/db/local-repository.ts` (LocalRepository, persistent JSON under
  .data/db.json, zero external keys) and `lib/db/insforge-repository.ts`
  (InsforgeRepository, PostgREST-style REST per docs.insforge.dev). Updated the
  `getDb()` factory body in `lib/contracts/db.ts` (interface UNCHANGED — still
  frozen): USE_MOCKS==='true' → mock; else INSFORGE_API_KEY → Insforge; else
  Local. `npm run seed` validated against Local (8 modules, join code HLEMON).

### [Phase 1] [T2] Orchestrator + curriculum ready — pipeline runs end-to-end
status: ready
detail: `lib/agents/orchestrator.ts` — `runPipeline(businessId, {runId?})` runs research → curriculum → compliance → assemble → persist. Each stage **checkpoints to Tigris** (`${businessId}/program/v${n}/_checkpoint.json` with stage + partial results); on `run` it resumes from the last checkpoint instead of restarting (reuses already-computed research/curriculum/compliance). Writes a **run-status record** (`${businessId}/program/run-status.json`, exported `getRunStatus(businessId)`) and updates `Business.status` (researching → generating → ready). Final `TrainingProgram` persisted to DB (`getDb().programs.create`, upsert) **and** Tigris (`program.json` + per-module `.md`). New runs bump the version; mid-flight runs resume the in-progress version.
also added (prereq, step D): `lib/agents/curriculum.ts` — `generateCurriculum(input)` → `{ modules, scheduleWeeks }`: company-intro + one module per role + operations modules derived from the intake, each generated by `getLlm()` with a cached system prefix (business profile + intake dump + non-compliance research), plus a weekly onboarding schedule. The orchestrator appends a final compliance week.
routes wired (T2-owned): `POST /api/pipeline/:businessId/run` generates a runId, fires the pipeline in the background (checkpointed so a crash resumes), returns `{runId}`; `GET /api/pipeline/:businessId/status` returns `{stage, pct, programId?, version}` from the run-status (falls back to latest persisted program for the seeded demo business).
verified end-to-end on mocks: happy path → program v1 (12 modules: 1 intro + 2 role + 4 ops + 5 compliance, 4 weeks) in DB + Tigris, snapshot persisted, status ready; re-run → v2; resume from a pre-seeded compliance-stage checkpoint → completes at v1 reusing curriculum (no regen). `tsc` + eslint clean.
NOTE for T1/T4: status `stage` values are `research|curriculum|compliance|assemble|persist|ready|error` (pct 15/45/70/85/95/100/0). Poller should treat `ready` (pct 100, programId set) as done and `error` (with `error` message) as failed.

### [Phase 1] [T2] Compliance generator ready
status: ready
detail: `lib/agents/compliance.ts` — `generateCompliance(input)` returns `{ modules: TrainingModule[], snapshot: ComplianceSnapshot }` and persists the snapshot via `getDb().compliance.create`. Rules engine `determineApplicableLaws(input)` (exported, pure) decides laws from state/industry/employeeCount: harassment (CA SB 1343 ≥5 emp, else EEOC Title VII), OSHA general duty, state labor (CA Labor Code §512, else FLSA), ADA Title III, HIPAA (healthcare only), food-handler (food-service only). Each law → one employee-readable compliance module generated by `getLlm()` with a cached system prefix (business + compliance research context), plus a free-response quiz and matched `sourceArtifactIds` for provenance. Rationales are concrete (e.g. "CA requires harassment training for employers with 5+ employees → module added"). Statuses: satisfied (harassment/OSHA/CA labor) vs needs_review (ADA/HIPAA/food-handler — training covered, owner action outstanding). Per-module LLM failures fall back to deterministic content; runs fully offline on mocks.
input contract (for the orchestrator, T2 step F): `{ businessId, programId, programVersion, state, industry, employeeCount?, research?: ResearchArtifact[], startOrder?, businessName? }`. Returns modules for the orchestrator to merge into the TrainingProgram; compliance owns persisting only the snapshot. Verified end-to-end against the Happy Lemon fixture (5 laws/modules, snapshot persisted) + a TX healthcare branch (HIPAA on, food-handler off). `tsc` + eslint clean.

### [Phase 1] [T2] Claude LLM provider ready
status: ready
detail: `lib/integrations/anthropic.ts` implements `LlmProvider` (`generate` + `stream`) with `@anthropic-ai/sdk`. Default model `claude-sonnet-4-6`; pass `model: 'claude-opus-4-8'` to upgrade. `generate()` is non-streaming and returns concatenated text blocks; `stream()` is an async generator yielding `text_delta`s. Exports `getLlm()`, `anthropicLlm`, and `SONNET`/`OPUS` model constants. Falls back to `mock-llm` when `ANTHROPIC_API_KEY` absent or `USE_MOCKS==='true'`.
prompt caching: when `opts.cache` is true, a `cache_control: {type:'ephemeral'}` breakpoint is placed on the `system` block. Render order is tools → system → messages, so generators should concatenate reused content (instructions + business profile + research context) into `system` and put the per-call ask in `messages` — the system breakpoint then caches the whole stable prefix across curriculum/per-module/compliance calls. Verify via `usage.cache_read_input_tokens`.
contract-touch: `lib/contracts/llm.ts#getLlm` (frozen) now re-exports the selector from the integration. No interface/type changes. `tsc --noEmit` + eslint clean.
note: thinking left off (clean string-in/string-out). T3 coach can pass `tools` (forwarded to the API) and stream tokens directly.

### [Phase 1] [T2] RTRVR research adapter ready
status: ready
detail: `lib/integrations/rtrvr.ts` implements `ResearchProvider` against RTRVR's `POST /scrape` (`https://api.rtrvr.ai/scrape`, `Authorization: Bearer`, returns per-tab `{text, tree, elementLinkRecord}`; `tree` is a stringified accessibility/DOM tree). Flow per query: resolve to an authoritative seed URL + category (parameterized by state for labor/harassment; DuckDuckGo HTML fallback for open queries) → scrape → store structured payload to Tigris `${businessId}/research/<id>.json` → condense a summary via `getLlm()` (cacheable system prompt) → `getDb().research.create`. Targets fire concurrently; a failed scrape is logged and skipped, never sinks the run. Exports `getResearch()`, `rtrvrResearch`, and `buildResearchQueries(industry,state)` (curated set the orchestrator can reuse). Falls back to `mock-research` when `RTRVR_API_KEY` absent or `USE_MOCKS==='true'`.
contract-touch: `lib/contracts/research.ts#getResearch` (frozen) now re-exports the selector from the integration. `tsc --noEmit` + eslint clean.

### [Phase 1] [T2] CONTRACT CHANGE — added `businessId` to `ResearchQuery`
status: done
proposal+rationale: `ResearchProvider.research(input)` must persist artifacts to Tigris under `${businessId}/research/...` and create `ResearchArtifact` rows (which have a required `businessId`), but the frozen `ResearchQuery` carried no business id — making a correct real implementation impossible. Added `businessId: string` as the first field of `ResearchQuery`. This is additive to a type only consumed inside T2 today (no other callers — grep-verified), so blast radius is nil. Orchestrator will pass `businessId` when invoking research. Mock updated to rebind fixture artifacts (id + structuredKey) to the requested business. T1/T3/T4: if you build a `ResearchQuery`, include `businessId`. Shout in this log if this is a problem.

### [Phase 1] [T2] Tigris storage adapter ready
status: ready
detail: `lib/integrations/tigris.ts` implements `StorageAdapter` (AWS SDK v3 → Tigris S3, `forcePathStyle: true`, region `auto`, bucket `TIGRIS_BUCKET`). Exports `getTigrisStorage()` (real singleton), `getStorage()` (mock-vs-real selection), and `tigrisKeys` helpers enforcing the `${businessId}/...` key layout. Falls back to `mock-storage` when AWS creds are absent or `USE_MOCKS==='true'`.
contract-touch: `lib/contracts/storage.ts#getStorage` (frozen) now re-exports the selector from the integration — this is the T1-authored TODO hook, signature unchanged. No interface/type changes. `tsc --noEmit` clean.

### [Phase 1] [T1] BLOCKED→RESOLVED: Insforge credentials
status: done
detail: InsforgeRepository was implemented but unexercised pending a provisioned
  project (`INSFORGE_API_URL`, `INSFORGE_API_KEY`, tables in the public schema with
  jsonb columns for nested fields). Credentials + schema have since landed — see the
  "Insforge backend live + verified" entry above. (owner: T1)

### [Phase 0] [T1] Phase 0 ready — foundation merged to main
status: done
detail: Foundation complete and merged. Other tracks may now branch `track/<n>-<slug>` off `main`.
contract surface (FROZEN — change via proposal in this log):
- `types/index.ts` — all PLAN §4 entities (User, Business, BusinessRole, IntakeProfile, Recipe, StoredFile, ResearchArtifact, TrainingProgram, TrainingModule, Quiz, QuizQuestion, OnboardingWeek, EmployeeProgress, ComplianceSnapshot, AppliedLaw, AuditEvent, ChatMessage) + `ApiResponse<T>` envelope.
- `lib/contracts/` — `db.ts` (`DbRepository`/`CrudRepo<T>` + `getDb()`), `storage.ts` (`StorageAdapter` + `getStorage()`), `research.ts` (`ResearchProvider` + `ResearchQuery`), `llm.ts` (`LlmProvider`/`GenerateOpts` + `getLlm()`).
- `lib/mocks/` — rich Happy Lemon fixture (business, owner + 2 employees, intake w/ 3 recipes, 8-module program w/ quizzes, 4-week schedule, compliance snapshot, research artifacts, files, audit, chat) + in-memory `mock-db`, `mock-storage`, `mock-research`, `mock-llm`.
- Factories: `getDb()` / `getLlm()` / `getStorage()` return mock when `USE_MOCKS==='true'` or the relevant key is missing.
- App shell + theme, `components/ui/*` primitives (Button/Card/Input/Textarea/Select/Badge/Progress/Tabs/Spinner), owner nav (with /compliance + /deploy links pre-seeded for T4).
- Every PLAN §5 route stubbed and returning `{ok,data}` mock data via the adapters; ownership comments mark which track takes over each stub.
- `env.local.example`, `scripts/seed.ts`.
verified: `npx tsc --noEmit` clean; no lint errors in source.
