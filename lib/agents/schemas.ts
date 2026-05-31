// Zod runtime schemas for the pipeline's output types. Used to validate the
// assembled TrainingProgram before persisting (DoD gate: ≥8 modules, company
// intro, ≥2 role-specific, operations, compliance; each module has
// contentMarkdown + quiz; scheduleWeeks present).

import { z } from 'zod';

const quizQuestionSchema = z.object({
  id: z.string(),
  prompt: z.string().min(1),
  type: z.enum(['multiple_choice', 'free_response']),
  options: z.array(z.string()).optional(),
  correctIndex: z.number().optional(),
  rubric: z.string().optional(),
});

const quizSchema = z.object({
  id: z.string(),
  moduleId: z.string(),
  questions: z.array(quizQuestionSchema).min(1),
});

const trainingModuleSchema = z.object({
  id: z.string(),
  programId: z.string(),
  order: z.number(),
  type: z.enum(['company_intro', 'role_specific', 'compliance', 'operations']),
  roleId: z.string().optional(),
  title: z.string().min(1),
  contentMarkdown: z.string().min(1),
  languageVariants: z.record(z.string(), z.string()).optional(),
  quiz: quizSchema,
  sourceArtifactIds: z.array(z.string()).optional(),
});

const onboardingWeekSchema = z.object({
  week: z.number(),
  goals: z.array(z.string()).min(1),
  moduleIds: z.array(z.string()).min(1),
});

export const trainingProgramSchema = z
  .object({
    id: z.string(),
    businessId: z.string(),
    version: z.number(),
    modules: z.array(trainingModuleSchema).min(8, 'Program must have at least 8 modules'),
    scheduleWeeks: z.array(onboardingWeekSchema).min(1),
    status: z.enum(['generating', 'ready', 'published']),
    generatedAt: z.string(),
  })
  .superRefine((program, ctx) => {
    const types = program.modules.map((m) => m.type);
    if (!types.includes('company_intro')) {
      ctx.addIssue({ code: 'custom', message: 'Program must include a company_intro module' });
    }
    if (types.filter((t) => t === 'role_specific').length < 2) {
      ctx.addIssue({ code: 'custom', message: 'Program must include at least 2 role_specific modules' });
    }
    if (!types.includes('operations')) {
      ctx.addIssue({ code: 'custom', message: 'Program must include at least one operations module' });
    }
    if (!types.includes('compliance')) {
      ctx.addIssue({ code: 'custom', message: 'Program must include at least one compliance module' });
    }
  });

export type ValidatedTrainingProgram = z.infer<typeof trainingProgramSchema>;
