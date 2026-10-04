'use client';

import { MODES } from '@/lib/modes';
import type { ModeId } from '@/lib/types';

interface ModeSelectorProps {
  value: ModeId;
  disabled: boolean;
  onChange: (mode: ModeId) => void;
}

/** القسم الثاني: هدف الأسئلة (اختياري، والافتراضي «متوازن»). */
export function ModeSelector({ value, disabled, onChange }: ModeSelectorProps) {
  return (
    <fieldset className="modes" disabled={disabled}>
      <legend className="field-label">
        هدف الأسئلة <span className="optional">اختياري</span>
      </legend>
      <div className="mode-chips">
        {MODES.map((mode) => (
          <label key={mode.id} className="chip">
            <input
              type="radio"
              name="question-mode"
              value={mode.id}
              checked={value === mode.id}
              onChange={() => onChange(mode.id)}
            />
            <span>{mode.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
