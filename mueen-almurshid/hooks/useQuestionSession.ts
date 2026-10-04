'use client';

import { useCallback, useRef, useState } from 'react';
import { CASE_MIN_LENGTH, DEFAULT_MODE } from '@/lib/modes';
import type { ModeId, Question, QuestionDraft, QuestionService, Source } from '@/lib/types';

/**
 * حالة الجلسة الحالية: وصف الحالة، النمط، الأسئلة، وعمليات التوليد
 * والاستبدال والمتابعة. المكونات تعرض فقط، وكل المنطق هنا.
 *
 * عند إضافة حفظ الحالات أو سجل الجلسات لاحقًا، هذا هو المكان الذي يُستدعى
 * منه التخزين (بعد نجاح generate مثلًا).
 */

export type SessionStatus = 'idle' | 'loading' | 'ready';
export type BusyAction = 'replace' | 'followUp';

function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

function toQuestion(draft: QuestionDraft): Question {
  return { ...draft, id: newId(), followUp: null, rev: 0 };
}

function allTexts(questions: Question[]): string[] {
  return questions.flatMap((q) => (q.followUp ? [q.text, q.followUp] : [q.text]));
}

export function useQuestionSession(service: QuestionService) {
  const [caseText, setCaseText] = useState('');
  const [mode, setMode] = useState<ModeId>(DEFAULT_MODE);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [status, setStatus] = useState<SessionStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<Source | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState<Record<string, BusyAction>>({});
  /** يزيد مع كل توليد ناجح؛ تستخدمه الواجهة لإعادة حركة الظهور والتمرير. */
  const [generation, setGeneration] = useState(0);

  // الأسئلة التي عُرضت لهذه الحالة، حتى لا تتكرر عند طلب أسئلة جديدة.
  const seen = useRef<{ caseText: string; texts: string[] }>({ caseText: '', texts: [] });
  // يمنع ردًّا قديمًا من الكتابة فوق ردٍّ أحدث أو فوق حالة مُسحت.
  const requestId = useRef(0);

  const remember = useCallback((forCase: string, texts: string[]) => {
    if (seen.current.caseText !== forCase) seen.current = { caseText: forCase, texts: [] };
    seen.current.texts = [...seen.current.texts, ...texts].slice(-60);
  }, []);

  const generate = useCallback(async () => {
    const text = caseText.trim();
    if (text.length < CASE_MIN_LENGTH) {
      setError('اكتب جملة أو جملتين عن حالة المسترشد حتى ترتبط الأسئلة بها.');
      return;
    }
    const id = ++requestId.current;
    setError(null);
    setNotice(null);
    setStatus('loading');
    try {
      const avoid = seen.current.caseText === text ? seen.current.texts : [];
      const result = await service.generate({ caseText: text, mode, avoid });
      if (id !== requestId.current) return;
      remember(text, result.questions.map((q) => q.text));
      setQuestions(result.questions.map(toQuestion));
      setSource(result.source);
      setNotice(result.notice ?? null);
      setBusy({});
      setStatus('ready');
      setGeneration((g) => g + 1);
    } catch (err) {
      if (id !== requestId.current) return;
      setError(err instanceof Error ? err.message : 'تعذّر توليد الأسئلة. حاول مرة أخرى.');
      setStatus(questions.length > 0 ? 'ready' : 'idle');
    }
  }, [caseText, mode, questions.length, remember, service]);

  /** يستبدل سؤالًا واحدًا فقط. يعيد رسالة خطأ إن فشل. */
  const replace = useCallback(
    async (id: string): Promise<string | null> => {
      const target = questions.find((q) => q.id === id);
      if (!target || busy[id]) return null;
      const session = requestId.current;
      const text = caseText.trim();
      setBusy((b) => ({ ...b, [id]: 'replace' }));
      try {
        const result = await service.replace({
          caseText: text,
          mode,
          purpose: target.purpose,
          current: target.text,
          existing: [...new Set([...allTexts(questions), ...seen.current.texts])],
        });
        if (session !== requestId.current) return null;
        remember(text, [result.text]);
        setQuestions((list) =>
          list.map((q) => (q.id === id ? { ...q, text: result.text, followUp: null, rev: q.rev + 1 } : q)),
        );
        return null;
      } catch (err) {
        return err instanceof Error ? err.message : 'تعذّر استبدال السؤال.';
      } finally {
        setBusy(({ [id]: _done, ...rest }) => rest);
      }
    },
    [busy, caseText, mode, questions, remember, service],
  );

  /** يقترح سؤال متابعة للسؤال المحدد. يعيد رسالة خطأ إن فشل. */
  const followUp = useCallback(
    async (id: string): Promise<string | null> => {
      const target = questions.find((q) => q.id === id);
      if (!target || busy[id]) return null;
      const session = requestId.current;
      setBusy((b) => ({ ...b, [id]: 'followUp' }));
      try {
        const result = await service.followUp({
          caseText: caseText.trim(),
          purpose: target.purpose,
          question: target.text,
          existing: allTexts(questions),
        });
        if (session !== requestId.current) return null;
        setQuestions((list) => list.map((q) => (q.id === id ? { ...q, followUp: result.text } : q)));
        return null;
      } catch (err) {
        return err instanceof Error ? err.message : 'تعذّر اقتراح سؤال متابعة.';
      } finally {
        setBusy(({ [id]: _done, ...rest }) => rest);
      }
    },
    [busy, caseText, questions, service],
  );

  const editQuestion = useCallback((id: string, text: string) => {
    setQuestions((list) => list.map((q) => (q.id === id ? { ...q, text } : q)));
  }, []);

  const removeFollowUp = useCallback((id: string) => {
    setQuestions((list) => list.map((q) => (q.id === id ? { ...q, followUp: null } : q)));
  }, []);

  const updateCaseText = useCallback((text: string) => {
    setCaseText(text);
    setError(null);
  }, []);

  const reset = useCallback(() => {
    requestId.current++;
    seen.current = { caseText: '', texts: [] };
    setCaseText('');
    setMode(DEFAULT_MODE);
    setQuestions([]);
    setStatus('idle');
    setError(null);
    setSource(null);
    setNotice(null);
    setBusy({});
  }, []);

  return {
    caseText,
    mode,
    questions,
    status,
    error,
    source,
    notice,
    busy,
    generation,
    setCaseText: updateCaseText,
    setMode,
    generate,
    replace,
    followUp,
    editQuestion,
    removeFollowUp,
    reset,
  };
}
