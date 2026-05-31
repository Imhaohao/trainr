# Track 3 — Employee Experience & AI Coach Agent (Claude Sonnet + Claude Skills)

**You own:** everything the employee sees and the coach agent. The employee dashboard (join via code), module viewer, interactive quizzes with grading, progress tracking, and the **AI Training Coach** — a Claude Sonnet chatbot that answers from the owner's actual docs/modules ("Duolingo + corporate training"). Plus the Claude Skills the coach uses.

**You do NOT touch:** owner UI, `lib/db/` (call via `getDb()`), `lib/integrations/`/`lib/agents/` (call `getLlm()` + read programs via API/DB), `lib/opsera|pdf/`. For translations you **read** the `languageVariants` field that T4 populates — you don't generate them.

> ⚠️ Read `node_modules/next/dist/docs/` (route handlers, **streaming responses**, app router) before writing Next.js 16 code. Use the **`claude-api` skill** for Anthropic SDK + caching. Model = `claude-sonnet-4-6` ("Sonnet medium"). Path alias `@/*` → repo root.
>
> 🚫 **Do not finish until every Definition of Done box is checked** — including a streaming coach answer that cites a real module and a quiz that grades a free-response answer.

---

## Wait for Phase 0, then branch `track/3-employee`. Build against the mock program fixture immediately.

You consume: `getLlm()` (T2's provider, mock until ready), `getDb()` + `GET /api/programs/:businessId` for module content, `getStorage()` signed URLs for uploaded docs, and the `types/` entities. The fixture's 8-module Happy Lemon program lets you build the full employee experience before T2's real pipeline exists.

---

## A. Employee entry & dashboard (`app/(employee)/`)
- Entry: employee enters the **join code** (T1's `POST /api/auth/employee/join`) + their name → employee session → dashboard. Keep it friction-free (no password) — matches the product (employees just want to learn).
- Dashboard: clean, **Duolingo-style** path/grid of modules with completion state + progress ring (read `GET /api/progress/:employeeId`). Locked/next/done states. Big "Continue" CTA.
- **Language toggle** in the header: switches the UI + module rendering to a `languageVariants[lang]` when present (T4 populates these; you gracefully fall back to `contentMarkdown`). Persist choice on the employee `User`.

## B. Module viewer (`app/(employee)/module/[id]/`)
- Render `contentMarkdown` (or the selected language variant) nicely (markdown → styled HTML; checklists, headings). Show source/provenance subtly if `sourceArtifactIds` present ("based on ServSafe + store recipes").
- "Mark complete" + "Take quiz" → updates progress via `POST /api/progress`.
- An always-available **"Ask the coach"** affordance in context (pre-seeds the chat with the current module).

## C. Interactive quizzes (`components/employee/Quiz*` + `app/api/quiz/[moduleId]/grade`)
- Render the module's `Quiz`: multiple-choice (instant check vs `correctIndex`) + free-response.
- **Free-response grading via the coach/LLM:** `POST /api/quiz/:moduleId/grade` sends the employee's answers + each question's `rubric` to Claude (use a **Claude Skill**, §E) → returns `{score, perQuestion:[{correct, feedback}], feedback}`. Show encouraging, specific feedback (Duolingo energy). On pass, set `EmployeeProgress.quizScore` + `certified` where appropriate.

## D. AI Training Coach (`lib/coach/` + `app/api/coach/[businessId]/chat`)
The centerpiece. Employee asks anything; the coach answers **from the owner's content**, not generic knowledge.
- **Retrieval:** assemble context from this business's `TrainingProgram` modules + uploaded `StoredFile` text (fetch via storage signed URLs / cached text). For the hackathon, simple but effective retrieval is fine: rank modules by keyword/embedding overlap with the question and pass the top few module markdowns as cached context. (If you add embeddings, keep it self-contained in `lib/coach/`.)
- **Prompt:** system prompt defines the coach persona (patient trainer for a specific store, multilingual, cites sources, gives scenarios, never invents policy — if unknown, says "ask your manager"). Mark the system prompt + retrieved module context as **cacheable** (caching skill) since it's reused across turns.
- **Behaviors (the demo magic):** for "What do I do if a customer complains?" → (1) explains the store's policy from the modules, (2) shows an example, (3) offers a practice scenario, (4) grades the employee's response. Return `citations:[{moduleId, snippet}]` so the UI can link to the source module.
- **Streaming:** stream tokens to the client (Next.js 16 streaming route — read the docs). Persist `ChatMessage`s via `getDb().chat`.
- **Multilingual:** respond in the employee's selected language; the model handles translation inline for chat (T4's pre-translated variants are for the static modules).

## E. Claude Skills (`skills/`) — "use Claude skills whenever necessary"
Author small, focused skills the coach invokes:
- **`quiz-grader`** — given answers + rubric, returns structured per-question grading + a fair score.
- **`scenario-coach`** — generates a realistic role-play scenario for a module topic and evaluates the employee's handling.
- (Optional) **`policy-explainer`** — formats a policy answer with "Policy → Example → What to do".
Follow the `skill-creator` skill / Agent Skills format (a `SKILL.md` per skill). Wire them into the coach + quiz endpoints.

---

## Subagent usage (token efficiency — required)
- Spawn an `Explore` subagent to extract the Next.js 16 **streaming route handler** pattern from `node_modules/next/dist/docs/` and return a minimal working example — don't read the whole docs tree yourself.
- Spawn a `general-purpose` subagent to scaffold the quiz UI components and another to draft the Claude Skills' `SKILL.md` files in parallel while you build the coach retrieval + streaming.
- When testing prompts, have a subagent draft + iterate the system prompt against the fixture modules and return the final text.

## Definition of Done (do NOT stop until ALL pass)
- [ ] Employee can join with the demo code, see a Duolingo-style module dashboard with live progress, and open any module.
- [ ] Module viewer renders markdown cleanly and supports the language toggle (falls back to English when no variant).
- [ ] Quizzes work: multiple-choice auto-checks; free-response is graded by the coach/skill with specific feedback; progress + score persist via `POST /api/progress`.
- [ ] Coach chat **streams**, answers from the business's actual modules/docs, returns `citations` linking to source modules, and handles the "customer complains" demo flow (policy → example → scenario → grades response).
- [ ] Coach refuses to invent policy and defers to manager when content is missing.
- [ ] At least `quiz-grader` + `scenario-coach` Claude Skills exist under `skills/` and are invoked by the endpoints.
- [ ] Works against the mock fixture with zero keys; uses real `getLlm()` when Anthropic key present (`// BLOCKED:` + INTEGRATION_LOG if a contract gap blocks you).
- [ ] `npx tsc --noEmit` clean, `npm run build` passes; no edits outside your ownership column (§6).
- [ ] Demo step 6 (employee joins, asks the coach, gets cited multilingual answer + scenario) works end-to-end.
