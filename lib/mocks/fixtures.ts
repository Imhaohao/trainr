// Happy Lemon demo fixture — the lifeblood of parallel dev.
// A complete, realistic Asian-immigrant-owned boba shop in California.
//
// Other tracks import these to render real-looking UI before any backend lands.
// Extend additively; do not reshape the shared types here.

import type {
  Business,
  User,
  IntakeProfile,
  StoredFile,
  ResearchArtifact,
  TrainingProgram,
  TrainingModule,
  Quiz,
  OnboardingWeek,
  EmployeeProgress,
  ComplianceSnapshot,
  AuditEvent,
  ChatMessage,
} from '../../types/index';

const NOW = '2026-05-31T17:00:00.000Z';

export const DEMO_JOIN_CODE = 'HLEMON';

// ---------------------------------------------------------------------------
// Ids — stable so cross-track references stay valid.
// ---------------------------------------------------------------------------
export const IDS = {
  business: 'biz_happylemon',
  owner: 'usr_owner_xiao',
  employee1: 'usr_emp_maria',
  employee2: 'usr_emp_kevin',
  roleBarista: 'role_barista',
  roleCashier: 'role_cashier',
  roleShift: 'role_shift_lead',
  program: 'prog_happylemon_v1',
  compliance: 'comp_happylemon_v1',
} as const;

// ---------------------------------------------------------------------------
// Business + users
// ---------------------------------------------------------------------------

export const demoBusiness: Business = {
  id: IDS.business,
  name: 'Happy Lemon — Mission St',
  industry: 'Food & Beverage (Bubble Tea / Cafe)',
  address: '2400 Mission St, San Francisco, CA 94110',
  state: 'CA',
  employeeCount: 20,
  demographics:
    'Predominantly first- and second-generation immigrant staff; many native Mandarin, Cantonese, and Spanish speakers. Owner is a first-generation immigrant from Taiwan.',
  languages: ['en', 'zh-Hans', 'zh-Hant', 'es'],
  mission:
    'Serve fresh, joyful drinks fast and friendly — and give every team member a place to grow, regardless of the language they grew up speaking.',
  roles: [
    {
      id: IDS.roleBarista,
      title: 'Barista',
      customerFacing: true,
      description: 'Makes drinks, cooks toppings, keeps the bar stocked and clean.',
    },
    {
      id: IDS.roleCashier,
      title: 'Cashier',
      customerFacing: true,
      description: 'Greets customers, takes orders on POS, handles payment and pickup.',
    },
    {
      id: IDS.roleShift,
      title: 'Shift Lead',
      customerFacing: true,
      description: 'Opens/closes the store, runs the floor, handles escalations and cash drops.',
    },
  ],
  joinCode: DEMO_JOIN_CODE,
  ownerId: IDS.owner,
  createdAt: NOW,
  status: 'ready',
};

export const demoOwner: User = {
  id: IDS.owner,
  role: 'owner',
  businessId: IDS.business,
  name: 'Mrs. Xiao',
  email: 'xiao@happylemon-demo.com',
  createdAt: NOW,
};

export const demoEmployees: User[] = [
  {
    id: IDS.employee1,
    role: 'employee',
    businessId: IDS.business,
    name: 'Maria Reyes',
    createdAt: NOW,
  },
  {
    id: IDS.employee2,
    role: 'employee',
    businessId: IDS.business,
    name: 'Kevin Chen',
    createdAt: NOW,
  },
];

export const demoUsers: User[] = [demoOwner, ...demoEmployees];

// ---------------------------------------------------------------------------
// Intake (3 boba recipes + ops dumps)
// ---------------------------------------------------------------------------

export const demoIntake: IntakeProfile = {
  businessId: IDS.business,
  openingClosing:
    'OPEN (30 min before): unlock, disarm alarm, turn on lights/POS/music. Boil water, brew black + green tea (steep 8 min, no longer or it gets bitter). Cook fresh tapioca pearls (boil 25 min, rest 15 min in brown sugar syrup). Stock cups, lids, straws, napkins. Count opening drawer ($200 float). Wipe all surfaces. CLOSE: stop selling pearls 1 hr before close, dump leftover cooked pearls (never keep overnight). Clean blenders, sealing machine, fridge handles. Mop floors back-to-front. Count drawer, drop cash in safe, log totals. Arm alarm, lock up.',
  cleaning:
    'Sealer machine: wipe film path after every rush, deep clean nightly. Blenders: rinse between drinks, full wash hourly. Fridges: check temp log twice/shift (must read <= 41°F). Sanitizer buckets: change every 4 hrs, test strips 200-400ppm. Floors mopped at close. Bathroom checked hourly, logged.',
  machineOperations:
    'Sealing machine: load film, set to 7 (medium), press cup until it clicks, peel test the first seal each shift. Tea brewer: 1 filter bag per batch, never re-steep. Fructose dispenser: calibrate pump weekly. Ice machine: scoop only with the blue scoop, never hands or cups.',
  drinkProduction:
    'Standard build order: pearls/toppings in cup -> ice -> tea base -> sugar -> milk/creamer -> seal -> shake 10x. Sugar levels: 0/25/50/75/100%. Ice levels: no/less/regular/extra. Always confirm sugar + ice with customer. Default is 100% sugar, regular ice if not specified.',
  recipes: [
    {
      name: 'Classic Pearl Milk Tea (Large)',
      ingredients: [
        '180ml brewed black tea',
        '30ml fructose syrup (100% = 30ml)',
        '60ml non-dairy creamer',
        '120g cooked tapioca pearls',
        'ice to regular line',
      ],
      steps: [
        'Add cooked pearls to large cup',
        'Fill ice to the regular line',
        'Pour black tea base to the tea line',
        'Add fructose per requested sugar level',
        'Add non-dairy creamer to the fill line',
        'Seal cup and shake 10 times',
      ],
    },
    {
      name: 'Rock Salt Cheese Green Tea (Large)',
      ingredients: [
        '200ml brewed green tea',
        '25ml fructose syrup',
        'rock salt cheese foam (premade, 1 ladle)',
        'ice to regular line',
      ],
      steps: [
        'Fill ice to the regular line',
        'Pour green tea to the tea line',
        'Add fructose per requested sugar level',
        'Do NOT seal — this drink is served open with a wide straw',
        'Top with a generous ladle of cheese foam',
        'Dust with a pinch of matcha (optional)',
      ],
    },
    {
      name: 'Mango Green Tea with Aiyu Jelly (Large)',
      ingredients: [
        '160ml brewed green tea',
        '40ml mango puree',
        '20ml fructose syrup',
        '100g aiyu jelly',
        'ice to extra line',
      ],
      steps: [
        'Add aiyu jelly to the cup',
        'Fill ice to the extra line',
        'Add mango puree',
        'Pour green tea to the tea line',
        'Add fructose per requested sugar level',
        'Seal and shake 10 times',
      ],
    },
  ],
  notes:
    'Most important things for new hires: confirm sugar + ice every time, never serve overnight pearls, keep the sealer film path clean, and smile — a lot of our regulars come for the vibe.',
  uploadedFileIds: ['file_recipe_pdf', 'file_employee_handbook'],
  menuImageIds: ['file_menu_front', 'file_menu_back'],
};

// ---------------------------------------------------------------------------
// Stored files
// ---------------------------------------------------------------------------

export const demoFiles: StoredFile[] = [
  {
    id: 'file_recipe_pdf',
    businessId: IDS.business,
    key: `${IDS.business}/uploads/file_recipe_pdf`,
    filename: 'happy-lemon-recipes.pdf',
    contentType: 'application/pdf',
    kind: 'upload',
    createdAt: NOW,
  },
  {
    id: 'file_employee_handbook',
    businessId: IDS.business,
    key: `${IDS.business}/uploads/file_employee_handbook`,
    filename: 'old-handbook-scan.pdf',
    contentType: 'application/pdf',
    kind: 'upload',
    createdAt: NOW,
  },
  {
    id: 'file_menu_front',
    businessId: IDS.business,
    key: `${IDS.business}/uploads/file_menu_front`,
    filename: 'menu-front.jpg',
    contentType: 'image/jpeg',
    kind: 'menu_image',
    createdAt: NOW,
  },
  {
    id: 'file_menu_back',
    businessId: IDS.business,
    key: `${IDS.business}/uploads/file_menu_back`,
    filename: 'menu-back.jpg',
    contentType: 'image/jpeg',
    kind: 'menu_image',
    createdAt: NOW,
  },
];

// ---------------------------------------------------------------------------
// Research artifacts (boba / food-safety / CA labor)
// ---------------------------------------------------------------------------

export const demoResearch: ResearchArtifact[] = [
  {
    id: 'res_ca_food_handler',
    businessId: IDS.business,
    category: 'compliance',
    source: 'https://www.cdph.ca.gov/food-handler-card',
    title: 'California Food Handler Card requirement',
    summary:
      'All food employees in CA must obtain a Food Handler Card within 30 days of hire and renew every 3 years. Covers safe temperatures, cross-contamination, and handwashing.',
    structuredKey: `${IDS.business}/research/res_ca_food_handler.json`,
    createdAt: NOW,
  },
  {
    id: 'res_cooling_temps',
    businessId: IDS.business,
    category: 'industry_standard',
    source: 'https://www.fda.gov/food-code',
    title: 'FDA Food Code — cold holding & danger zone',
    summary:
      'Cold foods must be held at or below 41°F. The temperature danger zone is 41–135°F; perishable items should not sit in it more than 2 hours. Relevant to milk, creamer, and prepared toppings.',
    structuredKey: `${IDS.business}/research/res_cooling_temps.json`,
    createdAt: NOW,
  },
  {
    id: 'res_boba_prep',
    businessId: IDS.business,
    category: 'industry_standard',
    source: 'https://www.boba-supply-guide.example/pearl-prep',
    title: 'Tapioca pearl preparation best practices',
    summary:
      'Cook pearls in rapidly boiling water 20–30 min, rest covered 15 min, then hold in sugar syrup. Discard after 4 hours of holding; never refrigerate cooked pearls or hold overnight (texture and food-safety risk).',
    structuredKey: `${IDS.business}/research/res_boba_prep.json`,
    createdAt: NOW,
  },
  {
    id: 'res_ca_meal_breaks',
    businessId: IDS.business,
    category: 'compliance',
    source: 'https://www.dir.ca.gov/dlse/meal-rest-breaks',
    title: 'California meal & rest break law',
    summary:
      'CA non-exempt employees get a 30-min unpaid meal break before the end of the 5th hour, and a paid 10-min rest break per 4 hours worked. Missed breaks owe one hour of premium pay.',
    structuredKey: `${IDS.business}/research/res_ca_meal_breaks.json`,
    createdAt: NOW,
  },
  {
    id: 'res_harassment_training',
    businessId: IDS.business,
    category: 'compliance',
    source: 'https://www.calcivilrights.ca.gov/shpt',
    title: 'CA sexual harassment prevention training (SB 1343)',
    summary:
      'Employers with 5+ employees must provide 1 hour of sexual harassment prevention training to non-supervisory staff within 6 months of hire and every 2 years thereafter.',
    structuredKey: `${IDS.business}/research/res_harassment_training.json`,
    createdAt: NOW,
  },
  {
    id: 'res_competitor_onboarding',
    businessId: IDS.business,
    category: 'competitor',
    source: 'https://www.bevchain-careers.example/training',
    title: 'National bubble-tea chain onboarding outline',
    summary:
      'Typical chain onboarding: brand story, POS + cash handling, drink build standards, station rotation, food safety cert, and a 4-week ramp with weekly checkpoints. Used as a structure benchmark.',
    structuredKey: `${IDS.business}/research/res_competitor_onboarding.json`,
    createdAt: NOW,
  },
];

// ---------------------------------------------------------------------------
// Training program — 8 modules with quizzes
// ---------------------------------------------------------------------------

function quiz(moduleId: string, qs: Quiz['questions']): Quiz {
  return { id: `quiz_${moduleId}`, moduleId, questions: qs };
}

const m = (
  partial: Omit<TrainingModule, 'programId'>,
): TrainingModule => ({ ...partial, programId: IDS.program });

export const demoModules: TrainingModule[] = [
  m({
    id: 'mod_company_intro',
    order: 1,
    type: 'company_intro',
    title: 'Welcome to Happy Lemon',
    contentMarkdown: `# Welcome to Happy Lemon — Mission St

We're a family-run bubble tea shop on Mission Street. Our mission is simple:

> Serve fresh, joyful drinks fast and friendly — and give every team member a place to grow, no matter the language you grew up speaking.

## What we value
- **Freshness:** we never serve overnight pearls or expired creamer.
- **Speed with a smile:** confirm the order, make it right, hand it over warmly.
- **Respect:** we speak many languages here. Help each other.

## Who's who
- **Cashiers** greet and take orders.
- **Baristas** build the drinks.
- **Shift Leads** open, close, and have your back.`,
    languageVariants: {
      'zh-Hans': `# 欢迎加入快乐柠檬 — Mission St 店\n\n我们是 Mission 街上的一家家庭经营的珍珠奶茶店。我们的使命很简单：\n\n> 快速、友好地提供新鲜、令人愉悦的饮品 — 并让每位团队成员都有成长的空间，无论你的母语是什么。`,
    },
    quiz: quiz('mod_company_intro', [
      {
        id: 'q1',
        prompt: 'What do we never serve to customers?',
        type: 'multiple_choice',
        options: ['Cold tea', 'Overnight (day-old) pearls', 'Large drinks', 'Green tea'],
        correctIndex: 1,
      },
      {
        id: 'q2',
        prompt: 'In your own words, what does "speed with a smile" mean to you on a busy shift?',
        type: 'free_response',
        rubric:
          'Full credit: mentions both being fast/efficient AND staying friendly/warm with the customer even under pressure.',
      },
    ]),
    sourceArtifactIds: [],
  }),
  m({
    id: 'mod_pos_cash',
    order: 2,
    type: 'role_specific',
    roleId: IDS.roleCashier,
    title: 'Cashier: POS & Cash Handling',
    contentMarkdown: `# Cashier: POS & Cash Handling

## Taking an order
1. Greet the customer.
2. Ring up the drink and size.
3. **Always confirm sugar level and ice level** — these are required for every drink.
4. Read back the order and total.

## Sugar & ice levels
- Sugar: 0 / 25 / 50 / 75 / 100% (default 100% if not specified).
- Ice: no / less / regular / extra (default regular).

## Cash
- Opening float is **$200**. Count it at open.
- Large bills ($50/$100): mark with the pen, drop in the under-counter slot.
- At close, count the drawer, drop cash in the safe, and log the totals.`,
    quiz: quiz('mod_pos_cash', [
      {
        id: 'q1',
        prompt: 'Which two things must you confirm on EVERY drink order?',
        type: 'multiple_choice',
        options: ['Size and price', 'Sugar level and ice level', 'Name and phone', 'Hot or cold and size'],
        correctIndex: 1,
      },
      {
        id: 'q2',
        prompt: 'What is the opening cash float?',
        type: 'multiple_choice',
        options: ['$100', '$150', '$200', '$250'],
        correctIndex: 2,
      },
    ]),
    sourceArtifactIds: ['res_competitor_onboarding'],
  }),
  m({
    id: 'mod_drink_build',
    order: 3,
    type: 'role_specific',
    roleId: IDS.roleBarista,
    title: 'Barista: Drink Build Standards',
    contentMarkdown: `# Barista: Drink Build Standards

## Standard build order
**toppings/pearls → ice → tea base → sugar → milk/creamer → seal → shake 10×**

## Our signature drinks
### Classic Pearl Milk Tea (L)
- 120g cooked pearls, ice to regular line, 180ml black tea, fructose per sugar level, 60ml creamer. Seal + shake 10×.

### Rock Salt Cheese Green Tea (L)
- Green tea + fructose, **served open** (no seal), topped with a ladle of cheese foam.

### Mango Green Tea w/ Aiyu Jelly (L)
- Aiyu jelly, extra ice, mango puree, green tea, fructose. Seal + shake.

> Tip: confirm the sticker matches the cup before you start.`,
    languageVariants: {
      'zh-Hans': `# 吧台：调饮标准\n\n## 标准调制顺序\n**配料/珍珠 → 冰 → 茶底 → 糖 → 奶/奶精 → 封口 → 摇匀10次**`,
    },
    quiz: quiz('mod_drink_build', [
      {
        id: 'q1',
        prompt: 'What is the correct standard build order?',
        type: 'multiple_choice',
        options: [
          'tea → ice → pearls → sugar → creamer',
          'pearls/toppings → ice → tea base → sugar → milk/creamer → seal → shake',
          'ice → creamer → tea → pearls → sugar',
          'sugar → tea → ice → pearls → creamer',
        ],
        correctIndex: 1,
      },
      {
        id: 'q2',
        prompt: 'Which drink is served open (not sealed)?',
        type: 'multiple_choice',
        options: ['Classic Pearl Milk Tea', 'Mango Green Tea w/ Aiyu', 'Rock Salt Cheese Green Tea', 'All of them'],
        correctIndex: 2,
      },
    ]),
    sourceArtifactIds: ['res_boba_prep'],
  }),
  m({
    id: 'mod_pearl_prep',
    order: 4,
    type: 'operations',
    title: 'Operations: Pearl Prep & Holding',
    contentMarkdown: `# Operations: Pearl Prep & Holding

1. Boil pearls in **rapidly boiling** water for **25 minutes**, stirring at the start so they don't stick.
2. Turn off heat, cover, **rest 15 minutes**.
3. Drain, rinse, and hold in **brown sugar syrup**.
4. **Discard after 4 hours.** Never refrigerate cooked pearls. **Never hold overnight.**

> Why it matters: old pearls go hard and are a food-safety risk. This is the #1 quality rule at Happy Lemon.`,
    quiz: quiz('mod_pearl_prep', [
      {
        id: 'q1',
        prompt: 'How long may cooked pearls be held before they must be discarded?',
        type: 'multiple_choice',
        options: ['1 hour', '4 hours', 'Until close', 'Overnight is fine'],
        correctIndex: 1,
      },
    ]),
    sourceArtifactIds: ['res_boba_prep'],
  }),
  m({
    id: 'mod_food_safety',
    order: 5,
    type: 'compliance',
    title: 'Food Safety & California Food Handler Card',
    contentMarkdown: `# Food Safety & Your Food Handler Card

## You must get a Food Handler Card
California law requires every food employee to obtain a **Food Handler Card within 30 days of hire** (renew every 3 years).

## Temperature rules
- Cold items (milk, creamer, toppings) held at **≤ 41°F**.
- The **danger zone is 41–135°F** — don't let perishables sit there more than 2 hours.
- Check and **log fridge temps twice per shift**.

## Handwashing & sanitizer
- Wash hands on arrival, after breaks, after touching your face/phone.
- Sanitizer buckets: change every 4 hours; test strips **200–400 ppm**.`,
    quiz: quiz('mod_food_safety', [
      {
        id: 'q1',
        prompt: 'Within how many days of hire must you obtain a CA Food Handler Card?',
        type: 'multiple_choice',
        options: ['7 days', '14 days', '30 days', '90 days'],
        correctIndex: 2,
      },
      {
        id: 'q2',
        prompt: 'What is the maximum safe cold-holding temperature?',
        type: 'multiple_choice',
        options: ['32°F', '41°F', '50°F', '60°F'],
        correctIndex: 1,
      },
    ]),
    sourceArtifactIds: ['res_ca_food_handler', 'res_cooling_temps'],
  }),
  m({
    id: 'mod_breaks_labor',
    order: 6,
    type: 'compliance',
    title: 'Your Rights: Meal & Rest Breaks (CA)',
    contentMarkdown: `# Your Rights: Meal & Rest Breaks

California law protects your breaks:
- A **30-minute unpaid meal break** before the end of your 5th hour of work.
- A paid **10-minute rest break for every 4 hours** worked.
- If a break is missed, you're owed **one hour of premium pay** — tell your Shift Lead.

We schedule breaks around rushes, but your breaks are your right. Never skip them silently.`,
    quiz: quiz('mod_breaks_labor', [
      {
        id: 'q1',
        prompt: 'When must a 30-minute meal break be taken?',
        type: 'multiple_choice',
        options: [
          'Before the end of the 5th hour of work',
          'Only at the end of the shift',
          'Whenever it is slow',
          'Breaks are optional',
        ],
        correctIndex: 0,
      },
    ]),
    sourceArtifactIds: ['res_ca_meal_breaks'],
  }),
  m({
    id: 'mod_harassment',
    order: 7,
    type: 'compliance',
    title: 'Respectful Workplace & Harassment Prevention',
    contentMarkdown: `# Respectful Workplace & Harassment Prevention

Everyone deserves a safe, respectful workplace.

## What's not okay
- Unwelcome comments or jokes about someone's body, race, gender, religion, or accent.
- Unwanted touching or repeated unwanted attention.
- Retaliating against someone for speaking up.

## How to report
Tell any Shift Lead or Mrs. Xiao directly, or use the report box in the back office. Reports are taken seriously and you will not be punished for making one in good faith.

*California requires harassment prevention training for staff at businesses with 5+ employees.*`,
    quiz: quiz('mod_harassment', [
      {
        id: 'q1',
        prompt: 'If you experience or witness harassment, what should you do?',
        type: 'free_response',
        rubric:
          'Full credit: identifies a reporting channel (Shift Lead, Mrs. Xiao, or the report box) and recognizes that good-faith reports are protected from retaliation.',
      },
    ]),
    sourceArtifactIds: ['res_harassment_training'],
  }),
  m({
    id: 'mod_open_close',
    order: 8,
    type: 'operations',
    title: 'Operations: Opening & Closing Checklist',
    contentMarkdown: `# Opening & Closing Checklist

## Opening (30 min before)
- Unlock, disarm alarm, lights / POS / music on.
- Boil water; brew black + green tea (steep **8 min**, no longer).
- Cook fresh pearls (boil 25 / rest 15).
- Stock cups, lids, straws, napkins.
- Count opening drawer (**$200 float**). Wipe surfaces.

## Closing
- Stop selling pearls **1 hour before close**; dump leftover cooked pearls.
- Clean blenders, sealing machine, fridge handles.
- Mop floors back-to-front.
- Count drawer, drop cash in safe, log totals.
- Arm alarm, lock up.`,
    quiz: quiz('mod_open_close', [
      {
        id: 'q1',
        prompt: 'How long do you steep the tea?',
        type: 'multiple_choice',
        options: ['3 minutes', '8 minutes', '15 minutes', 'Overnight'],
        correctIndex: 1,
      },
    ]),
    sourceArtifactIds: [],
  }),
];

export const demoSchedule: OnboardingWeek[] = [
  {
    week: 1,
    goals: ['Learn the brand and values', 'Master POS + cash handling', 'Get your Food Handler Card started'],
    moduleIds: ['mod_company_intro', 'mod_pos_cash', 'mod_food_safety'],
  },
  {
    week: 2,
    goals: ['Build every signature drink to standard', 'Nail pearl prep and holding rules'],
    moduleIds: ['mod_drink_build', 'mod_pearl_prep'],
  },
  {
    week: 3,
    goals: ['Know your labor rights', 'Understand respectful-workplace expectations'],
    moduleIds: ['mod_breaks_labor', 'mod_harassment'],
  },
  {
    week: 4,
    goals: ['Run opening and closing independently', 'Shadow a full shift end-to-end'],
    moduleIds: ['mod_open_close'],
  },
];

export const demoProgram: TrainingProgram = {
  id: IDS.program,
  businessId: IDS.business,
  version: 1,
  modules: demoModules,
  scheduleWeeks: demoSchedule,
  status: 'ready',
  generatedAt: NOW,
};

// ---------------------------------------------------------------------------
// Compliance snapshot
// ---------------------------------------------------------------------------

export const demoCompliance: ComplianceSnapshot = {
  id: IDS.compliance,
  businessId: IDS.business,
  programVersion: 1,
  state: 'CA',
  industry: 'Food & Beverage',
  appliedLaws: [
    {
      code: 'CA-FOOD-HANDLER',
      title: 'California Food Handler Card (Health & Safety Code §113948)',
      rationale: 'Food employees must obtain a Food Handler Card within 30 days of hire.',
      moduleIds: ['mod_food_safety'],
      status: 'satisfied',
    },
    {
      code: 'FDA-FOOD-CODE-TEMP',
      title: 'FDA Food Code — cold holding ≤ 41°F',
      rationale: 'Perishable dairy/creamer and toppings require documented cold holding and temp logs.',
      moduleIds: ['mod_food_safety', 'mod_open_close'],
      status: 'satisfied',
    },
    {
      code: 'CA-MEAL-REST',
      title: 'California Meal & Rest Break Law (Labor Code §512)',
      rationale: 'Non-exempt employees are entitled to meal and rest breaks; staff must be informed.',
      moduleIds: ['mod_breaks_labor'],
      status: 'satisfied',
    },
    {
      code: 'CA-SB1343',
      title: 'CA Sexual Harassment Prevention Training (SB 1343)',
      rationale: 'Employers with 5+ employees must provide 1 hour of training within 6 months of hire.',
      moduleIds: ['mod_harassment'],
      status: 'needs_review',
    },
    {
      code: 'ADA-TITLE-III',
      title: 'ADA Title III — accessible service',
      rationale: 'Customer-facing staff should know basic accommodations; not yet covered by a dedicated module.',
      moduleIds: [],
      status: 'flagged',
    },
  ],
  generatedAt: NOW,
};

// ---------------------------------------------------------------------------
// Employee progress
// ---------------------------------------------------------------------------

export const demoProgress: EmployeeProgress[] = [
  {
    id: 'prog_maria_intro',
    employeeId: IDS.employee1,
    businessId: IDS.business,
    moduleId: 'mod_company_intro',
    status: 'completed',
    quizScore: 100,
    completedAt: NOW,
    certified: true,
  },
  {
    id: 'prog_maria_pos',
    employeeId: IDS.employee1,
    businessId: IDS.business,
    moduleId: 'mod_pos_cash',
    status: 'in_progress',
  },
  {
    id: 'prog_kevin_intro',
    employeeId: IDS.employee2,
    businessId: IDS.business,
    moduleId: 'mod_company_intro',
    status: 'completed',
    quizScore: 80,
    completedAt: NOW,
    certified: true,
  },
  {
    id: 'prog_kevin_drink',
    employeeId: IDS.employee2,
    businessId: IDS.business,
    moduleId: 'mod_drink_build',
    status: 'not_started',
  },
];

// ---------------------------------------------------------------------------
// Audit events
// ---------------------------------------------------------------------------

export const demoAudit: AuditEvent[] = [
  {
    id: 'audit_1',
    businessId: IDS.business,
    actorId: IDS.owner,
    action: 'business.created',
    detail: 'Created business "Happy Lemon — Mission St" (join code HLEMON).',
    createdAt: '2026-05-31T16:00:00.000Z',
  },
  {
    id: 'audit_2',
    businessId: IDS.business,
    actorId: IDS.owner,
    action: 'intake.completed',
    detail: 'Completed 6-step intake with 3 recipes and 4 uploads.',
    createdAt: '2026-05-31T16:20:00.000Z',
  },
  {
    id: 'audit_3',
    businessId: IDS.business,
    actorId: 'system',
    action: 'pipeline.completed',
    detail: 'Generated program v1: 8 modules, 12 quiz questions, compliance snapshot.',
    programVersion: 1,
    createdAt: '2026-05-31T16:45:00.000Z',
  },
];

// ---------------------------------------------------------------------------
// Chat (coach) sample
// ---------------------------------------------------------------------------

export const demoChat: ChatMessage[] = [
  {
    id: 'chat_1',
    sessionId: 'sess_demo',
    role: 'user',
    content: 'What do I do if a customer complains their drink is too sweet?',
    createdAt: NOW,
  },
  {
    id: 'chat_2',
    sessionId: 'sess_demo',
    role: 'assistant',
    content:
      'Apologize, then offer to remake it at a lower sugar level. Remember our levels are 0/25/50/75/100% — ask what they\'d prefer and rebuild. Always confirm sugar and ice on the remake so it\'s right this time.',
    citations: [{ moduleId: 'mod_pos_cash', title: 'Cashier: POS & Cash Handling', snippet: 'Always confirm sugar level and ice level' }],
    createdAt: NOW,
  },
];

// ---------------------------------------------------------------------------
// Aggregate snapshot — used by mock-db and seed script.
// ---------------------------------------------------------------------------

export const demoFixture = {
  business: demoBusiness,
  users: demoUsers,
  intake: demoIntake,
  files: demoFiles,
  research: demoResearch,
  program: demoProgram,
  compliance: demoCompliance,
  progress: demoProgress,
  audit: demoAudit,
  chat: demoChat,
};

export type DemoFixture = typeof demoFixture;
