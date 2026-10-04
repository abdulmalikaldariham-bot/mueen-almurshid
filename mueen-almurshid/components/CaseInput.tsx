'use client';

import { forwardRef, type KeyboardEvent } from 'react';
import { CASE_MAX_LENGTH } from '@/lib/modes';

interface CaseInputProps {
  value: string;
  error: string | null;
  disabled: boolean;
  onChange: (value: string) => void;
  /** Ctrl/⌘ + Enter */
  onSubmit: () => void;
}

const PLACEHOLDER =
  'مثال: طالب جامعي في السنة الثانية غير مقتنع بتخصصه، يفكر في التحويل، لكنه متردد بسبب رأي الأسرة ولا يعرف البدائل المناسبة.';

/** القسم الأول: حقل وصف حالة المسترشد. */
export const CaseInput = forwardRef<HTMLTextAreaElement, CaseInputProps>(function CaseInput(
  { value, error, disabled, onChange, onSubmit },
  ref,
) {
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="field">
      <label className="field-label" htmlFor="case-text">
        اكتب حالة المسترشد باختصار
      </label>
      <textarea
        id="case-text"
        ref={ref}
        className="case-textarea"
        dir="rtl"
        rows={5}
        maxLength={CASE_MAX_LENGTH}
        placeholder={PLACEHOLDER}
        value={value}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? 'case-error case-hint' : 'case-hint'}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
      />
      <div className="field-meta">
        <p id="case-hint" className="field-hint">
          صِف الموقف دون ذكر اسم المسترشد أو أي بيانات تعرّف به.
        </p>
        <span className="field-count" aria-hidden="true">
          {value.length} / {CASE_MAX_LENGTH}
        </span>
      </div>
      {error && (
        <p id="case-error" className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
});
