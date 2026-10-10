import { UserError } from '../errors';
import { PURPOSES, PURPOSE_ORDER, TOTAL_QUESTIONS } from '../modes';
import type { FollowUpInput, GenerateInput, Purpose, QuestionDraft, ReplaceInput } from '../types';
import { analyzeCase, type CaseAnalysis } from './analyzeCase';
import type { Plan } from './plan';
import { FOLLOW_UP_BANK, QUESTION_BANK, type BankItem } from './questionBank';
import { dedupeKey, shuffle } from './text';

/**
 * المنطق التجريبي (Mock Logic): يختار من بنك الأسئلة بحسب تحليل الحالة.
 * يُستخدم حين لا يوجد مفتاح API، وكبديل احتياطي إذا تعذّر الاتصال بالنموذج.
 */

interface Candidate {
  text: string;
  specific: boolean;
}

function isEligible(item: BankItem, analysis: CaseAnalysis): boolean {
  if (item.needsPair) return analysis.optionPair !== null;
  if (item.themes) return item.themes.some((theme) => analysis.themes.includes(theme));
  return true;
}

function render(item: BankItem, analysis: CaseAnalysis): string {
  if (!item.needsPair || !analysis.optionPair) return item.text;
  const [first, second] = analysis.optionPair;
  return item.text.replaceAll('{A}', first).replaceAll('{B}', second);
}

function candidatesFor(purpose: Purpose, analysis: CaseAnalysis): Candidate[] {
  return QUESTION_BANK.filter((item) => item.purpose === purpose && isEligible(item, analysis)).map(
    (item) => ({ text: render(item, analysis), specific: Boolean(item.themes || item.needsPair) }),
  );
}

/**
 * يختار `count` أسئلة لغرض واحد: نصفها تقريبًا مرتبط بما ورد في الوصف
 * (إن وُجد)، والباقي عام. الأسئلة في `used` لا تُختار أبدًا، والأسئلة في
 * `avoid` لا تُختار إلا إذا نفد غيرها.
 */
function pickForPurpose(
  purpose: Purpose,
  count: number,
  analysis: CaseAnalysis,
  used: Set<string>,
  avoid: Set<string>,
): string[] {
  if (count <= 0) return [];
  const pool = candidatesFor(purpose, analysis).filter((c) => !used.has(dedupeKey(c.text)));
  const fresh = pool.filter((c) => !avoid.has(dedupeKey(c.text)));
  const stale = pool.filter((c) => avoid.has(dedupeKey(c.text)));

  const generalFresh = shuffle(fresh.filter((c) => !c.specific));
  const specificFresh = shuffle(fresh.filter((c) => c.specific));
  const specificQuota = Math.min(specificFresh.length, Math.ceil(count / 2));
  const generalQuota = count - specificQuota;

  const chosen = [...generalFresh.slice(0, generalQuota), ...specificFresh.slice(0, specificQuota)];
  const reserve = [
    ...generalFresh.slice(generalQuota),
    ...specificFresh.slice(specificQuota),
    ...shuffle(stale),
  ];
  while (chosen.length < count && reserve.length > 0) chosen.push(reserve.shift()!);

  const texts = chosen.map((c) => c.text);
  texts.forEach((text) => used.add(dedupeKey(text)));
  return texts;
}

/** يكمل القائمة إلى 15 سؤالًا وفق الخطة، دون تكرار ما هو موجود. */
export function fillToPlan(
  drafts: QuestionDraft[],
  plan: Plan,
  analysis: CaseAnalysis,
  avoid: string[] = [],
): QuestionDraft[] {
  const used = new Set(drafts.map((d) => dedupeKey(d.text)));
  const avoidKeys = new Set(avoid.map(dedupeKey));
  const result = [...drafts];

  for (const purpose of PURPOSE_ORDER) {
    const have = result.filter((d) => d.purpose === purpose).length;
    const missing = plan[purpose] - have;
    for (const text of pickForPurpose(purpose, missing, analysis, used, avoidKeys)) {
      result.push({ text, purpose });
    }
  }

  // احتياط: إن نقص العدد لأي سبب، أكمل من أي غرض متاح.
  for (const purpose of PURPOSE_ORDER) {
    if (result.length >= TOTAL_QUESTIONS) break;
    const missing = TOTAL_QUESTIONS - result.length;
    for (const text of pickForPurpose(purpose, missing, analysis, used, avoidKeys)) {
      result.push({ text, purpose });
    }
  }

  return sortByDialogueOrder(result).slice(0, TOTAL_QUESTIONS);
}

/** ترتيب ثابت يحافظ على تسلسل الحوار: الفهم ثم الاستكشاف ثم التقدم. */
export function sortByDialogueOrder(drafts: QuestionDraft[]): QuestionDraft[] {
  return drafts
    .map((draft, index) => ({ draft, index }))
    .sort(
      (a, b) =>
        PURPOSE_ORDER.indexOf(a.draft.purpose) - PURPOSE_ORDER.indexOf(b.draft.purpose) ||
        a.index - b.index,
    )
    .map(({ draft }) => draft);
}

export function mockGenerate(input: GenerateInput, analysis: CaseAnalysis, plan: Plan): QuestionDraft[] {
  return fillToPlan([], plan, analysis, input.avoid);
}

export function mockReplace(input: ReplaceInput): string {
  const analysis = analyzeCase(input.caseText);
  const used = new Set([...input.existing, input.current].map(dedupeKey));
  const none = new Set<string>();

  const sameStage = PURPOSE_ORDER.filter(
    (p) => p !== input.purpose && PURPOSES[p].stage === PURPOSES[input.purpose].stage,
  );
  for (const purpose of [input.purpose, ...sameStage]) {
    const [text] = pickForPurpose(purpose, 1, analysis, used, none);
    if (text) return text;
  }
  throw new UserError('لا توجد أسئلة بديلة أخرى لهذا الغرض في بنك الأسئلة.');
}

export function mockFollowUp(input: FollowUpInput): string {
  const used = new Set([...input.existing, input.question].map(dedupeKey));
  const [text] = shuffle(FOLLOW_UP_BANK[input.purpose]).filter((t) => !used.has(dedupeKey(t)));
  if (text) return text;
  throw new UserError('لا توجد أسئلة متابعة أخرى في بنك الأسئلة.');
}
