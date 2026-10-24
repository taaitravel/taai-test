import { PUBLISHED_LIMITS, normalizeTier, type TierId } from './tier-map.ts';

export type PlanLimitCode = 'PLAN_LIMIT_ITINERARIES' | 'PLAN_LIMIT_SHARING' | 'PLAN_LIMIT_AI';

/** True when another row is still allowed. max < 0 means unlimited. */
export const withinLimit = (used: number, max: number): boolean => {
  if (!Number.isFinite(max) || max < 0) return true;
  return used < max;
};

export const remainingCredits = (used: number, max: number): number => {
  if (!Number.isFinite(max) || max < 0) return -1;
  return Math.max(max - Math.max(used, 0), 0);
};

export const itineraryInsertDecision = (existingCount: number, tier: string | null | undefined) => {
  const limits = PUBLISHED_LIMITS[normalizeTier(tier) ?? 'traveler'];
  if (withinLimit(existingCount, limits.maxItineraries)) return { ok: true as const };
  return {
    ok: false as const,
    code: 'PLAN_LIMIT_ITINERARIES' as const,
    limit: limits.maxItineraries,
    tier: (normalizeTier(tier) ?? 'traveler') as TierId,
  };
};

export const shareInsertDecision = (existingShares: number, tier: string | null | undefined) => {
  const limits = PUBLISHED_LIMITS[normalizeTier(tier) ?? 'traveler'];
  if (withinLimit(existingShares, limits.maxSharedFriends)) return { ok: true as const };
  return {
    ok: false as const,
    code: 'PLAN_LIMIT_SHARING' as const,
    limit: limits.maxSharedFriends,
    tier: (normalizeTier(tier) ?? 'traveler') as TierId,
  };
};

export const aiCreditDecision = (usedThisMonth: number, tier: string | null | undefined) => {
  const limits = PUBLISHED_LIMITS[normalizeTier(tier) ?? 'traveler'];
  const remaining = remainingCredits(usedThisMonth, limits.monthlyAiCredits);
  if (remaining === -1 || remaining > 0) {
    return { ok: true as const, remaining: remaining === -1 ? -1 : remaining - 1 };
  }
  return { ok: false as const, code: 'PLAN_LIMIT_AI' as const, remaining: 0, limit: limits.monthlyAiCredits };
};

const CODES: PlanLimitCode[] = ['PLAN_LIMIT_ITINERARIES', 'PLAN_LIMIT_SHARING', 'PLAN_LIMIT_AI'];

export const planLimitCodeFromText = (value: unknown): PlanLimitCode | null => {
  const text = typeof value === 'string' ? value : '';
  return CODES.find((code) => text.includes(code)) ?? null;
};
