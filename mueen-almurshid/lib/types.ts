/**
 * الأنواع المشتركة بين الواجهة والخادم.
 */

/** الغرض الدقيق للسؤال. */
export type Purpose = 'understand' | 'deepen' | 'self' | 'options' | 'decide' | 'action';

/** المرحلة التي يُعرض السؤال تحتها في القائمة (تسلسل الحوار). */
export type Stage = 'understand' | 'explore' | 'forward';

/** نمط التوليد الذي يختاره المرشد. */
export type ModeId = 'balanced' | Purpose;

/** مصدر الأسئلة: نموذج ذكاء اصطناعي أو البنك التجريبي. */
export type Source = 'ai' | 'mock';

export interface QuestionDraft {
  text: string;
  purpose: Purpose;
}

export interface Question extends QuestionDraft {
  id: string;
  followUp: string | null;
  /** يزيد مع كل استبدال حتى تُعاد حركة الظهور. */
  rev: number;
}

export interface GenerateInput {
  caseText: string;
  mode: ModeId;
  /** أسئلة عُرضت سابقًا لنفس الحالة ويُفضّل عدم تكرارها. */
  avoid?: string[];
}

export interface ReplaceInput {
  caseText: string;
  mode: ModeId;
  purpose: Purpose;
  current: string;
  /** كل الأسئلة الظاهرة حاليًا (حتى لا يتكرر أي منها). */
  existing: string[];
}

export interface FollowUpInput {
  caseText: string;
  purpose: Purpose;
  question: string;
  existing: string[];
}

export interface GenerateResult {
  questions: QuestionDraft[];
  source: Source;
  notice?: string;
}

export interface SingleResult {
  text: string;
  source: Source;
  notice?: string;
}

/**
 * العقد الذي تتعامل معه الواجهة. أي مصدر للأسئلة (API داخلي، خدمة خارجية،
 * بيانات تجريبية) يكفي أن يحقق هذه الدوال الثلاث.
 */
export interface QuestionService {
  generate(input: GenerateInput): Promise<GenerateResult>;
  replace(input: ReplaceInput): Promise<SingleResult>;
  followUp(input: FollowUpInput): Promise<SingleResult>;
}
