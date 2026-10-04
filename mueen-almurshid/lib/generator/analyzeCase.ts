import { normalizeArabic } from './text';

/**
 * التحليل الداخلي لوصف الحالة.
 *
 * هذا التحليل لا يُعرض على المرشد إطلاقًا، ووظيفته الوحيدة توجيه اختيار
 * الأسئلة وتوزيعها. في الوضع التجريبي يعتمد على كلمات مفتاحية، وعند ربط
 * الذكاء الاصطناعي يحلل النموذج الحالة بنفسه (انظر prompts.ts) ويبقى هذا
 * الملف مسؤولًا عن توزيع الأسئلة وعن البديل الاحتياطي.
 */

export type Theme =
  | 'family'
  | 'major'
  | 'indecision'
  | 'jobSearch'
  | 'careerChange'
  | 'lowInfo'
  | 'motivation'
  | 'fear'
  | 'performance'
  | 'execution'
  | 'skills'
  | 'finance';

export type Phase = 'exploring' | 'deciding' | 'implementing' | 'unclear';

export interface CaseAnalysis {
  /** الموضوعات التي ذُكرت صراحة في الوصف. */
  themes: Theme[];
  /** المرحلة التي يبدو أن المسترشد يمر بها. */
  phase: Phase;
  /** هل ورد في الوصف هدف محدد؟ */
  goalIsClear: boolean;
  /** حيرة أو تعدد خيارات. */
  hasIndecision: boolean;
  /** عائق في التنفيذ. */
  hasExecutionBarrier: boolean;
  /** الحاجة الأبرز: فهم الذات أو الخيارات أو اتخاذ القرار. */
  needs: { self: boolean; options: boolean; decision: boolean };
  /** خياران ذُكرا نصًا بصيغة «بين كذا وكذا». */
  optionPair: [string, string] | null;
}

// الكلمات مكتوبة بعد التطبيع (ة ← ه، أ/إ ← ا، ى ← ي).
const THEME_KEYWORDS: Record<Theme, string[]> = {
  family: ['اسره', 'اسرت', 'اهله', 'اهلي', 'الاهل', 'والد', 'ابوه', 'ابيه', 'امه', 'عائل'],
  major: ['تخصص', 'التحويل', 'يحول', 'كليه', 'مسار دراسي', 'مساره الدراسي'],
  indecision: ['محتار', 'حائر', 'متردد', 'تردد', 'حيره', 'مشتت', 'تشتت', 'يفاضل', 'تائه', 'لا يعرف ماذا', 'لا تعرف ماذا'],
  jobSearch: ['يبحث عن عمل', 'تبحث عن عمل', 'عن وظيفه', 'باحث عن عمل', 'عاطل', 'لم يجد وظيفه', 'لم يجد عمل', 'مقابله', 'مقابلات', 'سيره ذاتيه', 'السيره الذاتيه', 'توظيف'],
  careerChange: ['تغيير مسار', 'تغيير مجال', 'استقال', 'ترك العمل', 'ترك عمل', 'ترك وظيف', 'وظيفه اخري', 'غير راض', 'عرض وظيفي', 'عمله الحالي', 'وظيفته الحاليه', 'عملها الحالي'],
  lowInfo: ['لا يعرف البدائل', 'لا تعرف البدائل', 'لا يعرف الخيارات', 'لا يعرف المجالات', 'ليس لديه معلومات', 'ليس لديها معلومات', 'سوق العمل'],
  motivation: ['شغف', 'ملل', 'غير متحمس', 'الحماس', 'احباط', 'محبط', 'دافعيه', 'فتور', 'غير مهتم'],
  fear: ['خوف', 'يخاف', 'تخاف', 'يخشي', 'تخشي', 'قلق', 'خائف', 'الفشل', 'ثقته', 'ثقتها', 'الثقه', 'متخوف'],
  performance: ['معدل', 'درجات', 'تعثر', 'رسوب', 'راسب', 'انذار اكاديمي', 'مستواه الدراسي', 'مستواها الدراسي'],
  execution: ['يؤجل', 'تؤجل', 'تاجيل', 'تسويف', 'يسوف', 'لم يبدا', 'لم تبدا', 'لا يلتزم', 'لا تلتزم', 'لا يستمر', 'ينقطع', 'لم ينفذ', 'لا ينفذ', 'لا يجد وقت'],
  skills: ['مهار', 'خبره', 'خبرات', 'تدريب', 'دوره', 'دورات'],
  finance: ['راتب', 'الدخل', 'مادي', 'مالي', 'تكاليف', 'رسوم'],
};

const GOAL_KEYWORDS = ['يريد ان', 'تريد ان', 'هدفه', 'هدفها', 'يطمح', 'تطمح', 'قرر ان', 'قررت ان', 'يرغب في', 'ترغب في', 'يسعي الي', 'تسعي الي'];

const SELF_KEYWORDS = ['لا يعرف نفسه', 'لا يعرف ميوله', 'لا تعرف ميولها', 'ما يناسبه', 'ما يناسبها', 'ميول', 'اهتمامات', 'نقاط قوت', 'قدراته', 'قدراتها'];

function includesAny(text: string, keywords: string[]): boolean {
  return keywords.some((keyword) => text.includes(keyword));
}

/** يلتقط خيارين معرّفين بـ«ال» بعد كلمة «بين»، مثل: بين الطب والهندسة. */
function extractOptionPair(rawText: string): [string, string] | null {
  const match = rawText.match(/بين\s+(ال[\u0621-\u064A]{2,})\s+و(ال[\u0621-\u064A]{2,})/);
  if (!match) return null;
  const [, first, second] = match;
  const generic = ['الخيارين', 'الخيارات', 'الأمرين', 'الامرين', 'الاثنين'];
  if (first === second || generic.includes(first) || generic.includes(second)) return null;
  return [first, second];
}

export function analyzeCase(caseText: string): CaseAnalysis {
  const text = normalizeArabic(caseText);

  const themes = (Object.keys(THEME_KEYWORDS) as Theme[]).filter((theme) =>
    includesAny(text, THEME_KEYWORDS[theme]),
  );

  const optionPair = extractOptionPair(caseText);
  const hasIndecision = themes.includes('indecision') || optionPair !== null;
  const hasExecutionBarrier = themes.includes('execution');
  const goalIsClear = includesAny(text, GOAL_KEYWORDS) && !hasIndecision;

  const needs = {
    self: includesAny(text, SELF_KEYWORDS) || themes.includes('motivation'),
    options: themes.includes('lowInfo') || themes.includes('jobSearch'),
    decision: hasIndecision,
  };

  // من لا يعرف البدائل يحتاج إلى استكشافها قبل المفاضلة بينها.
  const lacksOptions = themes.includes('lowInfo') && optionPair === null;

  let phase: Phase = 'unclear';
  if (hasExecutionBarrier || (goalIsClear && !needs.options)) phase = 'implementing';
  else if (lacksOptions) phase = 'exploring';
  else if (needs.decision) phase = 'deciding';
  else if (needs.options || needs.self) phase = 'exploring';

  return { themes, phase, goalIsClear, hasIndecision, hasExecutionBarrier, needs, optionPair };
}
