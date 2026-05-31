// Compliance generator (T2). Given a business's state + industry (+ employee
// count and the compliance research artifacts), it:
//   1. Determines the applicable laws (ADA, harassment, OSHA, state labor,
//      HIPAA if warranted, food-handler if warranted).
//   2. Generates one employee-readable compliance TrainingModule per law via
//      Claude (research artifacts cached as shared context).
//   3. Emits a ComplianceSnapshot with appliedLaws[{code,title,rationale,
//      moduleIds,status}] and persists it via getDb().compliance.create.
//
// The snapshot is what T4's compliance dashboard renders, so each `rationale`
// is concrete ("CA requires harassment training for employers with 5+
// employees → module added").

import { nanoid } from 'nanoid';
import { getDb } from '../contracts/db';
import { getLlm } from '../contracts/llm';
import type {
  AppliedLaw,
  AppliedLawStatus,
  ComplianceSnapshot,
  Quiz,
  ResearchArtifact,
  TrainingModule,
} from '../../types/index';

export interface ComplianceInput {
  businessId: string;
  programId: string;
  programVersion: number;
  state: string;
  industry: string;
  /** Drives size-gated laws (e.g. CA SB 1343 ≥ 5 employees). */
  employeeCount?: number;
  /** Compliance-relevant research artifacts (for module context + provenance). */
  research?: ResearchArtifact[];
  /** Module `order` offset so compliance modules slot after curriculum modules. */
  startOrder?: number;
  /** Optional business name for more specific rationales. */
  businessName?: string;
}

export interface ComplianceResult {
  modules: TrainingModule[];
  snapshot: ComplianceSnapshot;
}

// ---------------------------------------------------------------------------
// Law catalog — applicability rules parameterized by state/industry/size.
// ---------------------------------------------------------------------------

interface LawSpec {
  code: string;
  title: string;
  rationale: string;
  status: AppliedLawStatus;
  moduleTitle: string;
  /** Bullet points the module must cover; also seeds the fallback + quiz. */
  keyPoints: string[];
  /** Keywords used to attach matching research artifacts as provenance. */
  match: RegExp;
}

function isHealthcare(industry: string): boolean {
  return /health|medical|clinic|dental|pharma|hospital|therap|care\b|nursing|wellness/i.test(
    industry,
  );
}

function isFoodService(industry: string): boolean {
  return /food|beverage|restaurant|cafe|café|bar|bakery|kitchen|boba|bubble tea|tea|coffee/i.test(
    industry,
  );
}

/**
 * Decide which laws apply to this business. Pure + exported so it can be unit
 * tested and reused by T4's dashboard if needed.
 */
export function determineApplicableLaws(input: ComplianceInput): LawSpec[] {
  const st = (input.state || '').toUpperCase();
  const stateLabel = st || 'your state';
  const who = input.businessName || `this ${input.industry} business`;
  const headcount =
    typeof input.employeeCount === 'number' ? input.employeeCount : undefined;
  const laws: LawSpec[] = [];

  // --- Anti-harassment / anti-discrimination -------------------------------
  if (st === 'CA') {
    const meetsThreshold = headcount === undefined || headcount >= 5;
    if (meetsThreshold) {
      laws.push({
        code: 'CA-SB1343',
        title: 'California Sexual Harassment Prevention Training (SB 1343)',
        rationale: `California requires employers with 5+ employees to provide 1 hour of harassment-prevention training to non-supervisory staff within 6 months of hire and every 2 years (SB 1343; supervisory training under AB 1825 is 2 hours).${
          headcount !== undefined ? ` ${who} has ${headcount} employees` : ''
        } → harassment-prevention module added.`,
        status: 'satisfied',
        moduleTitle: 'Respectful Workplace & Harassment Prevention',
        keyPoints: [
          'what counts as harassment and discrimination (protected characteristics)',
          'examples of unacceptable conduct and bystander responsibility',
          'how to report safely and the ban on retaliation',
          'the SB 1343 training cadence (within 6 months of hire, every 2 years)',
        ],
        match: /harassment|sb.?1343|ab.?1825|discrimination|retaliat/i,
      });
    }
  } else {
    laws.push({
      code: 'EEOC-TITLE-VII',
      title: 'Anti-Harassment & Anti-Discrimination (Title VII / EEOC)',
      rationale: `Federal law (Title VII, enforced by the EEOC) prohibits workplace harassment and discrimination; ${stateLabel} may add its own training mandates. A harassment-prevention module was added so every employee knows the standard and how to report.`,
      status: 'satisfied',
      moduleTitle: 'Respectful Workplace & Harassment Prevention',
      keyPoints: [
        'protected characteristics under Title VII',
        'examples of harassment and discrimination',
        'how to report and the prohibition on retaliation',
      ],
      match: /harassment|discrimination|title vii|eeoc|retaliat/i,
    });
  }

  // --- OSHA workplace safety (applies to essentially all employers) --------
  laws.push({
    code: 'OSHA-GEN-DUTY',
    title: 'OSHA Workplace Safety (General Duty Clause)',
    rationale: `OSHA's General Duty Clause requires every employer to provide a workplace free of recognized hazards.${
      isFoodService(input.industry)
        ? ' A food-service floor involves hot liquids, wet floors, sharp tools, and machinery'
        : ` A ${input.industry} workplace carries recognized physical hazards`
    } → workplace-safety module added.`,
    status: 'satisfied',
    moduleTitle: 'Workplace Safety (OSHA)',
    keyPoints: [
      'common hazards in this workplace and how to avoid them',
      'reporting injuries and unsafe conditions',
      'your right to a safe workplace and to report without retaliation',
    ],
    match: /osha|safety|hazard|injur/i,
  });

  // --- State labor regulations (meal/rest breaks, wages) -------------------
  if (st === 'CA') {
    laws.push({
      code: 'CA-MEAL-REST',
      title: 'California Meal & Rest Break Law (Labor Code §512)',
      rationale:
        'California Labor Code §512 entitles non-exempt employees to a 30-minute meal break before the end of the 5th hour and a paid 10-minute rest break per 4 hours worked; missed breaks owe one hour of premium pay. Employees must be informed of these rights → labor-rights module added.',
      status: 'satisfied',
      moduleTitle: 'Your Rights: Meal & Rest Breaks (California)',
      keyPoints: [
        '30-minute meal break before the end of the 5th hour',
        '10-minute paid rest break per 4 hours worked',
        'premium pay owed for missed breaks and how to raise it',
      ],
      match: /labor|meal|rest|break|wage|§512|512/i,
    });
  } else {
    laws.push({
      code: 'US-FLSA-LABOR',
      title: `${stateLabel} Labor Standards (FLSA + state rules)`,
      rationale: `The federal Fair Labor Standards Act sets minimum wage and overtime rules, and ${stateLabel} adds its own wage, break, and onboarding requirements. A labor-rights module was added so employees understand their entitlements.`,
      status: 'needs_review',
      moduleTitle: `Your Rights: Wages & Breaks (${stateLabel})`,
      keyPoints: [
        'minimum wage and overtime basics',
        'any state-specific meal/rest break entitlements',
        'how to raise a wage or break concern',
      ],
      match: /labor|wage|overtime|break|flsa/i,
    });
  }

  // --- ADA — accessible service (training covers staff conduct only) -------
  laws.push({
    code: 'ADA-TITLE-III',
    title: 'ADA Title III — Accessible Customer Service',
    rationale: `As a place of public accommodation, ${who} must serve customers with disabilities without discrimination (ADA Title III). This module trains staff conduct (service animals, accommodations, communication); physical-access compliance (ramps, restrooms, signage) is the owner's responsibility and is flagged for review → status needs_review.`,
    status: 'needs_review',
    moduleTitle: 'Serving Every Customer (ADA Basics)',
    keyPoints: [
      'welcoming customers with disabilities and offering accommodations',
      'service-animal rules and respectful communication',
      'who to escalate an accessibility request to',
    ],
    match: /\bada\b|disab|accessib|accommodation/i,
  });

  // --- HIPAA (only if the industry handles protected health information) ---
  if (isHealthcare(input.industry)) {
    laws.push({
      code: 'HIPAA-PRIVACY',
      title: 'HIPAA Privacy & Security Basics',
      rationale: `The ${input.industry} industry handles protected health information (PHI), so HIPAA's Privacy and Security Rules apply. A privacy-basics module was added; appointing a Privacy Officer and signing Business Associate Agreements are owner responsibilities → status needs_review.`,
      status: 'needs_review',
      moduleTitle: 'Protecting Patient Privacy (HIPAA Basics)',
      keyPoints: [
        'what counts as protected health information (PHI)',
        'minimum-necessary access and never sharing PHI improperly',
        'reporting a suspected privacy breach',
      ],
      match: /hipaa|phi|privacy|health information/i,
    });
  }

  // --- Food handler certification (only for food-service businesses) -------
  if (isFoodService(input.industry)) {
    laws.push({
      code: st === 'CA' ? 'CA-FOOD-HANDLER' : 'FOOD-HANDLER',
      title:
        st === 'CA'
          ? 'California Food Handler Card (Health & Safety Code §113948)'
          : 'Food Handler Certification & Food Safety',
      rationale:
        st === 'CA'
          ? 'California requires every food employee to obtain a Food Handler Card within 30 days of hire and renew every 3 years (H&SC §113948). A food-safety module was added; obtaining the card is the employee’s responsibility, tracked by the owner → status needs_review.'
          : `${stateLabel} food-service businesses must follow food-safety rules and most require food-handler certification. A food-safety module was added; certification is tracked per employee → status needs_review.`,
      status: 'needs_review',
      moduleTitle: 'Food Safety & Your Food Handler Card',
      keyPoints: [
        'safe temperatures and the danger zone (cold holding ≤ 41°F)',
        'handwashing, cross-contamination, and sanitizer use',
        'obtaining and renewing your food handler card',
      ],
      match: /food.?handler|food safety|servsafe|temperature|sanitiz/i,
    });
  }

  return laws;
}

// ---------------------------------------------------------------------------
// Module content generation (Claude, with cached shared context).
// ---------------------------------------------------------------------------

function complianceSystem(input: ComplianceInput): string {
  const research = (input.research ?? []).filter(
    (a) => a.category === 'compliance',
  );
  const ctx = research.length
    ? research
        .map((a) => `- ${a.title} (${a.source}): ${a.summary}`)
        .join('\n')
    : '- (no external research provided; rely on standard requirements)';
  return [
    'You are a compliance-training author for small, often immigrant-owned businesses.',
    'Write clear, warm, practical training modules that a new hire can understand.',
    'Avoid legalese; explain the "why" and what the employee should actually do.',
    '',
    `Business context: industry = ${input.industry}; state = ${input.state || 'US'}.`,
    '',
    'Research context (cite where relevant):',
    ctx,
    '',
    'Output ONLY the module body as GitHub-flavored Markdown, starting with an H1 title.',
    'Keep it ~250–400 words with short sections and a final "Your responsibilities" list.',
    'Do not include preamble, follow-up questions, or a quiz.',
  ].join('\n');
}

function fallbackMarkdown(law: LawSpec): string {
  return [
    `# ${law.moduleTitle}`,
    '',
    `This module covers **${law.title}** and what it means for you day to day.`,
    '',
    '## Key points',
    ...law.keyPoints.map((p) => `- ${p[0].toUpperCase()}${p.slice(1)}.`),
    '',
    '## Your responsibilities',
    '- Follow the standards above on every shift.',
    '- Ask a shift lead or the owner if anything is unclear.',
    '- Report concerns promptly — you will not be retaliated against for a good-faith report.',
  ].join('\n');
}

function buildQuiz(moduleId: string, law: LawSpec): Quiz {
  return {
    id: `quiz_${moduleId}`,
    moduleId,
    questions: [
      {
        id: 'q1',
        prompt: `In your own words, what are your responsibilities under "${law.moduleTitle}"?`,
        type: 'free_response',
        rubric: `Full credit: the answer reflects the key points — ${law.keyPoints.join('; ')}.`,
      },
    ],
  };
}

function artifactIdsFor(
  law: LawSpec,
  research: ResearchArtifact[],
): string[] {
  return research
    .filter((a) => law.match.test(`${a.title} ${a.summary}`))
    .map((a) => a.id);
}

// ---------------------------------------------------------------------------
// Main entry point.
// ---------------------------------------------------------------------------

export async function generateCompliance(
  input: ComplianceInput,
): Promise<ComplianceResult> {
  const laws = determineApplicableLaws(input);
  const research = input.research ?? [];
  const llm = getLlm();
  const system = complianceSystem(input);
  const startOrder = input.startOrder ?? 0;

  const modules: TrainingModule[] = [];
  const appliedLaws: AppliedLaw[] = [];

  // Generate each module in parallel; the cached system prefix is reused across
  // all per-law calls. One LLM failure falls back to deterministic content
  // rather than sinking the whole run.
  const built = await Promise.all(
    laws.map(async (law, i) => {
      const moduleId = `mod_comp_${nanoid(8)}`;
      const sourceArtifactIds = artifactIdsFor(law, research);

      let contentMarkdown: string;
      try {
        const out = (
          await llm.generate({
            system,
            cache: true,
            maxTokens: 1500,
            messages: [
              {
                role: 'user',
                content: `Write the training module titled "${law.moduleTitle}" for ${law.title}. Cover: ${law.keyPoints.join('; ')}.`,
              },
            ],
          })
        ).trim();
        contentMarkdown = out || fallbackMarkdown(law);
      } catch (err) {
        console.error(`[compliance] generation failed for ${law.code}:`, err);
        contentMarkdown = fallbackMarkdown(law);
      }

      const mod: TrainingModule = {
        id: moduleId,
        programId: input.programId,
        order: startOrder + i,
        type: 'compliance',
        title: law.moduleTitle,
        contentMarkdown,
        quiz: buildQuiz(moduleId, law),
        sourceArtifactIds,
      };

      const applied: AppliedLaw = {
        code: law.code,
        title: law.title,
        rationale: law.rationale,
        moduleIds: [moduleId],
        status: law.status,
      };
      return { mod, applied };
    }),
  );

  for (const { mod, applied } of built) {
    modules.push(mod);
    appliedLaws.push(applied);
  }

  const snapshot: ComplianceSnapshot = {
    id: `comp_${nanoid(10)}`,
    businessId: input.businessId,
    programVersion: input.programVersion,
    state: input.state,
    industry: input.industry,
    appliedLaws,
    generatedAt: new Date().toISOString(),
  };

  try {
    await getDb().compliance.create(snapshot);
  } catch (err) {
    console.error('[compliance] snapshot persist failed:', err);
  }

  return { modules, snapshot };
}
