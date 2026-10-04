import { isPurpose } from '../modes';
import type { QuestionDraft } from '../types';
import { cleanQuestionText, dedupeKey } from './text';

/** يستخرج JSON من رد النموذج حتى لو أحاط به نص أو علامات Markdown. */
export function extractJson(raw: string): unknown {
  const text = raw.replace(/```(?:json)?/gi, '').trim();
  try {
    return JSON.parse(text);
  } catch {
    const start = text.search(/[{[]/);
    const end = Math.max(text.lastIndexOf('}'), text.lastIndexOf(']'));
    if (start === -1 || end <= start) throw new Error('رد النموذج لا يحتوي على JSON صالح.');
    return JSON.parse(text.slice(start, end + 1));
  }
}

const MAX_QUESTION_LENGTH = 300;

function validText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const text = cleanQuestionText(value);
  return text.length >= 5 && text.length <= MAX_QUESTION_LENGTH ? text : null;
}

/** يتحقق من قائمة الأسئلة ويحذف غير الصالح والمكرر. */
export function parseQuestionList(data: unknown, exclude: string[] = []): QuestionDraft[] {
  const list = Array.isArray(data) ? data : (data as { questions?: unknown } | null)?.questions;
  if (!Array.isArray(list)) throw new Error('صيغة الرد غير متوقعة.');

  const seen = new Set(exclude.map(dedupeKey));
  const drafts: QuestionDraft[] = [];
  for (const entry of list) {
    const item = entry as { text?: unknown; purpose?: unknown } | null;
    const text = validText(item?.text);
    if (!text || !isPurpose(item?.purpose)) continue;
    const key = dedupeKey(text);
    if (seen.has(key)) continue;
    seen.add(key);
    drafts.push({ text, purpose: item.purpose });
  }
  return drafts;
}

export function parseSingle(data: unknown, exclude: string[] = []): string {
  const text = validText(typeof data === 'string' ? data : (data as { text?: unknown } | null)?.text);
  if (!text) throw new Error('صيغة الرد غير متوقعة.');
  if (exclude.map(dedupeKey).includes(dedupeKey(text))) throw new Error('السؤال المقترح مكرر.');
  return text;
}
