# Trainr — Opsera Reports
**Generated:** 2026-05-31
**Tools used:** Opsera architecture-analyze, dora-metrics, business-docs-generate

---

## Table of Contents

1. [Architecture Risk Report](#architecture-risk-report)
2. [DORA Metrics Report](#dora-metrics-report)
3. [Business Documents](#business-documents)

---

# Architecture Risk Report

**Project:** AI-powered employee training SaaS · Next.js 16 App Router monolith
**Stack:** TypeScript 5, React 19, Tailwind 4, InsForge (Postgres BaaS), Tigris (S3), Anthropic Claude
**Scale:** 196 files, 16,530 LOC, 22 API routes, 0 tests, 0 CI/CD

---

## Critical Risks

**1. 7+ unauthenticated API routes**
Routes with no auth guard whatsoever: `coach/[businessId]/chat`, `compliance-report/[businessId]`, `deploy/[businessId]/publish`, `audit/[businessId]`, `quiz/[moduleId]/grade`, `progress`, `sim/[businessId]/grade`, `i18n/[businessId]/translate`. Any anonymous HTTP caller can publish programs, read compliance data, or drain your Anthropic quota.

**2. Hardcoded session secret fallback** (`lib/auth/constants.ts:8`)
```ts
return process.env.SESSION_SECRET || 'trainr-dev-session-secret-change-me'
```
If `SESSION_SECRET` is missing in production, every session cookie is signed with a public string — any attacker can forge an owner session for any `userId`.

**3. Fire-and-forget pipeline vs. Vercel timeout**
`runPipeline()` is fired `void` from a serverless route handler. The 5-stage pipeline (research → curriculum → compliance → assemble → persist) requires 3+ sequential LLM calls (~120–180s total). Vercel Hobby cap: 10s. Pro cap: 60s. The function will be killed silently mid-run, leaving businesses stuck in `researching`.

---

## High Risks

**4. `USE_MOCKS=true` auth bypass in production**
`lib/auth/guards.ts:21–23` auto-authenticates all visitors as demo owner when `USE_MOCKS=true`. The `env.local.example` defaults this to `true`. One accidental env var in prod = open access.

**5. IDOR on `businessId` URL params**
Consistent ownership check (`ownedBusinessOr403`) is applied on pipeline/run and business CRUD routes but missing on compliance-report, deploy/publish, coach/chat, i18n/translate, and audit. An authenticated employee from Business A can read/modify Business B's data.

**6. No rate limiting on LLM endpoints**
Zero rate limiting on coach/chat, pipeline/run, i18n/translate, quiz/grade. Unlimited Anthropic API calls are possible from any caller.

**7. 30-day stateless sessions with no revocation**
Sessions are signed cookies with no server-side store. A stolen cookie is valid for 30 days with no per-user revocation possible (rotating `SESSION_SECRET` invalidates all sessions globally).

---

## Medium Risks

**8. Silent storage error swallowing in orchestrator**
`orchestrator.ts` `writeJson()` catches all Tigris write errors and only `console.error`s them. Silent checkpoint failures cause the pipeline to restart expensive LLM stages from scratch on retry.

**9. Zero tests, zero CI/CD**
No test files anywhere. No `.github/workflows/` or equivalent. Auth HMAC logic, pipeline orchestration, and LLM prompt construction are all deployed untested.

---

## STRIDE Summary

| Category | Count | Key Threats |
|---|---|---|
| Spoofing | 2 | Forgeable sessions (fallback secret), USE_MOCKS bypass |
| Tampering | 2 | Unauthenticated deploy/publish, no CSRF beyond sameSite=lax |
| Repudiation | 2 | Unauthenticated audit read, unattributed coach conversations |
| Info Disclosure | 3 | Public compliance-report, public coach/chat, swallowed error details |
| Denial of Service | 2 | Unlimited LLM calls, stuck pipeline state |
| Elevation of Privilege | 2 | IDOR cross-business access, unauthenticated publish |

---

## Top 3 Quick Wins

1. **Add `middleware.ts`** to protect `(owner)` and `(employee)` route groups at the Next.js edge — catches all missing guards at once.
2. **Throw on missing `SESSION_SECRET`** when `NODE_ENV === 'production'` in `lib/auth/constants.ts`.
3. **Move the pipeline to a background job or queue** (Vercel's `waitUntil`, QStash, or Inngest) — it cannot run reliably as a synchronous serverless function.

---

---

# DORA Metrics Report

**Repository:** trainr (https://github.com/Imhaohao/trainr.git)
**Branch:** main
**Analysis period:** 90 days (2026-03-02 → 2026-05-31)
**Team size:** 3–4 contributors
**Overall performance:** 🟡 LOW–MEDIUM

> **Note:** This project was built in a single-day sprint on 2026-05-31. All 20 commits occurred within a ~4-hour window. DORA metrics reflect the absence of a formal deployment pipeline rather than slow velocity — the team shipped fast; the process maturity is what needs investment.

---

## Metric Results

### 1. Deployment Frequency — 🔴 LOW

| Metric | Value | DORA Level |
|---|---|---|
| Tagged releases in 90 days | 0 | — |
| Total commits in 90 days | 20 | — |
| Effective deploy cadence | No formal deployments | LOW |

**Finding:** There are no git tags and no CI/CD pipeline, so there are zero formal deployments on record. Commits go directly to `main` without a release process. By DORA standards this is LOW (below monthly). The underlying velocity is high — 20 commits in a single day — but without a deployment pipeline, releases aren't tracked or reproducible.

**DORA benchmark:** Elite teams deploy multiple times per day; LOW teams deploy less than once per month.

---

### 2. Lead Time for Changes — 🟡 MEDIUM (estimated)

| Metric | Value |
|---|---|
| First commit | 10:42 on 2026-05-31 |
| Last commit | 14:49 on 2026-05-31 |
| Total elapsed time | ~4 hours 7 minutes |
| Commits | 20 |
| Average time between commits | ~13 minutes |
| PR/review process | None (direct commits to main) |

**Finding:** With no pull request process and direct commits to `main`, traditional lead time measurement is not applicable. Changes went from idea to commit in minutes. This is extremely fast for a build phase, but unsustainable at scale — the absence of a review process means no peer verification, no automated checks, and no audit trail beyond commit messages.

**DORA benchmark:** Elite teams have lead times under 1 hour with automated pipelines; this team has fast raw commits but no formal change-management process.

---

### 3. Change Failure Rate — 🟢 ELITE

| Metric | Value | DORA Level |
|---|---|---|
| Revert commits in 90 days | 0 | — |
| Total commits | 20 | — |
| Change failure rate | **0%** | ELITE |

**Finding:** Zero revert commits in the analysis period. Every change shipped stuck. This is ELITE performance — top-performing engineering teams target 0–5% change failure rate. The caveat is that there are also no tests to catch failures before they reach production, so this metric reflects the project's early stage rather than robust quality practices.

**DORA benchmark:** Elite: 0–5% | HIGH: 5–10% | MEDIUM: 10–15% | LOW: >15%

---

### 4. Mean Time to Recovery (MTTR) — 🟢 ELITE (N/A)

| Metric | Value | DORA Level |
|---|---|---|
| Incidents / failures detected | 0 | — |
| Revert patterns | None | — |
| MTTR | N/A (no failures) | ELITE |

**Finding:** No failures were detected in the commit history. MTTR is not meaningfully calculable, but the absence of rollbacks indicates the team did not need to recover from any production failures during the build sprint.

**DORA benchmark:** Elite: <1 hour | HIGH: <1 day | MEDIUM: <1 week | LOW: >1 week

---

## Contributor Analysis

| Contributor | Commits | % of Total |
|---|---|---|
| David Wu | 10 | 50% |
| Imzihao | 8 | 40% |
| Robinson Xiang | 1 | 5% |
| Imhaohao | 1 | 5% |

**Bus factor: 2** — Two contributors own 90% of the codebase. Loss of either would significantly impair development velocity and incident response.

---

## Most-Changed Files (Hotspots)

| File | Changes | Risk Signal |
|---|---|---|
| `docs/INTEGRATION_LOG.md` | 8 | High coordination area — cross-cutting concerns logged here |
| `lib/agents/orchestrator.ts` | 4 | Core pipeline logic; highest-risk file for regressions |
| `app/api/pipeline/[businessId]/run/route.ts` | 3 | Pipeline trigger; also a security hotspot (see Architecture Report) |
| `app/api/business/[id]/intake/route.ts` | 3 | Intake data handling — evolving quickly |
| `app/(owner)/dashboard/page.tsx` | 3 | Owner UX — active iteration |

---

## Recommendations

### Priority 1: Establish a Deployment Pipeline (addresses LOW Deployment Frequency)
- Set up GitHub Actions with a workflow that runs `npm run build` and `eslint` on every push to `main`
- Tag releases (even manually with `git tag v0.x.x`) so deployment frequency becomes measurable
- Connect Vercel's GitHub integration for automatic preview and production deploys tied to commits

### Priority 2: Add a Pull Request Process (addresses Lead Time quality)
- Require PRs for all changes to `main`, even with a team of 2–4
- Add a branch protection rule requiring at least one reviewer before merge
- This creates an audit trail, catches bugs before production, and is the foundation for CI gating

### Priority 3: Add a Minimal Test Suite (protects ELITE Change Failure Rate)
- The 0% change failure rate is encouraging but fragile — there are no tests catching regressions
- Start with auth and session tests (`lib/auth/session.ts`) — these are the highest-risk, lowest-coverage area
- Add API route smoke tests for the critical pipeline and coach routes

### Priority 4: Reduce Bus Factor
- Document the orchestrator and auth modules; both are owned primarily by one contributor
- Pair on the next significant feature to distribute codebase knowledge

---

---

# Business Documents

Full business documentation has been generated and saved to:

- **Functional Requirements Document** → [`docs/functional-requirements-document.md`](functional-requirements-document.md)
  - 12 features with user journey flowcharts
  - 2 detailed use cases (owner build/deploy, employee learning journey)
  - 8 business rules
  - 5 external system interactions
  - 7 key business concepts

- **Business Requirements Document** → [`docs/business-requirements-document.md`](business-requirements-document.md)
  - Executive summary and business context
  - 5 business objectives with measurable outcomes
  - 3 stakeholder personas (Owner, Employee, Compliance Officer)
  - 3 end-to-end business process flows with Mermaid diagrams
  - 7 business rules and policies
  - 6 KPIs with targets and measurement methods
  - Scope boundaries and dependency table

---

*All reports generated on 2026-05-31 via Opsera MCP tools and codebase analysis.*
