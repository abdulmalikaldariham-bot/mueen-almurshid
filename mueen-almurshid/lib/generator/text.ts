/**
 * أدوات نصية صغيرة للتعامل مع العربية (تطبيع، مقارنة، خلط عشوائي).
 */

/** تطبيع للمطابقة: إزالة التشكيل والتطويل وتوحيد الهمزات والتاء المربوطة والألف المقصورة. */
export function normalizeArabic(text: string): string {
  return text
    .replace(/[\u064B-\u0652\u0670\u0640]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .toLowerCase();
}

/** مفتاح مقارنة لاكتشاف التكرار: نص مطبّع بلا علامات ترقيم ولا مسافات. */
export function dedupeKey(text: string): string {
  return normalizeArabic(text).replace(/[^\u0621-\u064Aa-z0-9]/g, '');
}

export function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function cleanQuestionText(text: string): string {
  return text
    .replace(/^\s*(?:[-•*]|\d+\s*[.)\-]|[٠-٩]+\s*[.)\-])\s*/, '')
    .replace(/\s+/g, ' ')
    .trim();
}
