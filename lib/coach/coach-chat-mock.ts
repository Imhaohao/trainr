import type { ChatCitation, TrainingModule } from '@/types';
import type { Language } from '@/types/training';
import { PRACTICE_PENDING_MARKERS } from './constants';

type ScenarioFocus = 'default' | 'missed';

type ScenarioCopy = {
  policy: string;
  example: string;
  practice: string;
};

const GUEST_CARE_RICH: Record<CoachLanguage, ScenarioCopy> = {
  en: {
    policy:
      'Apologize first, listen without arguing, then offer a remake at the sugar level they want (0/25/50/75/100%). Confirm sugar and ice on the remake.',
    example:
      '"I\'m sorry about that — let me remake it at 50% sugar with regular ice so it matches what you wanted."',
    practice:
      'A customer says their Pearl Milk Tea is way too sweet and they look frustrated. What would you say and do?',
  },
  es: {
    policy:
      'Pide disculpas primero, escucha sin discutir y ofrece preparar de nuevo con el nivel de azúcar que quiera (0/25/50/75/100%). Confirma azúcar y hielo en la nueva bebida.',
    example:
      '"Disculpe — le preparo otra con 50% de azúcar y hielo regular para que quede como la quiere."',
    practice:
      'Un cliente dice que su Pearl Milk Tea está demasiado dulce y se ve molesto. ¿Qué le dirías y harías?',
  },
  'zh-Hans': {
    policy:
      '先道歉，认真倾听，不要争辩；按客人要求重做，并确认糖度（0/25/50/75/100%）和冰块。重做时再次确认糖度和冰量。',
    example: '「不好意思，我帮您按50%糖、正常冰重做一杯。」',
    practice:
      '一位客人说珍珠奶茶太甜，看起来很不高兴。你会怎么说、怎么做？',
  },
};

type CoachLanguage = 'en' | 'es' | 'zh-Hans';

function normalizeLang(language?: string): CoachLanguage {
  if (language === 'es' || language === 'zh-Hans') return language;
  return 'en';
}

function firstFreeResponseRubric(mod: TrainingModule): string | undefined {
  return mod.quiz?.questions.find((q) => q.type === 'free_response')?.rubric;
}

function genericScenario(
  mod: TrainingModule,
  language: CoachLanguage,
  focus: ScenarioFocus,
  missedConcept?: string,
): ScenarioCopy {
  const rubric = firstFreeResponseRubric(mod);
  const focusHint =
    focus === 'missed' && missedConcept
      ? language === 'es'
        ? `Enfócate en lo que falló en el quiz: **${missedConcept}**.`
        : language === 'zh-Hans'
          ? `重点练习测验中没答好的部分：**${missedConcept}**。`
          : `Focus on what you missed on the quiz: **${missedConcept}**.`
      : language === 'es'
        ? `Tema: ${mod.title}`
        : language === 'zh-Hans'
          ? `主题：${mod.title}`
          : `Module: ${mod.title}`;

  if (language === 'es') {
    return {
      policy: `Sigue la política de **${mod.title}**. ${focusHint}`,
      example: rubric
        ? `Una respuesta sólida: ${rubric.slice(0, 160)}`
        : 'Muestra empatía y ofrece una solución concreta.',
      practice: `Imagina una situación real de **${mod.title}**. ¿Qué harías?`,
    };
  }
  if (language === 'zh-Hans') {
    return {
      policy: `按 **${mod.title}** 政策执行。${focusHint}`,
      example: rubric
        ? `优秀回答应包含：${rubric.slice(0, 160)}`
        : '先表示理解，再给出具体解决方案。',
      practice: `想象一个 **${mod.title}** 的真实场景。你会怎么做？`,
    };
  }
  return {
    policy: `Follow **${mod.title}** policy. ${focusHint}`,
    example: rubric
      ? `A strong answer includes: ${rubric.slice(0, 160)}`
      : 'Show empathy and offer a concrete fix.',
    practice: `Picture a real **${mod.title}** moment. What would you say and do?`,
  };
}

export function buildModuleScenario(
  mod: TrainingModule,
  language: string,
  opts?: { focus?: ScenarioFocus; missedConcept?: string },
): { text: string; citations: ChatCitation[] } {
  const lang = normalizeLang(language);
  const focus = opts?.focus ?? 'default';
  const copy =
    mod.id === 'mod_guest_care' && focus !== 'missed'
      ? GUEST_CARE_RICH[lang]
      : genericScenario(mod, lang, focus, opts?.missedConcept);

  const header =
    lang === 'es'
      ? `## Práctica: ${mod.title}`
      : lang === 'zh-Hans'
        ? `## 练习：${mod.title}`
        : `## Practice: ${mod.title}`;

  const labels =
    lang === 'es'
      ? { policy: 'Política', example: 'Ejemplo', practice: 'Tu turno' }
      : lang === 'zh-Hans'
        ? { policy: '政策', example: '示例', practice: '轮到你了' }
        : { policy: 'Policy', example: 'Example', practice: 'Your turn' };

  const text = [
    header,
    '',
    `**${labels.policy}:** ${copy.policy}`,
    '',
    `**${labels.example}:** ${copy.example}`,
    '',
    `**${labels.practice}:** ${copy.practice}`,
  ].join('\n');

  return {
    text,
    citations: [{ moduleId: mod.id, title: mod.title, snippet: copy.policy.slice(0, 80) }],
  };
}

export function isPendingPracticeScenario(assistantContent: string): boolean {
  const lower = assistantContent.toLowerCase();
  return PRACTICE_PENDING_MARKERS.some((m) => lower.includes(m.toLowerCase()));
}

export function gradeFreeResponseMock(
  answer: string,
  rubric: string,
  language: string,
): { verdict: string; text: string; citations: ChatCitation[] } {
  const lang = normalizeLang(language);
  const lower = answer.toLowerCase();
  const hasEmpathy =
    /sorry|apolog|disculp|perdon|抱歉|对不起|listen|escuch|听/.test(lower);
  const hasRemake =
    /remake|rebuild|redo|nueva|重做|重制|sugar|azúcar|糖|50%|25%/.test(lower);
  const inventedRefund = /full refund|free drink|fire|sue|lawyer/.test(lower);

  let verdict: 'Pass' | 'Needs improvement' | 'Ask a manager';
  if (inventedRefund) verdict = 'Ask a manager';
  else if (hasEmpathy && hasRemake) verdict = 'Pass';
  else if (hasEmpathy) verdict = 'Needs improvement';
  else verdict = 'Needs improvement';

  const labels =
    lang === 'es'
      ? {
          Pass: 'Aprobado',
          'Needs improvement': 'Necesita mejorar',
          'Ask a manager': 'Consulta al gerente',
        }
      : lang === 'zh-Hans'
        ? {
            Pass: '通过',
            'Needs improvement': '需要改进',
            'Ask a manager': '请咨询经理',
          }
        : {
            Pass: 'Pass',
            'Needs improvement': 'Needs improvement',
            'Ask a manager': 'Ask a manager',
          };

  const why =
    verdict === 'Pass'
      ? lang === 'es'
        ? 'Mostraste empatía y un plan concreto alineado con la política.'
        : lang === 'zh-Hans'
          ? '你表达了同理心，并给出了符合政策的具体做法。'
          : 'You showed empathy and a concrete plan aligned with policy.'
      : verdict === 'Ask a manager'
        ? lang === 'es'
          ? 'Esa solución no está en nuestra política — un gerente debe decidir.'
          : lang === 'zh-Hans'
            ? '这个做法不在我们的政策里——需要经理决定。'
            : "That solution isn't in our policy — a manager should decide."
        : lang === 'es'
          ? 'Buen inicio; falta confirmar azúcar/hielo o ofrecer un arreglo claro.'
          : lang === 'zh-Hans'
            ? '方向不错；还需要确认糖度/冰块或给出明确的解决方案。'
            : 'Good start; confirm sugar/ice or offer a clear fix on the remake.';

  return { verdict: labels[verdict], text: `**${labels[verdict]}**\n\n${why}`, citations: [] };
}

export function gradeQuizAnswerMock(
  question: { type: string; rubric?: string },
  answer: string,
): { correct: boolean; feedback: string } {
  if (question.type !== 'free_response' || !question.rubric) {
    return { correct: false, feedback: 'Unable to grade this question.' };
  }
  const lower = answer.toLowerCase();
  const rubric = question.rubric.toLowerCase();
  const needsFriendly =
    rubric.includes('friendly') ||
    rubric.includes('warm') ||
    rubric.includes('smile');
  const needsFast =
    rubric.includes('fast') || rubric.includes('efficient');
  const hasFriendly =
    /friendly|smile|warm|kind|patient|amigable|sonreír|友好|热情/.test(lower);
  const hasFast =
    /fast|quick|efficient|rush|busy|rápid|eficient|快|忙/.test(lower);

  if (needsFriendly && needsFast) {
    if (hasFriendly && hasFast) {
      return {
        correct: true,
        feedback:
          'Nice — you mentioned staying friendly and efficient under pressure.',
      };
    }
    const missing: string[] = [];
    if (!hasFriendly) missing.push('staying warm/friendly with customers');
    if (!hasFast) missing.push('working efficiently on a busy shift');
    return {
      correct: false,
      feedback: `Almost — also mention ${missing.join(' and ')}.`,
    };
  }

  const hasApology =
    /sorry|apolog|disculp|perdon|抱歉|对不起/.test(lower);
  const hasRemake =
    /remake|rebuild|redo|sugar|azúcar|糖|50%|25%|listen|escuch|听/.test(lower);
  if (rubric.includes('apolog') || rubric.includes('remake')) {
    if (hasApology && hasRemake) {
      return {
        correct: true,
        feedback:
          'Strong answer — you apologized, listened, and offered a clear fix.',
      };
    }
    return {
      correct: false,
      feedback:
        'Include an apology, listening, and offering a remake at the right sugar level.',
    };
  }

  if (answer.trim().length < 12) {
    return {
      correct: false,
      feedback: 'Add more detail tied to what we covered in the module.',
    };
  }
  return {
    correct: true,
    feedback: 'Good answer — you connected your approach to store standards.',
  };
}

export type MockCoachArgs = {
  message: string;
  language: string;
  module?: TrainingModule;
  modules: TrainingModule[];
  intent?: string;
  focus?: string;
  priorAssistant?: string;
  missedConcept?: string;
};

export function generateMockCoachReply(args: MockCoachArgs): {
  text: string;
  citations: ChatCitation[];
} {
  const lang = normalizeLang(args.language);
  const mod =
    args.module ??
    args.modules.find((m) => m.id === 'mod_guest_care') ??
    args.modules[0];

  if (!mod) {
    return {
      text:
        lang === 'es'
          ? 'No encuentro módulos — pregunta a tu gerente.'
          : lang === 'zh-Hans'
            ? '找不到培训模块——请咨询经理。'
            : "I can't find training modules — please ask your manager.",
      citations: [],
    };
  }

  if (args.intent === 'practice-start' || args.focus === 'missed') {
    return buildModuleScenario(mod, lang, {
      focus: args.focus === 'missed' ? 'missed' : 'default',
      missedConcept: args.missedConcept,
    });
  }

  if (args.priorAssistant && isPendingPracticeScenario(args.priorAssistant)) {
    const rubric =
      firstFreeResponseRubric(mod) ??
      'Apologize, listen, offer a remake with confirmed sugar and ice.';
    const graded = gradeFreeResponseMock(args.message, rubric, lang);
    return {
      text: graded.text,
      citations: [{ moduleId: mod.id, title: mod.title }],
    };
  }

  const lower = args.message.toLowerCase();
  if (
    /\b(complain|complaint|sweet|unhappy|upset|客|投诉|甜|抱怨)\b/i.test(lower)
  ) {
    const guest = args.modules.find((m) => m.id === 'mod_guest_care') ?? mod;
    const scenario = buildModuleScenario(guest, lang);
    const extra =
      lang === 'es'
        ? '\n\n¿Quieres practicar? Describe qué le dirías al cliente.'
        : lang === 'zh-Hans'
          ? '\n\n想练习吗？说说你会对客人怎么说。'
          : "\n\nWant to practice? Describe what you'd say to the customer.";
    return { text: scenario.text + extra, citations: scenario.citations };
  }

  if (/policy|vacation|google|pet leave|holiday pay/i.test(lower)) {
    return {
      text:
        lang === 'es'
          ? 'No veo esa política en tu entrenamiento — consulta a tu gerente.'
          : lang === 'zh-Hans'
            ? '培训材料里没有这项政策——请咨询经理。'
            : "I don't see that policy in your training — please ask your manager.",
      citations: [],
    };
  }

  return {
    text:
      lang === 'es'
        ? `Según **${mod.title}**: repasa el módulo y pregunta si algo no quedó claro.`
        : lang === 'zh-Hans'
          ? `根据 **${mod.title}**：复习模块内容，有不清楚的随时问。`
          : `From **${mod.title}**: review the module and ask if anything is unclear.`,
    citations: [{ moduleId: mod.id, title: mod.title }],
  };
}
