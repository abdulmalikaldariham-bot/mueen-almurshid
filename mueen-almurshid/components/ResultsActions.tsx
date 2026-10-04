'use client';

import { CopyIcon, EraseIcon, RefreshIcon } from './icons';

interface ResultsActionsProps {
  disabled: boolean;
  onRegenerate: () => void;
  onCopyAll: () => void;
  onReset: () => void;
}

/** الأزرار أسفل قائمة الأسئلة. */
export function ResultsActions({ disabled, onRegenerate, onCopyAll, onReset }: ResultsActionsProps) {
  return (
    <div className="results-actions">
      <button type="button" className="btn btn-secondary" disabled={disabled} onClick={onRegenerate}>
        <RefreshIcon />
        توليد 15 سؤالًا جديدة
      </button>
      <button type="button" className="btn btn-secondary" onClick={onCopyAll}>
        <CopyIcon />
        نسخ جميع الأسئلة
      </button>
      <button type="button" className="btn btn-quiet" onClick={onReset}>
        <EraseIcon />
        مسح الحالة والبدء من جديد
      </button>
    </div>
  );
}
