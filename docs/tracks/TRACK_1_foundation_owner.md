# Track 1 — Foundation, Data/Auth (Insforge), Owner Experience

**You own:** Phase 0 (the shared contract everyone depends on), the Insforge-backed data layer + auth, and the entire owner-facing surface (landing, signup/login, employee-join codes, intake wizard, dashboard with the "Generate" trigger and module review/edit).

**You do NOT touch:** `lib/integrations/`, `lib/agents/`, `app/(employee)/`, `lib/coach/`, `app/(owner)/compliance|deploy/`, `lib/opsera|pdf|i18n/`. Consume those via the contracts only.

> ⚠️ Read `node_modules/next/dist/docs/` (route handlers, server actions, app router, layouts) before writing Next.js 16 code — APIs differ from older versions. Path alias `@/*` → repo root.
>
> 🚫 **Do not finish until every Definition of Done box is checked.** That includes `npx tsc --noEmit` clean, `npm run build` passing, and your routes returning real data against the Local/mock DB.

---

## Phase 0 — Foundation sprint (BLOCKING — the other 3 tracks wait on this)

Land this first, merge to `main`, then announce in `docs/INTEGRATION_LOG.md`. Quality here determines whether the other three can work without merge conflicts.

1. **Install core deps** (one commit): `@anthropic-ai/sdk @aws-sdk/client-s3 @aws-sdk/s3-request-presigner zod nanoid clsx`. Add dev/test as needed. Commit `package.json` + lockfile.
2. **`types/index.ts`** — author every entity from PLAN §4 with full fields:
   - `User{id,role,businessId,name,email?,createdAt}`
   - `Business{id,name,industry,address,state,employeeCount,demographics?,languages[],mission?,roles:BusinessRole[],joinCode,ownerId,createdAt,status:'draft'|'researching'|'generating'|'ready'|'published'}`
   - `BusinessRole{id,title,customerFacing,description?}`
   - `IntakeProfile{businessId,openingClosing?,cleaning?,machineOperations?,drinkProduction?,recipes?:Recipe[],notes?,uploadedFileIds[],menuImageIds[]}`
   - `Recipe{name,ingredients[],steps[]}`
   - `StoredFile{id,businessId,key,filename,contentType,kind,language?,createdAt}` where `kind:'upload'|'menu_image'|'research'|'generated_module'|'handbook_pdf'|'translation'`
   - `ResearchArtifact{id,businessId,category:'industry_standard'|'compliance'|'competitor',source,title,summary,structuredKey,createdAt}`
   - `TrainingProgram{id,businessId,version,modules:TrainingModule[],scheduleWeeks?:OnboardingWeek[],status:'generating'|'ready'|'published',generatedAt}`
   - `TrainingModule{id,programId,order,type:'company_intro'|'role_specific'|'compliance'|'operations',roleId?,title,contentMarkdown,languageVariants?:Record<string,string>,quiz?:Quiz,sourceArtifactIds?:string[]}`
   - `Quiz{id,moduleId,questions:QuizQuestion[]}`, `QuizQuestion{id,prompt,type:'multiple_choice'|'free_response',options?,correctIndex?,rubric?}`
   - `OnboardingWeek{week,goals[],moduleIds[]}`
   - `EmployeeProgress{id,employeeId,businessId,moduleId,status:'not_started'|'in_progress'|'completed',quizScore?,completedAt?,certified?}`
   - `ComplianceSnapshot{id,businessId,programVersion,state,industry,appliedLaws:AppliedLaw[],generatedAt}`, `AppliedLaw{code,title,rationale,moduleIds[],status:'satisfied'|'flagged'|'needs_review'}`
   - `AuditEvent{id,businessId,actorId,action,detail,programVersion?,createdAt}`
   - `ChatMessage{id,sessionId,role,content,citations?,createdAt}`
3. **`lib/contracts/`** — `db.ts storage.ts research.ts llm.ts` exactly per PLAN §4 (interfaces + `getDb()`, `getLlm()` factory signatures).
4. **`lib/mocks/`** — `fixtures.ts` (the full Happy Lemon demo business: business, owner+2 employees, intake with 3 boba recipes, a 8-module program with quizzes, a compliance snapshot, sample audit events) + `mock-db.ts` (in-memory `DbRepository`), `mock-storage.ts`, `mock-research.ts` (returns 4–6 realistic boba/food-safety artifacts), `mock-llm.ts` (echoes deterministic module/markdown so UI renders). These fixtures are the lifeblood of parallel dev — make them rich and realistic.
5. **`getDb()` / `getLlm()` factories** that return mock when `USE_MOCKS==='true'` or the relevant key is missing.
6. **App shell:** keep `app/layout.tsx` minimal + add Tailwind theme tokens in `globals.css`; create `components/ui/` primitives (`Button Card Input Textarea Select Badge Progress Tabs Spinner` — one file each, exported from `components/ui/index.ts`).
7. **Owner nav skeleton:** `app/(owner)/layout.tsx` with sidebar nav containing links to **all** owner routes including the ones T4 fills — `/onboarding`, `/dashboard`, `/compliance`, `/deploy`. (Pre-seeding these here means T4 never edits your layout → no conflict.)
8. **Stub every API route in PLAN §5** as `route.ts` files returning mock data via the adapters. This lets T2/T3/T4 call real endpoints from day one. (Each track will replace the bodies in files they own; you only author the auth/business ones for real later, and leave the others as working stubs for their owners to take over — note in INTEGRATION_LOG which stubs belong to whom.)
9. **`env.local.example`** per PLAN §2. **`scripts/seed.ts`** that loads the fixture into the active DB.
10. Commit, `npm run build`, merge to `main`, post "Phase 0 ready" in INTEGRATION_LOG with the contract surface listed.

> **Use a subagent here:** spawn an `Explore` subagent to read `node_modules/next/dist/docs/` and report back the exact Next.js 16 route-handler + server-action signatures, and a `general-purpose` subagent to draft the `lib/mocks/fixtures.ts` Happy Lemon data while you write the contracts. Keep your own context focused on the type/contract design.

---

## Phase 1+ — Your real work (after Phase 0 merged)

### A. Data layer (`lib/db/`)
- `InsforgeRepository implements DbRepository` — wire Insforge tables/collections for each entity. **First, fetch Insforge's quickstart/SDK docs** (spawn a `general-purpose` subagent: "read Insforge docs at their site, return the auth + DB CRUD SDK calls and how to create a project/collection"). Map `CrudRepo<T>` to Insforge calls.
- `LocalRepository implements DbRepository` — SQLite (via `better-sqlite3`) **or** a JSON file under `.data/` if simpler. This is the guaranteed-working fallback (Insforge key is not confirmed).
- `getDb()` picks Insforge when `INSFORGE_API_KEY` present else Local. **Both must pass the same smoke test.**
- Per-business isolation: every query is scoped by `businessId`; never return cross-business rows.

### B. Auth (`lib/auth/`)
- Owner signup/login (Insforge auth if available, else lightweight cookie session + hashed password in Local). Session via httpOnly cookie; helper `getSession()` and `requireOwner()`.
- **Employee join:** `POST /api/auth/employee/join` takes `{joinCode,name}` → `findBusinessByJoinCode` → creates an employee `User` + employee session. No password for employees (low-friction, owners aren't tech-savvy — this matches the product).
- Join codes: short, human-friendly (e.g. `HLEMON`, 6 chars, uppercase, collision-checked) generated on business create.

### C. Owner onboarding wizard (`app/(owner)/onboarding/`)
Multi-step, **dump-friendly** (owners aren't tech-savvy — big inputs, optional fields, "skip for now", autosave each step):
1. Business basics (name, industry dropdown, address, state, # employees, demographics, languages multiselect, mission).
2. Roles (add roles, mark customer-facing — e.g. Barista, Cashier).
3. Operations dump (opening/closing, cleaning, machine ops, drink production — big textareas; "paste anything" energy).
4. Recipes (repeatable name/ingredients/steps; or "upload instead").
5. Uploads (drag-drop docs + menu images → `POST /api/business/:id/files` → Tigris via `StorageAdapter`). Show thumbnails.
6. Review → **"Generate Training Program"** button that calls `POST /api/pipeline/:businessId/run` (T2's endpoint) and routes to the dashboard with a live status poll on `GET /api/pipeline/:businessId/status`.
- Autosave to `IntakeProfile` via `POST /api/business/:id/intake` on each step.

### D. Owner dashboard (`app/(owner)/dashboard/`)
- Business overview + join code (big, copyable, with a "share with employees" hint).
- **Generation status** (poll T2's status endpoint; progress stages: researching → generating → compliance → ready).
- **Program review/edit:** list modules from `GET /api/programs/:businessId`; expand a module to read its markdown + quiz; inline-edit title/content → `PATCH /api/programs/:businessId/modules/:moduleId`. Buttons to jump to Compliance (`/compliance`) and Publish (`/deploy`) — those pages belong to T4, you just link.
- Employee roster + progress summary (read `GET /api/progress/...`, T3's endpoint) — even a simple table.

### E. API routes you own for real
`app/api/auth/**`, `app/api/business/**` (incl. `/intake`, `/files`). File upload route: parse multipart, `storage.putObject(`${businessId}/uploads/${id}`, ...)`, persist `StoredFile` via `db.files.create`.

---

## Subagent usage (token efficiency — required)
- Spawn `Explore` for the Next.js 16 docs sweep and for locating where shared types are used before any contract change.
- Spawn `general-purpose` subagents in parallel for: (a) Insforge SDK doc digest, (b) the rich fixture data, (c) scaffolding the `components/ui` primitives. Keep your main thread on contracts + auth correctness.
- Don't read whole files you didn't write — ask a subagent for the specific signature.

## Definition of Done (do NOT stop until ALL pass)
- [x] Phase 0 merged to `main`: types, contracts, mocks+fixtures, ui primitives, owner nav (with compliance+deploy links), all §5 routes stubbed and returning mock data, seed script, env example.
- [x] `npx tsc --noEmit` clean and `npm run build` passes on `main` after Phase 0.
- [x] `getDb()` returns a working `LocalRepository` with zero external keys; `InsforgeRepository` implemented and selected when key present (or `// BLOCKED:` + INTEGRATION_LOG note if Insforge creds never arrive).
- [x] Owner can: sign up → create business (gets join code) → complete the 6-step wizard with autosave → upload a file that lands in Tigris (or mock) and shows as a `StoredFile` → click Generate (calls T2 endpoint) → see status poll → review & inline-edit a module.
- [x] Employee join: entering the demo join code creates an employee session and redirects to the employee area.
- [x] Every route you own returns `{ok:true,data}` shapes per §5; auth-guards enforce owner-only.
- [x] No edits to files outside your ownership column (§6 matrix). Contract changes (if any) went through INTEGRATION_LOG.
- [x] Demo steps 1–2 and 4 (owner side) work end-to-end against the fixture.
