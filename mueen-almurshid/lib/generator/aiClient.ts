import { AiUnavailableError, type AiClient } from './engine';

/**
 * ═══════════════════════════════════════════════════════════════════════
 *  مكان ربط مفتاح الـ API
 * ═══════════════════════════════════════════════════════════════════════
 *  هذا الملف يعمل في الخادم فقط (يُستورد من app/api/questions/route.ts).
 *  المفتاح يُقرأ من متغير البيئة ANTHROPIC_API_KEY:
 *    - محليًا: في ملف .env.local (انظر .env.example)
 *    - على Vercel: Settings → Environment Variables
 *  لا تضع المفتاح في أي ملف داخل components أو hooks، ولا تسبق اسم المتغير
 *  بـ NEXT_PUBLIC_ لأن ذلك يكشفه للمتصفح.
 *
 *  لاستخدام مزوّد آخر: اكتب دالة بنفس توقيع AiClient وأعدها من
 *  createAiClient، ولا يلزم تعديل أي ملف آخر.
 * ═══════════════════════════════════════════════════════════════════════
 */

const API_URL = 'https://api.anthropic.com/v1/messages';
const DEFAULT_MODEL = 'claude-sonnet-5-5';
const TIMEOUT_MS = 45_000;

interface MessagesResponse {
  content?: { type: string; text?: string }[];
}

/** يعيد null إذا لم يُضبط المفتاح، فيعمل الموقع على البنك التجريبي. */
export function createAiClient(): AiClient | null {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) return null;
  const model = process.env.AI_MODEL?.trim() || DEFAULT_MODEL;

  return async ({ system, user, tier }) => {
    if (typeof window !== 'undefined') {
      throw new AiUnavailableError('aiClient يعمل في الخادم فقط.');
    }

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: tier === 'quick' ? 400 : 2500,
        system,
        messages: [{ role: 'user', content: user }],
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!response.ok) {
      // يُسجَّل في سجلات الخادم فقط، ولا يُرسل للمتصفح.
      console.error(`[aiClient] ${response.status} ${await response.text().catch(() => '')}`);
      throw new Error(`AI request failed: ${response.status}`);
    }

    const data = (await response.json()) as MessagesResponse;
    return (data.content ?? [])
      .filter((block) => block.type === 'text')
      .map((block) => block.text ?? '')
      .join('');
  };
}
