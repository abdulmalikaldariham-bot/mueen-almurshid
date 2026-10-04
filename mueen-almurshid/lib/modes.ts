import type { ModeId, Purpose, Stage } from './types';

export const TOTAL_QUESTIONS = 15;
export const CASE_MIN_LENGTH = 20;
export const CASE_MAX_LENGTH = 1500;

export const STAGE_ORDER: Stage[] = ['understand', 'explore', 'forward'];

export const STAGES: Record<Stage, { label: string; description: string }> = {
  understand: { label: 'فهم الحالة', description: 'توضيح القضية الحالية' },
  explore: { label: 'التعمق والاستكشاف', description: 'الدوافع والاهتمامات وما وراء الحديث' },
  forward: { label: 'الانتقال إلى الأمام', description: 'الخيارات والقرار والخطوة التالية' },
};

export const PURPOSE_ORDER: Purpose[] = ['understand', 'deepen', 'self', 'options', 'decide', 'action'];

export const PURPOSES: Record<Purpose, { label: string; stage: Stage; brief: string }> = {
  understand: {
    label: 'فهم الحالة',
    stage: 'understand',
    brief: 'أسئلة توضيحية تساعد على فهم القضية الحالية كما يراها المسترشد',
  },
  deepen: {
    label: 'التعمق والاستكشاف',
    stage: 'explore',
    brief: 'أسئلة تكشف الدوافع والمشاعر والمعاني وما وراء حديث المسترشد',
  },
  self: {
    label: 'استكشاف الذات',
    stage: 'explore',
    brief: 'أسئلة عن الاهتمامات والقيم ونقاط القوة والخبرات السابقة',
  },
  options: {
    label: 'استكشاف الخيارات',
    stage: 'forward',
    brief: 'أسئلة توسّع الخيارات المتاحة وتفحص المعلومات المتوفرة عنها',
  },
  decide: {
    label: 'المفاضلة واتخاذ القرار',
    stage: 'forward',
    brief: 'أسئلة عن المعايير والموازنة بين الخيارات وما يلزم لحسم القرار',
  },
  action: {
    label: 'خطوة عملية',
    stage: 'forward',
    brief: 'أسئلة تحدد الخطوة التالية وما يدعمها وما قد يعيقها',
  },
};

export const MODES: { id: ModeId; label: string }[] = [
  { id: 'balanced', label: 'متوازن' },
  { id: 'understand', label: 'فهم الحالة أكثر' },
  { id: 'deepen', label: 'التعمق والاستكشاف' },
  { id: 'self', label: 'استكشاف الذات' },
  { id: 'options', label: 'استكشاف الخيارات' },
  { id: 'decide', label: 'المفاضلة واتخاذ القرار' },
  { id: 'action', label: 'الانتقال إلى خطوة عملية' },
];

export const DEFAULT_MODE: ModeId = 'balanced';

export function isPurpose(value: unknown): value is Purpose {
  return typeof value === 'string' && (PURPOSE_ORDER as string[]).includes(value);
}

export function isMode(value: unknown): value is ModeId {
  return value === 'balanced' || isPurpose(value);
}

/** صيغة العدد العربية: سؤال واحد، سؤالان، 5 أسئلة، 15 سؤالًا. */
export function questionCountLabel(n: number): string {
  if (n === 1) return 'سؤال واحد';
  if (n === 2) return 'سؤالان';
  if (n >= 3 && n <= 10) return `${n} أسئلة`;
  return `${n} سؤالًا`;
}
