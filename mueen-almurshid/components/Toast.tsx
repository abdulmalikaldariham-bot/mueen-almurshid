'use client';

interface ToastProps {
  message: string | null;
}

/** إشعار قصير (مثل «تم النسخ») يُقرأ لقارئات الشاشة. */
export function Toast({ message }: ToastProps) {
  return (
    <div className="toast-region" role="status" aria-live="polite">
      {message && <div className="toast">{message}</div>}
    </div>
  );
}
