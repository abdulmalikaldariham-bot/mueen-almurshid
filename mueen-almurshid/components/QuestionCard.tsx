'use client';

import { PURPOSES, STAGES } from '@/lib/modes';
import type { Question } from '@/lib/types';
import type { BusyAction } from '@/hooks/useQuestionSession';
import { AutoTextarea } from './AutoTextarea';
import { CloseIcon, CopyIcon, FollowUpIcon, SwapIcon } from './icons';

interface QuestionCardProps {
  question: Question;
  number: number;
  /** ترتيب البطاقة داخل القائمة، لتدرّج حركة الظهور. */
  order: number;
  busy: BusyAction | undefined;
  onCopy: (text: string) => void;
  onReplace: (id: string) => void;
  onFollowUp: (id: string) => void;
  onEdit: (id: string, text: string) => void;
  onRemoveFollowUp: (id: string) => void;
}

/** بطاقة سؤال واحد: الرقم، النص القابل للتعديل، وأزرار النسخ والاستبدال والمتابعة. */
export function QuestionCard({
  question,
  number,
  order,
  busy,
  onCopy,
  onReplace,
  onFollowUp,
  onEdit,
  onRemoveFollowUp,
}: QuestionCardProps) {
  const isBusy = Boolean(busy);
  const purpose = PURPOSES[question.purpose];
  // الوسم يظهر فقط حين يضيف معلومة غير عنوان المجموعة.
  const showPurpose = purpose.label !== STAGES[purpose.stage].label;

  return (
    <li className="q-item" style={{ ['--order' as string]: order }}>
      <span className="q-node" aria-hidden="true">
        {number}
      </span>
      <article className="q-card" aria-busy={isBusy}>
        {showPurpose && <p className="q-purpose">{purpose.label}</p>}
        <AutoTextarea
          key={question.rev}
          className={question.rev > 0 ? 'q-text is-swapped' : 'q-text'}
          value={question.text}
          label={`السؤال ${number}، قابل للتعديل`}
          onChange={(text) => onEdit(question.id, text)}
        />

        {question.followUp && (
          <div className="q-followup">
            <span className="q-followup-label">سؤال متابعة</span>
            <p className="q-followup-text">{question.followUp}</p>
            <div className="q-followup-actions">
              <button
                type="button"
                className="act act-icon"
                aria-label="نسخ سؤال المتابعة"
                title="نسخ"
                onClick={() => onCopy(question.followUp!)}
              >
                <CopyIcon />
              </button>
              <button
                type="button"
                className="act act-icon"
                aria-label="إزالة سؤال المتابعة"
                title="إزالة"
                onClick={() => onRemoveFollowUp(question.id)}
              >
                <CloseIcon />
              </button>
            </div>
          </div>
        )}

        <div className="q-actions">
          <button type="button" className="act" onClick={() => onCopy(question.text)}>
            <CopyIcon />
            نسخ
          </button>
          <button type="button" className="act" disabled={isBusy} onClick={() => onReplace(question.id)}>
            <SwapIcon className={busy === 'replace' ? 'is-spinning' : undefined} />
            {busy === 'replace' ? 'جارٍ الاستبدال…' : 'استبدال'}
          </button>
          <button type="button" className="act" disabled={isBusy} onClick={() => onFollowUp(question.id)}>
            <FollowUpIcon />
            {busy === 'followUp'
              ? 'جارٍ الاقتراح…'
              : question.followUp
                ? 'سؤال متابعة آخر'
                : 'سؤال متابعة'}
          </button>
        </div>
      </article>
    </li>
  );
}
