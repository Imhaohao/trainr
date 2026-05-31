// Trainr.ai — canonical shared entities (PLAN §4).
// FROZEN after Phase 0. Contract changes go through docs/INTEGRATION_LOG.md.
//
// Languages are BCP-47 strings. Common values are suggested for autocomplete,
// but any BCP-47 tag is valid.

export type LanguageCode =
  | 'en'
  | 'zh-Hans'
  | 'zh-Hant'
  | 'es'
  | 'vi'
  | (string & {});

// ---------------------------------------------------------------------------
// Users & businesses
// ---------------------------------------------------------------------------

export type UserRole = 'owner' | 'employee';

export interface User {
  id: string;
  role: UserRole;
  businessId: string;
  name: string;
  email?: string;
  createdAt: string; // ISO-8601
}

export type BusinessStatus =
  | 'draft'
  | 'researching'
  | 'generating'
  | 'ready'
  | 'published';

export interface BusinessRole {
  id: string;
  title: string;
  customerFacing: boolean;
  description?: string;
}

export interface Business {
  id: string;
  name: string;
  industry: string;
  address: string;
  state: string;
  employeeCount: number;
  demographics?: string;
  languages: LanguageCode[];
  mission?: string;
  roles: BusinessRole[];
  joinCode: string;
  ownerId: string;
  createdAt: string; // ISO-8601
  status: BusinessStatus;
}

// ---------------------------------------------------------------------------
// Intake
// ---------------------------------------------------------------------------

export interface Recipe {
  name: string;
  ingredients: string[];
  steps: string[];
}

export interface IntakeProfile {
  businessId: string;
  openingClosing?: string;
  cleaning?: string;
  machineOperations?: string;
  drinkProduction?: string;
  recipes?: Recipe[];
  notes?: string;
  uploadedFileIds: string[];
  menuImageIds: string[];
}

// ---------------------------------------------------------------------------
// Stored files (Tigris)
// ---------------------------------------------------------------------------

export type StoredFileKind =
  | 'upload'
  | 'menu_image'
  | 'research'
  | 'generated_module'
  | 'handbook_pdf'
  | 'translation';

export interface StoredFile {
  id: string;
  businessId: string;
  key: string; // storage key, e.g. `${businessId}/uploads/${id}`
  filename: string;
  contentType: string;
  kind: StoredFileKind;
  language?: LanguageCode;
  createdAt: string; // ISO-8601
}

// ---------------------------------------------------------------------------
// Research (RTRVR)
// ---------------------------------------------------------------------------

export type ResearchCategory =
  | 'industry_standard'
  | 'compliance'
  | 'competitor';

export interface ResearchArtifact {
  id: string;
  businessId: string;
  category: ResearchCategory;
  source: string;
  title: string;
  summary: string;
  structuredKey: string; // storage key for the structured DOM/JSON payload
  createdAt: string; // ISO-8601
}

// ---------------------------------------------------------------------------
// Training program & modules
// ---------------------------------------------------------------------------

export type QuizQuestionType = 'multiple_choice' | 'free_response';

export interface QuizQuestion {
  id: string;
  prompt: string;
  type: QuizQuestionType;
  options?: string[]; // for multiple_choice
  correctIndex?: number; // for multiple_choice
  rubric?: string; // for free_response grading
}

export interface Quiz {
  id: string;
  moduleId: string;
  questions: QuizQuestion[];
}

export type TrainingModuleType =
  | 'company_intro'
  | 'role_specific'
  | 'compliance'
  | 'operations';

export interface TrainingModule {
  id: string;
  programId: string;
  order: number;
  type: TrainingModuleType;
  roleId?: string; // for role_specific modules
  title: string;
  contentMarkdown: string;
  languageVariants?: Record<string, string>; // BCP-47 -> markdown
  quiz?: Quiz;
  sourceArtifactIds?: string[];
}

export interface OnboardingWeek {
  week: number;
  goals: string[];
  moduleIds: string[];
}

export type TrainingProgramStatus = 'generating' | 'ready' | 'published';

export interface TrainingProgram {
  id: string;
  businessId: string;
  version: number;
  modules: TrainingModule[];
  scheduleWeeks?: OnboardingWeek[];
  status: TrainingProgramStatus;
  generatedAt: string; // ISO-8601
}

// ---------------------------------------------------------------------------
// Employee progress
// ---------------------------------------------------------------------------

export type ProgressStatus = 'not_started' | 'in_progress' | 'completed';

export interface EmployeeProgress {
  id: string;
  employeeId: string;
  businessId: string;
  moduleId: string;
  status: ProgressStatus;
  quizScore?: number;
  completedAt?: string; // ISO-8601
  certified?: boolean;
}

// ---------------------------------------------------------------------------
// Compliance
// ---------------------------------------------------------------------------

export type AppliedLawStatus = 'satisfied' | 'flagged' | 'needs_review';

export interface AppliedLaw {
  code: string;
  title: string;
  rationale: string;
  moduleIds: string[];
  status: AppliedLawStatus;
}

export interface ComplianceSnapshot {
  id: string;
  businessId: string;
  programVersion: number;
  state: string;
  industry: string;
  appliedLaws: AppliedLaw[];
  generatedAt: string; // ISO-8601
}

// ---------------------------------------------------------------------------
// Audit & chat
// ---------------------------------------------------------------------------

export interface AuditEvent {
  id: string;
  businessId: string;
  actorId: string;
  action: string;
  detail: string;
  programVersion?: number;
  createdAt: string; // ISO-8601
}

export interface ChatCitation {
  moduleId?: string;
  title: string;
  snippet?: string;
}

export type ChatRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: ChatRole;
  content: string;
  citations?: ChatCitation[];
  createdAt: string; // ISO-8601
}

// ---------------------------------------------------------------------------
// API envelope (PLAN §5)
// ---------------------------------------------------------------------------

export type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };
