import type { ModeId, Purpose } from '../types';
import type { CaseAnalysis } from './analyzeCase';

/** عدد الأسئلة المطلوب لكل غرض. المجموع دائمًا 15. */
export type Plan = Record<Purpose, number>;

// الأنماط المركّزة: 9 أسئلة للغرض المختار، ويبقى في البداية 3 أسئلة لفهم
// الحالة حتى لا يقفز الحوار إلى الحلول قبل الفهم.
const FOCUSED_PLANS: Record<Purpose, Plan> = {
  understand: { understand: 9, deepen: 3, self: 1, options: 1, decide: 0, action: 1 },
  deepen: { understand: 3, deepen: 9, self: 1, options: 1, decide: 0, action: 1 },
  self: { understand: 3, deepen: 1, self: 9, options: 1, decide: 0, action: 1 },
  options: { understand: 3, deepen: 1, self: 1, options: 9, decide: 1, action: 0 },
  decide: { understand: 3, deepen: 1, self: 0, options: 1, decide: 9, action: 1 },
  action: { understand: 3, deepen: 2, self: 0, options: 1, decide: 0, action: 9 },
};

/**
 * النمط المتوازن: 5 للفهم، 5 للتعمق والاستكشاف، 5 للانتقال إلى الأمام.
 * توزيع الخمسة الأخيرة يتبع ما يظهر في وصف الحالة.
 */
function balancedPlan(analysis: CaseAnalysis): Plan {
  const explore = analysis.needs.self ? { deepen: 2, self: 3 } : { deepen: 3, self: 2 };

  let forward = { options: 2, decide: 1, action: 2 };
  if (analysis.phase === 'implementing') forward = { options: 1, decide: 0, action: 4 };
  else if (analysis.phase === 'deciding') forward = { options: 1, decide: 3, action: 1 };
  else if (analysis.phase === 'exploring') forward = { options: 3, decide: 1, action: 1 };

  return { understand: 5, ...explore, ...forward };
}

export function buildPlan(mode: ModeId, analysis: CaseAnalysis): Plan {
  return mode === 'balanced' ? balancedPlan(analysis) : { ...FOCUSED_PLANS[mode] };
}
