# Integration Log

Async coordination channel for the 4 tracks. Append-only; newest at top. Use for: contract-change requests (types/contracts are frozen after Phase 0 — propose here, get a 👍, then make a tiny dedicated commit), "X is ready" announcements, and `BLOCKED:` notes.

## Format
```
### [TIME] [TRACK] <title>
status: ready | blocked | proposal | done
detail: ...
```

## Open items
- [ ] **Request Insforge credentials from user** — `INSFORGE_API_URL`, `INSFORGE_API_KEY`, `INSFORGE_PROJECT_ID`. Until then T1 ships on `LocalRepository`. (owner: T1)

## Log
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
