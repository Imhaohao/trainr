# Track 2 — Knowledge & Generation Pipeline (RTRVR · Tigris · Claude curriculum + compliance)

**You own:** the autonomous pipeline that turns owner intake into a training program. The RTRVR research adapter, the Tigris storage adapter, the Claude-powered curriculum + compliance **generators**, and the orchestrator with checkpointing. This is the "agent" core — the part that makes us "Agents That Act," not a chatbot.

**You do NOT touch:** owner/employee UI, `lib/db/` (call via `getDb()`), `lib/coach/`, `lib/opsera|pdf|i18n/`. You produce data; T1/T3/T4 render it.

> ⚠️ Read `node_modules/next/dist/docs/` (route handlers, streaming, server runtime) before writing Next.js 16 code. Use the **`claude-api` skill** for all Anthropic SDK code and **enable prompt caching**. Path alias `@/*` → repo root.
>
> 🚫 **Do not finish until every Definition of Done box is checked** — including a full pipeline run (mock + real) that writes a real `TrainingProgram` + `ComplianceSnapshot` to Tigris + DB.

---

## Wait for Phase 0, then branch `track/2-pipeline`. Build against mocks first.

You consume: `StorageAdapter`, `ResearchProvider`, `LlmProvider`, `getDb()`, and the `types/` entities. Until your real adapters land, use `lib/mocks/*` so you can develop the orchestrator + prompts immediately.

---

## A. Tigris storage adapter (`lib/integrations/tigris.ts`)
- Implement `StorageAdapter` with `@aws-sdk/client-s3` pointed at `AWS_ENDPOINT_URL_S3` (Tigris), `forcePathStyle: true`, `region: 'auto'`, bucket `TIGRIS_BUCKET`.
- `putObject/getObject/list` + `getSignedUrl` via `@aws-sdk/s3-request-presigner`.
- **Key convention (enforce it):** `${businessId}/uploads/...`, `${businessId}/research/<artifactId>.json`, `${businessId}/program/v${n}/program.json` + `.../modules/<id>.md`, `${businessId}/pdf/...`, `${businessId}/i18n/<lang>/...`. Per-business prefix = the "per-business isolation" story.
- Falls back to `mock-storage` when no AWS creds. Export `getStorage()`.
- **Subagent:** spawn a `general-purpose` subagent to confirm the exact Tigris S3 endpoint + any auth quirks from Tigris docs, and return a minimal working client config. Don't read the whole AWS SDK yourself.

## B. RTRVR research adapter (`lib/integrations/rtrvr.ts`)
- Implement `ResearchProvider.research({industry,state,queries})`.
- **First, get RTRVR's real API contract** — spawn a `general-purpose` subagent: "Read rtrvr.ai API docs. Return the exact base URL, auth header, and the request/response schema for their scrape/research endpoint (they advertise a `/scrape` that returns structured DOM trees and cloud/parallel browser automation)." Implement to whatever they actually expose; keep the call behind our interface so the shape change is contained.
- For a boba/food business, fire a curated query set (parameterized by `industry` + `state`):
  - Starbucks/barista onboarding & training structure
  - ServSafe / food-handler certification material
  - `${state}` labor & onboarding requirements (e.g. California)
  - YouTube transcripts of barista/drink-prep tutorials
  - Standardized drink-prep / recipe ratio sources
  - OSHA + ADA + workplace-harassment + industry-association materials
- For each result: store the **structured** payload to Tigris (`${businessId}/research/<id>.json`), persist a `ResearchArtifact` (category, source, title, summary, structuredKey) via `getDb().research.create`. Summary can be a quick Claude condense (cacheable).
- Categorize into `industry_standard | compliance | competitor`.
- Mock returns 4–6 realistic artifacts so downstream gen works offline.

## C. Claude LLM provider (`lib/integrations/anthropic.ts`)
- Implement `LlmProvider` (`generate` + `stream`) with `@anthropic-ai/sdk`. Default model `claude-sonnet-4-6`; allow override to `claude-opus-4-8`.
- **Prompt caching:** mark the system prompt + business profile + research context blocks as cacheable (`cache_control`) so the curriculum, per-module, and compliance calls reuse them. Follow the `claude-api` skill.
- Export `getLlm()` (also used by T3's coach). Falls back to `mock-llm` without a key.

## D. Curriculum generator (`lib/agents/curriculum.ts`)
Input: `Business`, `IntakeProfile`, `ResearchArtifact[]` (+ uploaded file text where available). Output: a complete `TrainingProgram`.
- Generate modules in the PLAN structure:
  - **Module 1 — Company Introduction** (mission, values, expectations, from intake).
  - **Module(s) 2 — Role-Specific** (one per `BusinessRole`; e.g. Barista: drink production from recipes, machine ops; Cashier: POS, customer service). Pull concrete steps from intake recipes + research.
  - **Operations** modules (opening/closing, cleaning) from intake.
  - **Module N — Compliance** (delegated to the compliance generator, §E, then merged in).
- For each module: `contentMarkdown` (clear, employee-readable, short paragraphs + checklists) and a `Quiz` (3–6 questions, mix of multiple-choice + free-response with `rubric` for the coach to grade later). Set `sourceArtifactIds` for provenance (trust + audit story).
- Also produce `scheduleWeeks` (a weekly onboarding plan).
- **Strategy:** generate the program outline in one cached call, then fan out per-module generation. **Use subagents** to generate independent modules in parallel (spawn `general-purpose` subagents, each given the cached context + one module spec, returning that module's markdown+quiz JSON). This both speeds it up and keeps your orchestrator context small. Validate each module against the `TrainingModule` shape with `zod`.

## E. Compliance generator (`lib/agents/compliance.ts`)
- Given `state` + `industry` + the research compliance artifacts, determine applicable laws: **ADA, anti-discrimination/harassment (e.g. CA AB 1825/SB 1343), OSHA workplace safety, `${state}` labor regulations, HIPAA (only if industry warrants)**.
- Produce: one or more compliance `TrainingModule`s (employee-readable) **and** a `ComplianceSnapshot` with `appliedLaws:[{code,title,rationale,moduleIds,status}]` + `programVersion` + `generatedAt`. Persist snapshot via `getDb().compliance.create`.
- This snapshot is what T4's compliance dashboard renders and what proves "compliance automation" to judges — make `rationale` specific ("CA requires harassment training for employers with 5+ employees → Module added").

## F. Orchestrator + checkpointing (`lib/agents/orchestrator.ts`)
- `runPipeline(businessId)`: `research → curriculum → compliance → assemble program → persist`.
- **Checkpoint each stage to Tigris** (`${businessId}/program/v${n}/_checkpoint.json` with stage + partial results) so a failure resumes instead of restarting (the Tigris "agent checkpointing" advantage). On `run`, resume from last checkpoint if present.
- Update `Business.status` and a run-status record so T1's poller (`GET /api/pipeline/:businessId/status`) can show `{stage, pct, programId?}`.
- Persist the final `TrainingProgram` to DB + `${businessId}/program/v${n}/program.json` + per-module `.md` to Tigris.

## G. API routes you own
`POST /api/pipeline/:businessId/run` (kick off; return runId; ideally run in background and report via status), `GET /api/pipeline/:businessId/status`, `GET /api/programs/:businessId`, `PATCH /api/programs/:businessId/modules/:moduleId`. (T1 stubbed these in Phase 0 — replace the bodies.)

---

## Subagent usage (token efficiency — required)
- **Doc digests:** one subagent each for RTRVR, Tigris S3 config — return only the call signatures/config, not raw docs.
- **Parallel module generation:** spawn N subagents to generate the N modules concurrently from shared cached context; you assemble. This is the biggest token + latency win.
- **Don't** paste large research blobs into your own context — store to Tigris and pass keys/summaries; let subagents fetch what they need.

## Definition of Done (do NOT stop until ALL pass)
- [ ] `getStorage()` reads/writes real Tigris objects when creds present (verify a put→get round-trip), mock otherwise.
- [ ] `ResearchProvider` returns categorized `ResearchArtifact[]` and persists structured payloads to Tigris (real RTRVR when key present; rich mock otherwise) — and `// BLOCKED:` + INTEGRATION_LOG note if RTRVR's API shape blocks you.
- [ ] `getLlm()` works with Anthropic key, prompt caching enabled, falls back to mock.
- [ ] `runPipeline()` produces a **valid** `TrainingProgram` (≥8 modules incl. company intro, ≥2 role-specific, operations, compliance), each with `contentMarkdown` + a `Quiz`, plus `scheduleWeeks`, validated with `zod`.
- [ ] A `ComplianceSnapshot` with ≥4 applied laws (ADA, harassment, OSHA, CA labor) with specific rationales is persisted.
- [ ] Stage checkpoints written to Tigris; a re-run resumes rather than restarting.
- [ ] Status endpoint reports progressing stages; `GET /api/programs/:businessId` returns the program; owner `PATCH` edits a module.
- [ ] `npx tsc --noEmit` clean, `npm run build` passes; no edits outside your ownership column (§6).
- [ ] Demo step 3 (pipeline runs with live progress, modules appear) works end-to-end against the fixture business.
