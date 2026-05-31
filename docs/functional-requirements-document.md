# Functional Requirements Document — Trainr
**Version:** 1.0.0
**Generated:** 2026-05-31 (Opsera business-docs-generate)
**Status:** Baseline

---

## Table of Contents

1. [Document Purpose](#1-document-purpose)
2. [Key Business Concepts](#2-key-business-concepts)
3. [Features](#3-features)
4. [Use Cases](#4-use-cases)
5. [Business Rules](#5-business-rules)
6. [External System Interactions](#6-external-system-interactions)

---

## 1. Document Purpose

This document defines the functional requirements for **Trainr** — an AI-powered employee training SaaS that converts a small business owner's raw operational knowledge into a structured, multilingual training program with compliance modules built in. It serves as the canonical reference for what the system does, not how it is built.

**In scope:** Owner onboarding, AI-driven training program generation, employee learning flows, compliance governance, publish/deploy pipeline, multilingual support, AI coach.

**Out of scope:** Payroll integration, scheduling software, direct POS integration, mobile native apps.

---

## 2. Key Business Concepts

| Concept | Definition |
|---|---|
| **Business** | A small/minority-owned business registered in Trainr. Has a unique join code, an intake profile, and up to one active training program at a time. |
| **Owner** | A user with `role === 'owner'` who creates and manages a Business, configures the intake, triggers generation, reviews modules, and publishes. |
| **Employee** | A user who joins via the Business's join code. Completes training modules, takes quizzes, uses the AI coach. No admin access. |
| **Training Program** | A versioned collection of training modules generated for a specific Business. Each generation produces a new immutable version. |
| **Training Module** | A self-contained unit of training content (markdown body, objectives, quiz, optional equipment simulation). Belongs to exactly one program version. |
| **Compliance Snapshot** | A point-in-time record of which laws apply to a Business and the rationale for each determination. Produced alongside each program generation. |
| **Join Code** | A short alphanumeric code (e.g. `HLEMON`) that employees use to associate themselves with a Business without needing an invitation email. |

---

## 3. Features

### F-01 · Owner Registration & Authentication

**Description:** An owner can create an account with email + password or via Google OAuth. On first sign-in they are prompted to create a Business.

**User journey:**
```
Landing page → "I'm an owner" → Signup form (name, email, password ≥8 chars)
  → OR "Continue with Google" → Google OAuth consent → callback
  → Business creation → Onboarding wizard
```

**Acceptance criteria:**
- Passwords are hashed with scrypt before storage; plain text is never persisted.
- Google OAuth uses server-side Authorization Code flow; the client secret never reaches the browser.
- Duplicate email (case-insensitive) returns the existing account rather than creating a second one.
- Session cookie is `httpOnly`, `sameSite=lax`, signed with `SESSION_SECRET`, 30-day expiry.
- Signup requires password of ≥ 8 characters; the API validates via zod before writing to the DB.

---

### F-02 · Employee Join Flow

**Description:** An employee joins a Business by entering the Business's join code. No password is required — the join code is the credential.

**User journey:**
```
Landing page → "I'm an employee" → Enter join code → (Name prompt if new)
  → Employee dashboard
```

**Acceptance criteria:**
- Join code lookup is case-insensitive.
- If the code is invalid, the form shows an error; no account is created.
- A new `User` with `role === 'employee'` and the resolved `businessId` is created on first join.
- Subsequent logins with the same code and name restore the existing session.

---

### F-03 · Business Intake Wizard

**Description:** A 6-step wizard that collects the operational knowledge used as the AI pipeline's input. Progress autosaves on each step.

**Steps and data collected:**
1. **Business basics** — name, industry, state/city, number of employees.
2. **Roles** — list of employee roles with responsibilities (e.g. Barista, Cashier, Shift Lead).
3. **Recipes / products** — product name, ingredients, steps, allergen notes.
4. **Operations** — opening/closing procedures, equipment list, vendor contacts.
5. **Policies** — dress code, customer service standards, time-off policies.
6. **File uploads** — menu images, recipe PDFs, SOP docs (stored in Tigris under `${businessId}/uploads/`).

**Acceptance criteria:**
- Each step autosaves to `/api/business/:id/intake` on change (debounced 600ms).
- File uploads accept PDF and image formats; each file ≤ 10 MB.
- The wizard is skippable; a partially-filled intake still allows generation.
- Submitting files returns a `StoredFile` record with the Tigris key and a signed URL.

---

### F-04 · AI Training Program Generation

**Description:** A 5-stage autonomous pipeline that turns the intake into a complete training program. The owner triggers it from the dashboard with a single click.

**Pipeline stages:**
```
1. Research   — RTRVR scrapes industry standards + state compliance sources
2. Curriculum — Claude generates modules per role + operations modules
3. Compliance — Claude generates compliance modules (ADA, CA labor, OSHA, harassment, etc.)
4. Assemble   — All modules merged, weekly schedule produced
5. Persist    — Program written to DB + Tigris; compliance snapshot saved
```

**Acceptance criteria:**
- Each completed stage is checkpointed to Tigris (`_checkpoint.json`) so a crash resumes from the last good stage rather than restarting.
- The owner dashboard polls `/api/pipeline/:businessId/status` every 3 s and renders a live progress bar.
- Stage progress values: research=15%, curriculum=45%, compliance=70%, assemble=85%, persist=95%, ready=100%.
- On error, `Business.status` is set to `failed` and the UI shows a retry button.
- Re-triggering generation creates a new program version (v1, v2, …) while preserving prior versions in Tigris.
- A second trigger while a run is already in flight returns `{ runId, alreadyRunning: true }` — no parallel workers.

---

### F-05 · Program Review & Editing

**Description:** After generation, the owner can read each module and make inline text edits before publishing.

**User journey:**
```
Dashboard → "Review program" → Module list with status badges
  → Click module → Inline text editor → Save (PATCH /api/programs/:id/modules/:moduleId)
  → Publish button enabled after review
```

**Acceptance criteria:**
- Modules display title, objectives, body content (markdown rendered), and quiz questions.
- The owner can edit the body content of any module inline.
- Edits are saved individually; unsaved changes are indicated with a dirty indicator.
- Only the owner of the business can edit modules (enforced server-side via `ownedBusinessOr403`).

---

### F-06 · Training Program Publish Pipeline

**Description:** A governance-gated publish flow that validates the program, generates PDF handbooks, bumps the version, records an audit event, and marks the program as deployed.

**Publish stages (animated in UI):**
1. Validate — checks all required modules present, compliance snapshot exists.
2. PDF generation — generates per-module and combined 20-page handbook PDF stored in Tigris.
3. Version bump — increments the program's semantic version.
4. Audit trail — writes a signed `AuditEvent` record with who published, when, and what version.
5. Deploy — marks `Business.status = 'published'`; employees can now access the program.

**Acceptance criteria:**
- Each stage in the publish UI animates as the corresponding API step completes.
- The combined PDF is stored at `${businessId}/pdf/handbook-v${n}.pdf` and accessible via a signed Tigris URL.
- Publish is idempotent for the same program version; re-publishing creates a new audit event but does not create a duplicate PDF.
- Only owners can trigger publish; unauthenticated or employee callers receive 401/403.

---

### F-07 · Employee Training Dashboard

**Description:** The employee's home screen shows all available training modules, their completion status, certification progress, and a link to the AI coach.

**Acceptance criteria:**
- Modules are ordered by the weekly onboarding schedule defined in the program.
- Each module card shows: title, estimated duration, status badge (not started / in progress / complete), quiz score if attempted.
- A progress summary at the top shows overall completion percentage.
- Modules are only visible if `Business.status === 'published'`.

---

### F-08 · Interactive Module Learning & Quiz

**Description:** Employees can read a module and complete a multiple-choice quiz. Passing the quiz certifies the module. Some modules include an interactive equipment simulation gate in addition to the quiz.

**User journey:**
```
Dashboard → Select module → Read content → Take quiz
  → (if simId) Practice station simulation
  → Completion screen with score + AI feedback
```

**Acceptance criteria:**
- Quiz answers are submitted to `POST /api/quiz/:moduleId/grade`; the response includes per-question feedback and an overall score.
- A module is certified when all gates pass: quiz ≥ passing threshold AND simulation (if `simId` set).
- `EmployeeProgress` is upserted on each quiz/sim completion via `POST /api/progress`.
- Quiz retakes are allowed with no limit; the most recent score is the canonical one.

---

### F-09 · AI Coach (Claude Sonnet)

**Description:** An always-available chat assistant for employees that answers questions grounded in the business's actual policies, modules, and uploaded documents. Cites its sources.

**User journey:**
```
Module page "Ask coach" → OR nav link → Chat interface
  → Employee types question → Streaming response with citations
  → Follow-up questions maintain context in session
```

**Acceptance criteria:**
- Responses are streamed token-by-token from `claude-sonnet-4-6`.
- The coach retrieves relevant context from the business's Tigris-stored program and uploaded documents before generating a response.
- Citations reference the specific module or document section used.
- Deep-link from a module page pre-seeds the session with the module's context: `/learn/coach?moduleId=...`.
- The coach can grade a free-response practice scenario and return structured feedback.

---

### F-10 · Compliance Dashboard

**Description:** A read-only governance view showing which laws and regulations apply to the business, the rationale for each determination, and the compliance module generated to address each one.

**Acceptance criteria:**
- Displays the `ComplianceSnapshot` produced by the latest generation run.
- For each `AppliedLaw`: shows the law name, jurisdiction, determination rationale, status (`satisfied` or `needs_review`), and the linked training module.
- `needs_review` laws display a yellow warning with recommended owner action.
- The snapshot timestamp and program version are visible at the top.
- Only owners can view the compliance dashboard.

---

### F-11 · Multilingual Training (i18n)

**Description:** After publishing, the owner can generate translated versions of all training modules for supported languages. Employees can switch their language preference.

**Supported languages:** English (en), Spanish (es), Simplified Chinese (zh-Hans).

**Acceptance criteria:**
- Translation is triggered per language via `POST /api/i18n/:businessId/translate { lang }`.
- Translated content is stored in Tigris under `${businessId}/i18n/<lang>/`.
- Employees see content in their preferred language if a translation exists; fallback is English.
- The owner dashboard shows which languages are available for the current program version.

---

### F-12 · Audit Trail

**Description:** Every significant owner action (generate, edit, publish, translate) is recorded as an immutable `AuditEvent` with timestamp, actor, and action details.

**Acceptance criteria:**
- `GET /api/audit/:businessId` returns all events for the business, newest first.
- Events are viewable on the Deploy page audit trail panel.
- Events include: `event_type`, `actorId`, `actorRole`, `timestamp`, `details` (JSON).
- Audit records are never deleted or modified; the API is read-only.

---

## 4. Use Cases

### UC-01 · Owner Builds and Deploys a Training Program

**Primary actor:** Owner
**Precondition:** Owner has an account and a Business record.

```
1. Owner opens the Intake Wizard and fills in business details, roles, recipes, and operations policies across 6 steps.
2. Owner uploads supporting documents (menu PDF, SOP document).
3. Owner clicks "Generate Training Program" on the dashboard.
4. System starts the pipeline: RTRVR researches industry standards (15%) → Claude generates curriculum modules (45%) → Claude generates compliance modules (70%) → assembles program (85%) → persists to DB + Tigris (100%).
5. Owner reviews each module; optionally edits body text on 2 modules.
6. Owner clicks "Publish". System animates through: Validate → PDF → Version → Audit → Deploy.
7. Owner shares join code HLEMON with new hires.
8. Compliance dashboard shows 5 laws applied with rationales; 3 are satisfied, 2 are needs_review with recommended owner actions.
```

**Alternative flows:**
- **4a. Pipeline errors at compliance stage:** `Business.status` set to `failed`. Owner sees error banner + "Retry" button. Retry resumes from compliance checkpoint (curriculum is not regenerated).
- **3a. Pipeline already running:** System returns `alreadyRunning: true`; dashboard shows existing progress.

---

### UC-02 · Employee Completes the Learning Journey

**Primary actor:** Employee
**Precondition:** Business is published; employee has joined with the correct code.

```
1. Employee visits Trainr and enters join code HLEMON.
2. Employee lands on the dashboard showing 8 modules with a weekly schedule (Week 1 content unlocked).
3. Employee opens "Company Introduction" module, reads the content.
4. Employee takes the 5-question quiz, scores 80% (≥ passing threshold).
5. Module is marked complete; progress bar updates to 12.5%.
6. Employee opens "Drink Build" module, reads content, then navigates to the Practice Station.
7. Employee completes the boba station simulation — stations and steps guide the interaction; AI debrief grades the run.
8. Both gates (quiz + simulation) pass → module certified.
9. Employee types "What do I do if a customer complains?" into the coach.
10. Coach streams a grounded response citing the customer service policy module, offers a scenario, then grades the employee's practice response.
11. Employee toggles language → 中文; all module content renders in Simplified Chinese.
```

**Alternative flows:**
- **4a. Quiz score below threshold:** Employee sees per-question feedback and can retry immediately; progress is not updated until a passing attempt.
- **11a. Translation not available for selected language:** System falls back to English with a notification.

---

## 5. Business Rules

| ID | Rule |
|---|---|
| BR-01 | An Owner may have exactly one active Business. The `POST /api/business` endpoint is idempotent — it returns the existing Business rather than creating a second one. |
| BR-02 | An Employee is always associated with exactly one Business (the one whose join code they used). They cannot switch businesses. |
| BR-03 | Training modules are visible to Employees only after `Business.status === 'published'`. Draft/generating programs are not exposed. |
| BR-04 | A module is certified only when all gates (quiz AND simulation, where defined) are passed. Passing the quiz alone is insufficient if a `simId` is set. |
| BR-05 | Compliance law determination is fully automated by the rules engine (`determineApplicableLaws`). The Owner cannot override which laws apply — they can only take the recommended actions for `needs_review` items. |
| BR-06 | Program versions are immutable after publish. Generating a new program creates version n+1; the prior version's artifacts remain in Tigris for audit purposes. |
| BR-07 | The join code is the sole credential for employee access. There is no employee password. Owners are responsible for keeping the join code confidential. |
| BR-08 | All audit events are append-only. No audit record may be modified or deleted through any application interface. |

---

## 6. External System Interactions

| System | Interaction | Direction | Failure mode |
|---|---|---|---|
| **Anthropic Claude** (`claude-sonnet-4-6`) | Curriculum generation, compliance module generation, coach responses, quiz grading, research summarization | Out (API call) | Falls back to deterministic content for generation; coach returns an error banner. Rate limit errors propagated to owner as pipeline failure. |
| **RTRVR.ai** | Web scraping of industry training standards and state compliance sources (labor law, harassment, OSHA, ADA) | Out (POST /scrape) | If all scrapes yield zero artifacts, falls back to curated mock research so the curriculum stage always has grounding. |
| **Tigris (S3-compatible)** | Storage of: uploaded files, research artifacts, program checkpoints, generated module markdown, PDF handbooks, translated content | Out (AWS SDK v3) | Checkpoint write failures are logged and swallowed (medium risk — see Architecture Report). |
| **InsForge (Postgres BaaS)** | Persistent storage of all entities: Business, User, IntakeProfile, TrainingProgram, EmployeeProgress, ComplianceSnapshot, AuditEvent, ChatMessage | Out (REST/PostgREST) | Connection failures surface as 500 errors to the caller. |
| **Google OAuth** | Optional owner sign-in via Google account | Out (Authorization Code flow) | Falls back to email/password signup. OAuth errors redirect to `/login?error=<code>`. |
