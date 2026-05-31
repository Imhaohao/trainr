import type { Language } from '@/types/training';

export const employeeUiStrings = {
  en: {
    practiceStation: 'Practice station',
    startPractice: 'Start practice',
    nextStep: 'Next step',
    submitPractice: 'Submit run',
    retry: 'Try again',
    simScore: 'Practice score',
    simPassed: 'Practice passed',
    simFailed: 'Not yet passing',
    talkToCoachAboutRun: 'Talk to your coach about this run',
    safetyStop: 'Safety stop',
    fixtureLabel: 'Fixture sim (offline demo)',
    stepOf: 'Step',
    debriefTitle: 'Coach debrief',
    continueLearning: 'Continue',
    quizTitle: 'Module quiz',
    submitQuiz: 'Submit quiz',
    quizPassed: 'Quiz passed',
    quizFailed: 'Quiz not passed yet',
    coachTitle: 'Training Coach',
    coachDescription:
      'Practice real scenarios from your store training — grounded in what you just learned.',
    remediationCta: 'Practice what you missed with Coach →',
    rolePlayModule: 'Role-play this module →',
    autoStartBubble: "Let's practice {module}",
    suggestionJustFinished: 'Role-play {module} (just finished)',
    suggestionRecentMiss: 'Practice what you missed in {module}',
    suggestionRolePlay: 'Practice a customer scenario',
    dashboardBanner:
      'You just finished {module} — want to role-play a tricky moment?',
  },
  es: {
    practiceStation: 'Estación de práctica',
    startPractice: 'Empezar práctica',
    nextStep: 'Siguiente paso',
    submitPractice: 'Enviar intento',
    retry: 'Intentar de nuevo',
    simScore: 'Puntuación de práctica',
    simPassed: 'Práctica aprobada',
    simFailed: 'Aún no aprueba',
    talkToCoachAboutRun: 'Habla con tu coach sobre este intento',
    safetyStop: 'Parada de seguridad',
    fixtureLabel: 'Simulación fixture (demo sin conexión)',
    stepOf: 'Paso',
    debriefTitle: 'Debrief del coach',
    continueLearning: 'Continuar',
    quizTitle: 'Cuestionario del módulo',
    submitQuiz: 'Enviar cuestionario',
    quizPassed: 'Cuestionario aprobado',
    quizFailed: 'Cuestionario aún no aprobado',
    coachTitle: 'Coach de entrenamiento',
    coachDescription:
      'Practica situaciones reales con el material de tu tienda — basado en lo que acabas de aprender.',
    remediationCta: 'Practica lo que fallaste con el Coach →',
    rolePlayModule: 'Practicar este módulo →',
    autoStartBubble: 'Practiquemos {module}',
    suggestionJustFinished: 'Practicar {module} (recién terminado)',
    suggestionRecentMiss: 'Practicar lo que fallaste en {module}',
    suggestionRolePlay: 'Practicar un escenario con clientes',
    dashboardBanner:
      'Terminaste {module} — ¿quieres practicar un momento difícil?',
  },
  'zh-Hans': {
    practiceStation: '实操练习台',
    startPractice: '开始练习',
    nextStep: '下一步',
    submitPractice: '提交练习',
    retry: '再试一次',
    simScore: '练习得分',
    simPassed: '练习通过',
    simFailed: '尚未通过',
    talkToCoachAboutRun: '和教练讨论这次练习',
    safetyStop: '安全停止',
    fixtureLabel: 'Fixture 模拟（离线演示）',
    stepOf: '步骤',
    debriefTitle: '教练复盘',
    continueLearning: '继续学习',
    quizTitle: '模块测验',
    submitQuiz: '提交测验',
    quizPassed: '测验通过',
    quizFailed: '测验尚未通过',
    coachTitle: '培训教练',
    coachDescription:
      '用门店真实培训内容练习场景——紧扣你刚学过的内容。',
    remediationCta: '和教练练习错题 →',
    rolePlayModule: '角色扮演本模块 →',
    autoStartBubble: '我们来练习{module}',
    suggestionJustFinished: '角色扮演 {module}（刚完成）',
    suggestionRecentMiss: '练习 {module} 中的错题',
    suggestionRolePlay: '练习顾客场景',
    dashboardBanner: '你刚完成 {module}——要练习一个棘手情况吗？',
  },
} as const;

export type CoachUiKey =
  | 'coachTitle'
  | 'coachDescription'
  | 'remediationCta'
  | 'rolePlayModule'
  | 'autoStartBubble'
  | 'suggestionJustFinished'
  | 'suggestionRecentMiss'
  | 'suggestionRolePlay'
  | 'dashboardBanner';

export type EmployeeUiKey = keyof (typeof employeeUiStrings)['en'];

export function getEmployeeUi(language: string | undefined) {
  const lang = (language ?? 'en') as Language;
  if (lang in employeeUiStrings) {
    return employeeUiStrings[lang as keyof typeof employeeUiStrings];
  }
  return employeeUiStrings.en;
}

export function pickSimText(
  base: string,
  variants: Partial<Record<Language, string>> | undefined,
  language: string | undefined,
): string {
  const lang = (language ?? 'en') as Language;
  return variants?.[lang] ?? base;
}

export function t(
  key: CoachUiKey,
  language: string | undefined,
  vars?: Record<string, string>,
): string {
  const ui = getEmployeeUi(language);
  let text: string = ui[key] ?? employeeUiStrings.en[key];
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replaceAll(`{${k}}`, v);
    }
  }
  return text;
}

export function moduleTitleForLocale(
  mod: { title: string; languageVariants?: Record<string, string> },
  language: string | undefined,
): string {
  const lang = (language ?? 'en') as Language;
  if (lang === 'zh-Hans' && mod.languageVariants?.['zh-Hans']) {
    const firstLine = mod.languageVariants['zh-Hans']
      .split('\n')
      .find((l) => l.startsWith('#'));
    if (firstLine) return firstLine.replace(/^#+\s*/, '').trim();
  }
  return mod.title;
}
