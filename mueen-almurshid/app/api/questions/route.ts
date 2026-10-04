import { NextResponse } from 'next/server';
import { createAiClient } from '@/lib/generator/aiClient';
import { createQuestionEngine } from '@/lib/generator/engine';
import { UserError } from '@/lib/errors';
import {
  parseFollowUpInput,
  parseGenerateInput,
  parseReplaceInput,
} from '@/lib/validation';

/**
 * POST /api/questions
 * الواجهة لا تتصل بالنموذج مباشرة أبدًا؛ كل الطلبات تمر من هنا، والمفتاح
 * يبقى في الخادم. الحقل action يحدد العملية: generate | replace | followUp.
 *
 * قبل النشر العام: أضف هنا التحقق من هوية المرشد (تسجيل الدخول) وحدًّا
 * لعدد الطلبات، لأن هذا المسار سيستهلك رصيد الـ API.
 */

export const runtime = 'nodejs';

const engine = createQuestionEngine(createAiClient());

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'صيغة الطلب غير صحيحة.' }, { status: 400 });
  }

  try {
    switch (body?.action) {
      case 'generate':
        return NextResponse.json(await engine.generate(parseGenerateInput(body)));
      case 'replace':
        return NextResponse.json(await engine.replace(parseReplaceInput(body)));
      case 'followUp':
        return NextResponse.json(await engine.followUp(parseFollowUpInput(body)));
      default:
        return NextResponse.json({ error: 'عملية غير معروفة.' }, { status: 400 });
    }
  } catch (error) {
    if (error instanceof UserError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('[api/questions]', error);
    return NextResponse.json({ error: 'تعذّر إتمام الطلب. حاول مرة أخرى.' }, { status: 500 });
  }
}
