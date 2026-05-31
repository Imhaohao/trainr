-- Trainr.ai — Insforge schema for InsforgeRepository (lib/db/insforge-repository.ts).
-- Run in your Insforge project's SQL editor (public schema). PostgREST then
-- auto-exposes these at /api/database/records/<table>.
--
-- Notes:
--   * Table names use the `trainr_` prefix (INSFORGE_TABLE_PREFIX, default).
--   * Column names are camelCase to match the TypeScript entities exactly, so
--     they are DOUBLE-QUOTED (Postgres folds unquoted identifiers to lowercase).
--   * Nested/array fields are JSONB; timestamps are TEXT (we store ISO-8601
--     strings to round-trip the `string` types in types/index.ts).
--   * Primary keys are TEXT app-generated ids (e.g. biz_/usr_/file_…); intake is
--     keyed by "businessId".

CREATE TABLE IF NOT EXISTS trainr_businesses (
  "id"            text PRIMARY KEY,
  "name"          text NOT NULL,
  "industry"      text NOT NULL DEFAULT '',
  "address"       text NOT NULL DEFAULT '',
  "state"         text NOT NULL DEFAULT '',
  "employeeCount" integer NOT NULL DEFAULT 0,
  "demographics"  text,
  "languages"     jsonb NOT NULL DEFAULT '[]'::jsonb,
  "mission"       text,
  "roles"         jsonb NOT NULL DEFAULT '[]'::jsonb,
  "joinCode"      text NOT NULL,
  "ownerId"       text NOT NULL DEFAULT '',
  "createdAt"     text NOT NULL,
  "status"        text NOT NULL DEFAULT 'draft'
);
CREATE INDEX IF NOT EXISTS trainr_businesses_joincode ON trainr_businesses ("joinCode");
CREATE INDEX IF NOT EXISTS trainr_businesses_owner ON trainr_businesses ("ownerId");

CREATE TABLE IF NOT EXISTS trainr_users (
  "id"         text PRIMARY KEY,
  "role"       text NOT NULL,
  "businessId" text NOT NULL DEFAULT '',
  "name"       text NOT NULL,
  "email"      text,
  "createdAt"  text NOT NULL
);
CREATE INDEX IF NOT EXISTS trainr_users_business ON trainr_users ("businessId");

CREATE TABLE IF NOT EXISTS trainr_intake (
  "businessId"       text PRIMARY KEY,
  "openingClosing"   text,
  "cleaning"         text,
  "machineOperations" text,
  "drinkProduction"  text,
  "recipes"          jsonb NOT NULL DEFAULT '[]'::jsonb,
  "notes"            text,
  "uploadedFileIds"  jsonb NOT NULL DEFAULT '[]'::jsonb,
  "menuImageIds"     jsonb NOT NULL DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS trainr_files (
  "id"          text PRIMARY KEY,
  "businessId"  text NOT NULL,
  "key"         text NOT NULL,
  "filename"    text NOT NULL,
  "contentType" text NOT NULL,
  "kind"        text NOT NULL,
  "language"    text,
  "createdAt"   text NOT NULL
);
CREATE INDEX IF NOT EXISTS trainr_files_business ON trainr_files ("businessId");

CREATE TABLE IF NOT EXISTS trainr_research (
  "id"            text PRIMARY KEY,
  "businessId"    text NOT NULL,
  "category"      text NOT NULL,
  "source"        text NOT NULL,
  "title"         text NOT NULL,
  "summary"       text NOT NULL,
  "structuredKey" text NOT NULL,
  "createdAt"     text NOT NULL
);
CREATE INDEX IF NOT EXISTS trainr_research_business ON trainr_research ("businessId");

CREATE TABLE IF NOT EXISTS trainr_programs (
  "id"            text PRIMARY KEY,
  "businessId"    text NOT NULL,
  "version"       integer NOT NULL DEFAULT 1,
  "modules"       jsonb NOT NULL DEFAULT '[]'::jsonb,
  "scheduleWeeks" jsonb,
  "status"        text NOT NULL DEFAULT 'generating',
  "generatedAt"   text NOT NULL
);
CREATE INDEX IF NOT EXISTS trainr_programs_business ON trainr_programs ("businessId");

CREATE TABLE IF NOT EXISTS trainr_progress (
  "id"          text PRIMARY KEY,
  "employeeId"  text NOT NULL,
  "businessId"  text NOT NULL,
  "moduleId"    text NOT NULL,
  "status"      text NOT NULL,
  "quizScore"   numeric,
  "completedAt" text,
  "certified"   boolean
);
CREATE INDEX IF NOT EXISTS trainr_progress_employee ON trainr_progress ("employeeId");
CREATE INDEX IF NOT EXISTS trainr_progress_business ON trainr_progress ("businessId");

CREATE TABLE IF NOT EXISTS trainr_compliance (
  "id"             text PRIMARY KEY,
  "businessId"     text NOT NULL,
  "programVersion" integer NOT NULL,
  "state"          text NOT NULL,
  "industry"       text NOT NULL,
  "appliedLaws"    jsonb NOT NULL DEFAULT '[]'::jsonb,
  "generatedAt"    text NOT NULL
);
CREATE INDEX IF NOT EXISTS trainr_compliance_business ON trainr_compliance ("businessId");

CREATE TABLE IF NOT EXISTS trainr_audit (
  "id"             text PRIMARY KEY,
  "businessId"     text NOT NULL,
  "actorId"        text NOT NULL,
  "action"         text NOT NULL,
  "detail"         text NOT NULL,
  "programVersion" integer,
  "createdAt"      text NOT NULL
);
CREATE INDEX IF NOT EXISTS trainr_audit_business ON trainr_audit ("businessId");

CREATE TABLE IF NOT EXISTS trainr_chat (
  "id"        text PRIMARY KEY,
  "sessionId" text NOT NULL,
  "role"      text NOT NULL,
  "content"   text NOT NULL,
  "citations" jsonb,
  "createdAt" text NOT NULL
);
CREATE INDEX IF NOT EXISTS trainr_chat_session ON trainr_chat ("sessionId");
