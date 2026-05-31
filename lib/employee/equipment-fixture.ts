// Fixture equipment sim — clearly labeled mock content for the boba station practice.
// BLOCKED(mcp): replace with MCP-sourced EquipmentSim when an equipment MCP exists.

import { IDS } from '@/lib/mocks/fixtures';
import type { EquipmentSim } from '@/types/training';

const FIXTURE_RETRIEVED_AT = '2026-05-31T17:00:00.000Z';

export const BOBA_STATION_SIM: EquipmentSim = {
  id: 'sim_boba_station',
  businessId: IDS.business,
  moduleId: 'mod_drink_build',
  name: 'Boba Station Practice',
  nameVariants: {
    es: 'Práctica de estación de boba',
    'zh-Hans': '波霸吧台实操练习',
  },
  description:
    'Walk through a standard drink build at the bar — follow the station card, stay food-safe, and seal every cup correctly. (Fixture sim — not live equipment data.)',
  descriptionVariants: {
    es: 'Recorre una preparación estándar en la barra: sigue la tarjeta de estación, mantén la seguridad alimentaria y sella cada vaso correctamente. (Simulación de fixture — no datos de equipo en vivo.)',
    'zh-Hans':
      '在吧台完成标准饮品制作流程——遵循工位卡、保持食品安全、正确封口。（Fixture 模拟器——非实时设备数据。）',
  },
  passScore: 80,
  source: {
    kind: 'fixture',
    ref: 'lib/employee/equipment-fixture.ts#sim_boba_station',
    retrievedAt: FIXTURE_RETRIEVED_AT,
  },
  steps: [
    {
      id: 'step_hands',
      prompt: 'A new order just came in. What do you do first at the bar?',
      promptVariants: {
        es: 'Acaba de llegar un pedido nuevo. ¿Qué haces primero en la barra?',
        'zh-Hans': '新订单来了。你在吧台首先要做什么？',
      },
      citationModuleId: 'mod_food_safety',
      actions: [
        { id: 'wash_gloves', label: 'Wash hands and put on gloves', icon: '🧼', labelVariants: { es: 'Lávate las manos y ponte guantes', 'zh-Hans': '洗手并戴手套' } },
        { id: 'skip_ppe', label: 'Start building — gloves are optional', icon: '⏭️', labelVariants: { es: 'Empieza a preparar — los guantes son opcionales', 'zh-Hans': '直接开始制作——手套可选' } },
        { id: 'check_phone', label: 'Check your phone for the ticket', icon: '📱', labelVariants: { es: 'Revisa tu teléfono', 'zh-Hans': '先看手机订单' } },
      ],
      correctActionId: 'wash_gloves',
      hazardActionIds: ['skip_ppe'],
      hint: 'Food safety comes before speed.',
      hintVariants: { es: 'La seguridad alimentaria va antes que la velocidad.', 'zh-Hans': '食品安全优先于速度。' },
    },
    {
      id: 'step_label',
      prompt: 'You have the cup ready. What should you verify before adding ingredients?',
      promptVariants: {
        es: 'Tienes el vaso listo. ¿Qué debes verificar antes de añadir ingredientes?',
        'zh-Hans': '杯子准备好了。加料前你应该确认什么？',
      },
      citationModuleId: 'mod_drink_build',
      actions: [
        { id: 'match_label', label: 'Confirm the cup label matches the order', icon: '🏷️', labelVariants: { es: 'Confirma que la etiqueta coincide con el pedido', 'zh-Hans': '确认杯贴与订单一致' } },
        { id: 'guess_order', label: 'Guess from memory — it is probably the same drink', icon: '🤷', labelVariants: { es: 'Adivina de memoria', 'zh-Hans': '凭记忆猜测' } },
        { id: 'start_ice', label: 'Add ice first, label later', icon: '🧊', labelVariants: { es: 'Pon hielo primero', 'zh-Hans': '先加冰，贴标稍后' } },
      ],
      correctActionId: 'match_label',
      hazardActionIds: ['guess_order'],
    },
    {
      id: 'step_tea',
      prompt: 'Time to add the tea base. How do you measure it?',
      promptVariants: {
        es: 'Es hora de añadir la base de té. ¿Cómo la mides?',
        'zh-Hans': '该加茶底了。你如何计量？',
      },
      citationModuleId: 'mod_drink_build',
      actions: [
        { id: 'station_card_tea', label: 'Scoop or pour to the station card tea line', icon: '🍵', labelVariants: { es: 'Vierte hasta la línea de té de la tarjeta', 'zh-Hans': '按工位卡茶位线舀/倒' } },
        { id: 'eyeball_tea', label: 'Eyeball it — close enough', icon: '👁️', labelVariants: { es: 'A ojo — más o menos', 'zh-Hans': '目测差不多就行' } },
        { id: 'extra_tea', label: 'Fill to the top for a stronger drink', icon: '⬆️', labelVariants: { es: 'Llena hasta arriba', 'zh-Hans': '加满更有茶味' } },
      ],
      correctActionId: 'station_card_tea',
      hazardActionIds: ['eyeball_tea'],
    },
    {
      id: 'step_syrup',
      prompt: 'Customer ordered standard sweetness. How do you dose the syrup?',
      promptVariants: {
        es: 'El cliente pidió dulzor estándar. ¿Cómo dosificas el jarabe?',
        'zh-Hans': '顾客要标准甜度。你如何加糖浆？',
      },
      citationModuleId: 'mod_drink_build',
      actions: [
        { id: 'marked_line', label: 'Dose syrup to the marked line on the station card', icon: '🫗', labelVariants: { es: 'Dosifica hasta la línea marcada en la tarjeta', 'zh-Hans': '按工位卡标记线加糖浆' } },
        { id: 'estimate_syrup', label: 'Estimate — a little extra is fine', icon: '🤏', labelVariants: { es: 'Estima — un poco extra está bien', 'zh-Hans': '估算——多一点点没关系' } },
        { id: 'skip_syrup', label: 'Skip syrup — they did not ask', icon: '⛔', labelVariants: { es: 'Omite el jarabe', 'zh-Hans': '不加糖浆' } },
      ],
      correctActionId: 'marked_line',
      hazardActionIds: ['estimate_syrup'],
    },
    {
      id: 'step_seal',
      prompt: 'Pearls are in, drink is built. What is the last mechanical step for a sealed drink?',
      promptVariants: {
        es: 'Las perlas están dentro y la bebida está lista. ¿Cuál es el último paso mecánico para una bebida sellada?',
        'zh-Hans': '珍珠已加、饮品已做好。封口饮品的最后机械步骤是什么？',
      },
      citationModuleId: 'mod_drink_build',
      actions: [
        { id: 'seal_cup', label: 'Run the cup through the sealing machine', icon: '🧋', labelVariants: { es: 'Pasa el vaso por la selladora', 'zh-Hans': '用封口机封杯' } },
        { id: 'hand_lid', label: 'Snap a flat lid on by hand', icon: '🔲', labelVariants: { es: 'Pon una tapa plana a mano', 'zh-Hans': '手工扣平盖' } },
        { id: 'serve_open', label: 'Serve open — no seal needed', icon: '🥤', labelVariants: { es: 'Sirve abierto', 'zh-Hans': '不封口直接出杯' } },
      ],
      correctActionId: 'seal_cup',
    },
    {
      id: 'step_qc',
      prompt: 'Before handing off the drink, something on the station card is unclear. What do you do?',
      promptVariants: {
        es: 'Antes de entregar la bebida, algo en la tarjeta de estación no está claro. ¿Qué haces?',
        'zh-Hans': '出杯前，工位卡上有不清楚的地方。你怎么办？',
      },
      citationModuleId: 'mod_drink_build',
      actions: [
        { id: 'ask_lead', label: 'Ask the shift lead before guessing', icon: '🙋', labelVariants: { es: 'Pregunta al encargado antes de adivinar', 'zh-Hans': '不确定就问值班组长' } },
        { id: 'guess_build', label: 'Guess and fix it if the customer complains', icon: '🎲', labelVariants: { es: 'Adivina y corrige si se quejan', 'zh-Hans': '先猜着做，投诉再改' } },
        { id: 'skip_qc', label: 'Skip the check — rush hour', icon: '⚡', labelVariants: { es: 'Omite la revisión — hora pico', 'zh-Hans': '忙起来就跳过检查' } },
      ],
      correctActionId: 'ask_lead',
      hazardActionIds: ['guess_build'],
    },
  ],
};

export const equipmentSimFixtures: EquipmentSim[] = [BOBA_STATION_SIM];
