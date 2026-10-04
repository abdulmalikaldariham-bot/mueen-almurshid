import type {
  FollowUpInput,
  GenerateInput,
  GenerateResult,
  QuestionService,
  ReplaceInput,
  SingleResult,
} from '../types';

/**
 * خدمة الأسئلة من جهة المتصفح: ترسل الطلب إلى /api/questions.
 * الواجهة لا تعرف هل الرد من نموذج ذكاء اصطناعي أم من البنك التجريبي.
 */

const GENERIC_ERROR = 'تعذّر إتمام الطلب. تحقق من الاتصال ثم حاول مرة أخرى.';

async function post<T>(payload: object): Promise<T> {
  let response: Response;
  try {
    response = await fetch('/api/questions', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error(GENERIC_ERROR);
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error ?? GENERIC_ERROR);
  return data as T;
}

export const apiQuestionService: QuestionService = {
  generate: (input: GenerateInput) => post<GenerateResult>({ action: 'generate', ...input }),
  replace: (input: ReplaceInput) => post<SingleResult>({ action: 'replace', ...input }),
  followUp: (input: FollowUpInput) => post<SingleResult>({ action: 'followUp', ...input }),
};
