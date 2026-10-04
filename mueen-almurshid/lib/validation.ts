import { CASE_MAX_LENGTH, CASE_MIN_LENGTH, isMode, isPurpose } from './modes';
import { UserError } from './errors';
import type { FollowUpInput, GenerateInput, ReplaceInput } from './types';

export function validateCaseText(value: unknown): string {
  if (typeof value !== 'string') throw new UserError('اكتب حالة المسترشد أولًا.');
  const text = value.trim();
  if (text.length < CASE_MIN_LENGTH) {
    throw new UserError('الوصف قصير. اكتب جملة أو جملتين عن الحالة حتى ترتبط الأسئلة بها.');
  }
  if (text.length > CASE_MAX_LENGTH) {
    throw new UserError(`الوصف طويل. اختصره إلى ${CASE_MAX_LENGTH} حرف أو أقل.`);
  }
  return text;
}

function stringList(value: unknown, maxItems = 60, maxLength = 400): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim().slice(0, maxLength))
    .filter(Boolean)
    .slice(-maxItems);
}

function questionText(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) throw new UserError('نص السؤال مفقود.');
  return value.trim().slice(0, 400);
}

type Body = Record<string, unknown>;

export function parseGenerateInput(body: Body): GenerateInput {
  if (!isMode(body.mode)) throw new UserError('نمط الأسئلة غير معروف.');
  return { caseText: validateCaseText(body.caseText), mode: body.mode, avoid: stringList(body.avoid) };
}

export function parseReplaceInput(body: Body): ReplaceInput {
  if (!isMode(body.mode)) throw new UserError('نمط الأسئلة غير معروف.');
  if (!isPurpose(body.purpose)) throw new UserError('غرض السؤال غير معروف.');
  return {
    caseText: validateCaseText(body.caseText),
    mode: body.mode,
    purpose: body.purpose,
    current: questionText(body.current),
    existing: stringList(body.existing),
  };
}

export function parseFollowUpInput(body: Body): FollowUpInput {
  if (!isPurpose(body.purpose)) throw new UserError('غرض السؤال غير معروف.');
  return {
    caseText: validateCaseText(body.caseText),
    purpose: body.purpose,
    question: questionText(body.question),
    existing: stringList(body.existing),
  };
}
