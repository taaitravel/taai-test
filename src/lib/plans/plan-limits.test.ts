import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  aiCreditDecision,
  itineraryInsertDecision,
  planLimitCodeFromText,
  shareInsertDecision,
} from '../../../supabase/functions/_shared/plan-limits';
import { PUBLISHED_LIMITS, type TierId } from '../../../supabase/functions/_shared/tier-map';

const migration = readFileSync('supabase/migrations/20261023190000_plan_entitlements_and_storage_limits.sql', 'utf8');

describe('published plan limits', () => {
  it('keeps the free plan at 3 trips, 10 people, and 5 planning credits', () => {
    expect(PUBLISHED_LIMITS.traveler).toEqual({
      maxItineraries: 3,
      maxSharedFriends: 10,
      monthlyAiCredits: 5,
    });
    expect(migration).toContain("('traveler', 3, 10, 5, 'Traveler')");
    expect(migration).toContain("('taai_traveler', 20, 20, 50, 'taaiTraveler')");
    expect(migration).toContain("('taai_traveler_plus', -1, -1, 100, 'taaiTraveler+')");
    expect(migration).toContain("('corp_taai_traveler_plus', 100, 50, 200, 'Corp. taaiTraveler+')");
    expect(migration).toContain("('taai_enterprise_plus', -1, -1, -1, 'taaiEnterprise+')");
  });

  it('blocks a new trip or share once the published count is reached and grandfathers existing rows', () => {
    expect(itineraryInsertDecision(2, 'traveler').ok).toBe(true);
    expect(itineraryInsertDecision(3, 'traveler')).toMatchObject({ ok: false, code: 'PLAN_LIMIT_ITINERARIES', limit: 3 });
    expect(itineraryInsertDecision(21, 'taai_traveler_plus').ok).toBe(true);
    expect(shareInsertDecision(10, 'traveler')).toMatchObject({ ok: false, code: 'PLAN_LIMIT_SHARING', limit: 10 });
    expect(shareInsertDecision(49, 'corp_taai_traveler_plus').ok).toBe(true);
    expect(migration).toContain('before insert on public.itinerary');
    expect(migration).toContain("raise exception 'PLAN_LIMIT_ITINERARIES'");
    expect(migration).toContain("raise exception 'PLAN_LIMIT_SHARING'");
  });

  it('consumes one AI credit per turn and stops at or below the monthly allowance', () => {
    expect(aiCreditDecision(4, 'traveler')).toMatchObject({ ok: true, remaining: 0 });
    expect(aiCreditDecision(5, 'traveler')).toMatchObject({ ok: false, code: 'PLAN_LIMIT_AI', remaining: 0 });
    expect(aiCreditDecision(6, 'traveler')).toMatchObject({ ok: false, code: 'PLAN_LIMIT_AI', remaining: 0, limit: 5 });
    expect(aiCreditDecision(500, 'taai_enterprise_plus')).toMatchObject({ ok: true, remaining: -1 });
    expect(migration).toContain('revoke all on function public.consume_ai_credit(uuid) from public, anon, authenticated');
    expect(planLimitCodeFromText('insert failed: PLAN_LIMIT_ITINERARIES')).toBe('PLAN_LIMIT_ITINERARIES');
  });
});

const TIER_LIMITS: Array<[TierId, number, number, number]> = [
  ['traveler', 3, 10, 5],
  ['taai_traveler', 20, 20, 50],
  ['taai_traveler_plus', -1, -1, 100],
  ['corp_taai_traveler_plus', 100, 50, 200],
];

describe('published limits for each paid and free tier', () => {
  it.each(TIER_LIMITS)('%s allows trips/people/credits up to %s/%s/%s and blocks the next one', (tier, trips, friends, credits) => {
    expect(PUBLISHED_LIMITS[tier]).toEqual({
      maxItineraries: trips,
      maxSharedFriends: friends,
      monthlyAiCredits: credits,
    });

    if (trips < 0) {
      expect(itineraryInsertDecision(10_000, tier).ok).toBe(true);
    } else {
      expect(itineraryInsertDecision(trips - 1, tier).ok).toBe(true);
      expect(itineraryInsertDecision(trips, tier)).toMatchObject({
        ok: false,
        code: 'PLAN_LIMIT_ITINERARIES',
        limit: trips,
      });
    }

    if (friends < 0) {
      expect(shareInsertDecision(10_000, tier).ok).toBe(true);
    } else {
      expect(shareInsertDecision(friends - 1, tier).ok).toBe(true);
      expect(shareInsertDecision(friends, tier)).toMatchObject({
        ok: false,
        code: 'PLAN_LIMIT_SHARING',
        limit: friends,
      });
    }

    expect(aiCreditDecision(credits - 1, tier)).toMatchObject({ ok: true, remaining: 0 });
    expect(aiCreditDecision(credits, tier)).toMatchObject({
      ok: false,
      code: 'PLAN_LIMIT_AI',
      remaining: 0,
      limit: credits,
    });
    expect(aiCreditDecision(credits + 1, tier).ok).toBe(false);
  });

  it('tells travelers that every Miles or Bob message spends a planning credit', () => {
    const modal = readFileSync('src/components/plans/UpgradeModal.tsx', 'utf8');
    expect(modal).toContain('Every message to Miles or Bob uses one credit.');
    expect(modal).not.toContain('search credits');
    expect(modal).toContain('taai does not sell or take payment for travel');
  });
});
