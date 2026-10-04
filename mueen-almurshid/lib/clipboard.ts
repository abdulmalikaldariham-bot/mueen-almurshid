import { PURPOSES, STAGES } from './modes';
import type { Question } from './types';

/** ينسخ نصًّا إلى الحافظة، مع طريقة بديلة للمتصفحات التي تمنع Clipboard API. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand('copy');
      area.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

/** يجهّز كل الأسئلة كنص مرقّم ومقسّم بحسب مراحل الحوار. */
export function formatAllQuestions(questions: Question[]): string {
  const lines: string[] = [];
  let lastStage = '';
  questions.forEach((question, index) => {
    const stage = PURPOSES[question.purpose].stage;
    if (stage !== lastStage) {
      if (lines.length > 0) lines.push('');
      lines.push(`${STAGES[stage].label}:`);
      lastStage = stage;
    }
    lines.push(`${index + 1}. ${question.text.trim()}`);
    if (question.followUp) lines.push(`   متابعة: ${question.followUp}`);
  });
  return lines.join('\n');
}
