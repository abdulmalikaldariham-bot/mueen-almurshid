'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuestionSession } from '@/hooks/useQuestionSession';
import { copyText, formatAllQuestions } from '@/lib/clipboard';
import { TOTAL_QUESTIONS } from '@/lib/modes';
import { apiQuestionService } from '@/lib/services/questionService';
import type { QuestionService } from '@/lib/types';
import { CaseInput } from './CaseInput';
import { Disclaimer } from './Disclaimer';
import { LoadingList } from './LoadingList';
import { ModeSelector } from './ModeSelector';
import { QuestionList } from './QuestionList';
import { ResultsActions } from './ResultsActions';
import { SiteHeader } from './SiteHeader';
import { Toast } from './Toast';
import { SparkIcon } from './icons';

interface MueenAppProps {
  /** مصدر الأسئلة. الافتراضي يرسل الطلبات إلى /api/questions. */
  service?: QuestionService;
}

/** الصفحة الوحيدة للأداة: إدخال الحالة ← اختيار النمط ← التوليد ← النتائج. */
export function MueenApp({ service = apiQuestionService }: MueenAppProps) {
  const session = useQuestionSession(service);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);
  const caseRef = useRef<HTMLTextAreaElement>(null);
  const resultsRef = useRef<HTMLElement>(null);

  const isLoading = session.status === 'loading';
  const hasResults = session.questions.length > 0;

  const notify = useCallback((message: string) => {
    window.clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = window.setTimeout(() => setToast(null), 2200);
  }, []);

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  // بعد كل توليد ناجح: انتقل إلى النتائج.
  useEffect(() => {
    if (session.generation === 0) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    resultsRef.current?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  }, [session.generation]);

  const handleCopy = useCallback(
    async (text: string) => {
      notify((await copyText(text.trim())) ? 'تم النسخ' : 'تعذّر النسخ. انسخ النص يدويًا.');
    },
    [notify],
  );

  const handleCopyAll = useCallback(async () => {
    const ok = await copyText(formatAllQuestions(session.questions));
    notify(ok ? 'تم نسخ جميع الأسئلة' : 'تعذّر النسخ. انسخ النص يدويًا.');
  }, [notify, session.questions]);

  const { replace, followUp, reset } = session;

  const handleReplace = useCallback(
    async (id: string) => {
      const problem = await replace(id);
      if (problem) notify(problem);
    },
    [notify, replace],
  );

  const handleFollowUp = useCallback(
    async (id: string) => {
      const problem = await followUp(id);
      if (problem) notify(problem);
    },
    [followUp, notify],
  );

  const handleReset = useCallback(() => {
    reset();
    window.scrollTo({ top: 0 });
    caseRef.current?.focus();
  }, [reset]);

  return (
    <div className="page">
      <SiteHeader />

      <main>
        <form
          className="composer"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void session.generate();
          }}
        >
          <CaseInput
            ref={caseRef}
            value={session.caseText}
            error={session.error}
            disabled={isLoading}
            onChange={session.setCaseText}
            onSubmit={() => void session.generate()}
          />
          <ModeSelector value={session.mode} disabled={isLoading} onChange={session.setMode} />
          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            <SparkIcon />
            {isLoading ? 'جارٍ التوليد…' : `توليد ${TOTAL_QUESTIONS} سؤالًا مساعدًا`}
          </button>
        </form>

        {isLoading && <LoadingList />}

        {hasResults && !isLoading && (
          <section ref={resultsRef} className="results" aria-labelledby="results-title">
            <header className="results-head">
              <div className="results-title-row">
                <h2 id="results-title">الأسئلة المقترحة</h2>
                {session.source && (
                  <span className="source-pill" data-source={session.source}>
                    {session.source === 'ai' ? 'مولّدة بالذكاء الاصطناعي' : 'من البنك التجريبي'}
                  </span>
                )}
              </div>
              <p className="results-hint">اضغط على نص أي سؤال لتعديل صياغته.</p>
              {session.notice && <p className="results-notice">{session.notice}</p>}
            </header>

            <QuestionList
              key={session.generation}
              questions={session.questions}
              busy={session.busy}
              onCopy={handleCopy}
              onReplace={handleReplace}
              onFollowUp={handleFollowUp}
              onEdit={session.editQuestion}
              onRemoveFollowUp={session.removeFollowUp}
            />

            <ResultsActions
              disabled={isLoading}
              onRegenerate={() => void session.generate()}
              onCopyAll={handleCopyAll}
              onReset={handleReset}
            />

            <Disclaimer />
          </section>
        )}
      </main>

      <Toast message={toast} />
    </div>
  );
}
