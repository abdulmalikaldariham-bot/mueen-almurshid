'use client';

import { useEffect, useState } from 'react';

/** حالة الانتظار أثناء التوليد. */
export function LoadingList() {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setSlow(true), 4000);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <section className="loading" role="status" aria-live="polite">
      <p className="loading-title">جارٍ قراءة الحالة وصياغة الأسئلة…</p>
      {slow && <p className="loading-note">قد يستغرق التوليد بالذكاء الاصطناعي حتى نصف دقيقة.</p>}
      <div className="skeletons" aria-hidden="true">
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="skeleton">
            <span />
            <span />
          </div>
        ))}
      </div>
    </section>
  );
}
