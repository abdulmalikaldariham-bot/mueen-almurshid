'use client';

import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';

interface AutoTextareaProps {
  value: string;
  label: string;
  className?: string;
  onChange: (value: string) => void;
}

/** حقل نص يتمدد مع محتواه، يظهر كنص عادي إلى أن يُضغط عليه للتعديل. */
export function AutoTextarea({ value, label, className, onChange }: AutoTextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const fit = useCallback(() => {
    const element = ref.current;
    if (!element) return;
    element.style.height = 'auto';
    element.style.height = `${element.scrollHeight}px`;
  }, []);

  useLayoutEffect(fit, [value, fit]);

  useEffect(() => {
    window.addEventListener('resize', fit);
    document.fonts?.ready.then(fit).catch(() => {});
    return () => window.removeEventListener('resize', fit);
  }, [fit]);

  return (
    <textarea
      ref={ref}
      className={className}
      dir="rtl"
      rows={1}
      value={value}
      aria-label={label}
      spellCheck={false}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}
