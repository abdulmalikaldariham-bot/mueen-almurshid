'use client';

import { PURPOSES, STAGES, STAGE_ORDER, questionCountLabel } from '@/lib/modes';
import type { Question, Stage } from '@/lib/types';
import type { BusyAction } from '@/hooks/useQuestionSession';
import { QuestionCard } from './QuestionCard';

interface QuestionListProps {
  questions: Question[];
  busy: Record<string, BusyAction>;
  onCopy: (text: string) => void;
  onReplace: (id: string) => void;
  onFollowUp: (id: string) => void;
  onEdit: (id: string, text: string) => void;
  onRemoveFollowUp: (id: string) => void;
}

/** قائمة الأسئلة مقسّمة بحسب مراحل الحوار، مع ترقيم متصل من 1 إلى 15. */
export function QuestionList({ questions, busy, ...handlers }: QuestionListProps) {
  const numbered = questions.map((question, index) => ({ question, number: index + 1 }));
  const groups = STAGE_ORDER.map((stage: Stage) => ({
    stage,
    items: numbered.filter(({ question }) => PURPOSES[question.purpose].stage === stage),
  })).filter((group) => group.items.length > 0);

  return (
    <div className="q-groups">
      {groups.map(({ stage, items }) => (
        <section key={stage} className="q-group" data-stage={stage} aria-labelledby={`stage-${stage}`}>
          <header className="q-group-head">
            <h3 id={`stage-${stage}`}>{STAGES[stage].label}</h3>
            <p>
              {STAGES[stage].description}
              <span className="q-group-count">{questionCountLabel(items.length)}</span>
            </p>
          </header>
          <ol className="q-list" start={items[0].number}>
            {items.map(({ question, number }) => (
              <QuestionCard
                key={question.id}
                question={question}
                number={number}
                order={number - 1}
                busy={busy[question.id]}
                {...handlers}
              />
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
