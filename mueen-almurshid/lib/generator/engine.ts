import { TOTAL_QUESTIONS } from '../modes';
import type { QuestionService } from '../types';
import { analyzeCase } from './analyzeCase';
import { fillToPlan, mockFollowUp, mockGenerate, mockReplace, sortByDialogueOrder } from './mockProvider';
import { extractJson, parseQuestionList, parseSingle } from './parse';
import { buildPlan } from './plan';
import { followUpUserPrompt, generateUserPrompt, replaceUserPrompt, SYSTEM_PROMPT } from './prompts';

/**
 * نقطة الاتصال الوحيدة بأي نموذج ذكاء اصطناعي: دالة تستقبل التعليمات وتعيد
 * نص الرد. لتغيير مزوّد النموذج يكفي كتابة دالة أخرى بنفس التوقيع.
 */
export type AiClient = (request: {
  system: string;
  user: string;
  /** `quick` للطلبات القصيرة (استبدال، متابعة). */
  tier: 'default' | 'quick';
}) => Promise<string>;

/** يُرمى حين لا يكون النموذج متاحًا أصلًا (فيُستخدم البنك التجريبي بلا تنبيه). */
export class AiUnavailableError extends Error {}

const FALLBACK_NOTICE = 'تعذّر الاتصال بالذكاء الاصطناعي، فعُرضت أسئلة من البنك التجريبي.';

/** أقل عدد مقبول من النموذج قبل اعتبار الرد ناقصًا. */
const MIN_AI_QUESTIONS = 10;

function noticeFor(error: unknown): string | undefined {
  return error instanceof AiUnavailableError ? undefined : FALLBACK_NOTICE;
}

/**
 * يبني خدمة الأسئلة. إذا مُرّر عميل ذكاء اصطناعي استُخدم أولًا، وإن فشل أو
 * لم يُمرَّر عادت الخدمة إلى البنك التجريبي.
 */
export function createQuestionEngine(ai: AiClient | null): QuestionService {
  return {
    async generate(input) {
      const analysis = analyzeCase(input.caseText);
      const plan = buildPlan(input.mode, analysis);
      let notice: string | undefined;

      if (ai) {
        try {
          const raw = await ai({ system: SYSTEM_PROMPT, user: generateUserPrompt(input, plan), tier: 'default' });
          const drafts = parseQuestionList(extractJson(raw)).slice(0, TOTAL_QUESTIONS);
          if (drafts.length < MIN_AI_QUESTIONS) throw new Error('رد النموذج ناقص.');
          const questions =
            drafts.length === TOTAL_QUESTIONS
              ? sortByDialogueOrder(drafts)
              : fillToPlan(drafts, plan, analysis, input.avoid);
          return { questions, source: 'ai' };
        } catch (error) {
          notice = noticeFor(error);
        }
      }

      return { questions: mockGenerate(input, analysis, plan), source: 'mock', notice };
    },

    async replace(input) {
      let notice: string | undefined;
      if (ai) {
        try {
          const raw = await ai({ system: SYSTEM_PROMPT, user: replaceUserPrompt(input), tier: 'quick' });
          const text = parseSingle(extractJson(raw), [...input.existing, input.current]);
          return { text, source: 'ai' };
        } catch (error) {
          notice = noticeFor(error);
        }
      }
      return { text: mockReplace(input), source: 'mock', notice };
    },

    async followUp(input) {
      let notice: string | undefined;
      if (ai) {
        try {
          const raw = await ai({ system: SYSTEM_PROMPT, user: followUpUserPrompt(input), tier: 'quick' });
          const text = parseSingle(extractJson(raw), [...input.existing, input.question]);
          return { text, source: 'ai' };
        } catch (error) {
          notice = noticeFor(error);
        }
      }
      return { text: mockFollowUp(input), source: 'mock', notice };
    },
  };
}
