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
