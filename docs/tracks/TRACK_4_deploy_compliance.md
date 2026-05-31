# Track 4 — Deployment, Compliance Governance, Multilingual & Demo (Opsera MCP)

**You own:** the governance/deploy layer + the demo. The Opsera MCP integration (real DevSecOps scans + an in-app publish pipeline), the audit trail, PDF handbook/module export, the multilingual translation layer, the compliance dashboard UI, deployment config, and the end-to-end demo driver. This is the **$500 Opsera MCP track** play and the "auditable, trustworthy for vulnerable owners" pitch.

**You do NOT touch:** owner onboarding/dashboard (T1), pipeline generators (T2), employee/coach UI (T3). You **read** the `TrainingProgram` + `ComplianceSnapshot` they produce and add governance/deploy on top. You **own** the owner subroutes `/compliance` and `/deploy` (T1 pre-seeded nav links — don't edit T1's layout).

> ⚠️ Read `node_modules/next/dist/docs/` before writing Next.js 16 code. Path alias `@/*` → repo root.
>
> 🚫 **Do not finish until every Definition of Done box is checked** — including a real Opsera MCP scan committed as an artifact and a publish run that produces a PDF + audit trail.

---

## Wait for Phase 0, then branch `track/4-deploy`. Build against the fixture program + compliance snapshot.

You consume: `getDb()` (programs, compliance, audit), `getStorage()` (write PDFs + translations to Tigris), `getLlm()` (for translation), and the `types/` entities.

---

## A. Opsera MCP — real DevSecOps usage (the prize evidence)
Opsera's MCP server is at `https://mcp.opsera.io/mcp`. Its main value is **the IDE coding agent running real compliance/security/architecture scans on our codebase** — do this and **commit the outputs** as proof.
- **Connect the Opsera MCP** as a connector for this repo (it exposes natural-language DevSecOps agents). Spawn a `general-purpose` subagent to: connect to `OPSERA_MCP_URL` with `OPSERA_MCP_TOKEN`, enumerate the available Opsera tools (compliance audit, security scan, architecture review, code hardening), and return the tool list + how to invoke each.
- Run, and **save reports to `docs/opsera/`** (committed): (1) **compliance audit** against SOC2/HIPAA-style checklist (relevant — we handle employee PII: names, performance records), (2) **security scan** of the codebase, (3) **architecture review** of the agent pipeline (flag tech debt / dependency risk / security gaps). Act on the high-signal findings.
- Surface these report summaries inside the app's compliance dashboard (§D) as "Platform security: audited by Opsera" — judges see governance is real, not narrative.
- ⚠️ Don't fabricate scan output. If the MCP is unreachable, `// BLOCKED:` + INTEGRATION_LOG note and show the most recent committed report.

## B. In-app publish pipeline (`lib/opsera/` + `app/api/deploy/[businessId]/publish`)
When the owner clicks **Publish New Training**, run a governed pipeline (mirrors Opsera's "compliance delivery pipeline"):
1. **Validate** the program (schema valid via `zod`, all modules have content + quiz, compliance snapshot present & no `flagged` laws — else surface a blocking warning).
2. **Generate PDFs** (§C): a full handbook + per-module PDFs → Tigris (`${businessId}/pdf/...`).
3. **Version bump** the `TrainingProgram` (increment `version`, set `status:'published'`).
4. **Audit trail:** write `AuditEvent`s for `generate/compliance_scan/publish/deploy` with actor + detail + version (PLAN §4). 
5. **Notify** (stub or console/toast) "new training published".
- Where Opsera exposes an API/MCP action to trigger a real CI/governance run, call it here too (best-effort); otherwise this in-app pipeline + the committed MCP scans together tell the Opsera story.
- Show the pipeline as an **animated stepper** on `/deploy` (validate → PDF → version → audit → deployed) — great demo visual.

## C. PDF export (`lib/pdf/`)
- Generate a polished **20-page-ish handbook** (cover with business name/mission, table of contents, all modules, compliance section, sign-off page) + optional per-module PDFs.
- Use a TS-friendly approach: `@react-pdf/renderer` **or** server-side HTML→PDF (`puppeteer`/`playwright` — heavier) — pick the lightest that works; spawn a subagent to evaluate and scaffold it. Upload via `getStorage().putObject`, store `StoredFile{kind:'handbook_pdf'}`, return signed URLs from publish.

## D. Compliance dashboard (`app/(owner)/compliance/` + `app/api/compliance-report/[businessId]` + `components/compliance/`)
- Read the latest `ComplianceSnapshot`; render a dashboard: each `AppliedLaw` as a card (code, title, status badge satisfied/flagged/needs_review, rationale, links to the module(s) that satisfy it).
- Header stats: # laws covered, state + industry, program version, "generated on" timestamp (the "compliance snapshot / version history" story).
- Section: "Platform security & governance" — Opsera scan summaries (§A).
- This is a judge-facing screen — make it credible and clean.

## E. Multilingual layer (`lib/i18n/` + `app/api/i18n/[businessId]/translate`)
- `POST /api/i18n/:businessId/translate {lang}`: for each module, use `getLlm()` to translate `contentMarkdown` → store into `TrainingModule.languageVariants[lang]` (persist via program update) and/or Tigris (`${businessId}/i18n/<lang>/...`). Cache the system/glossary prompt.
- Pre-generate the demo languages (e.g. `zh-Hans`, `es`) so T3's employee toggle has real content at demo time.
- **Coordinate with T1/T3:** you only **write** `languageVariants`; they **read** it. The field is in the Phase-0 `TrainingModule` type, so no shared-file edits — you update program records through the DB/API, not by editing their components.

## F. Audit trail UI (`app/(owner)/deploy/` + `app/api/audit/[businessId]`)
- `GET /api/audit/:businessId` → timeline of `AuditEvent`s (who/what/when/version) — change logs + approval workflow. Render as a clean activity feed on `/deploy` alongside the publish stepper.

## G. Deployment + demo driver (`scripts/demo/`)
- **Deploy config:** add a `render.yaml` (or confirm Vercel) so the app is live for judges. Keep secrets in the platform env, not committed.
- **`scripts/demo/run.ts`:** seed the Happy Lemon fixture, kick the pipeline, translate to `zh-Hans`, publish, and print the owner + employee URLs + join code — so the demo is one command + clicks. Own CP-2 (full dry-run) and the rehearsal.

---

## Subagent usage (token efficiency — required)
- One `general-purpose` subagent to connect + enumerate the Opsera MCP tools and run the three scans, returning concise report summaries (commit the full reports to `docs/opsera/`).
- One subagent to evaluate/scaffold the PDF approach and produce the handbook template.
- One subagent to draft the translation prompt + run the demo-language pre-translation while you build the dashboard/stepper.
- Don't load big scan reports or full module text into your main context — keep summaries, store the rest.

## Definition of Done (do NOT stop until ALL pass)
- [ ] Opsera MCP connected; compliance audit + security scan + architecture review run; reports committed under `docs/opsera/`; high-signal findings addressed (or ticketed in INTEGRATION_LOG). `// BLOCKED:` note if MCP unreachable.
- [ ] `POST /api/deploy/:businessId/publish` runs validate → PDF → version bump → audit, returns version + PDF signed URLs; `/deploy` shows the animated stepper + audit timeline.
- [ ] A real multi-page handbook PDF is generated and stored in Tigris with a working signed URL.
- [ ] Compliance dashboard renders the snapshot's applied laws with statuses + rationales + module links, plus the Opsera governance summary.
- [ ] Translation endpoint populates `languageVariants` for ≥1 non-English language for all modules; T3's toggle shows real translated content (verify with T3).
- [ ] Audit endpoint returns a chronological event trail spanning generate→compliance→publish.
- [ ] App deploys (Render/Vercel) and `scripts/demo/run.ts` drives the full scenario; demo step 5 (publish pipeline + compliance dashboard) works end-to-end.
- [ ] `npx tsc --noEmit` clean, `npm run build` passes; no edits outside your ownership column (§6).
