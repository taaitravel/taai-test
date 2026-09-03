import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  request,
  resetRequestController,
  setRequestOwner,
  __requestControllerState,
  PRIVATE_CACHE_MAX_ENTRIES,
  PRIVATE_CACHE_TTL_MS,
} from '@/lib/data/request-controller';
import { DASHBOARD_ITINERARY_FIELDS, USER_PROFILE_FIELDS } from '@/hooks/useDashboardData';

describe('private request cache bounds', () => {
  beforeEach(() => {
    resetRequestController();
    vi.useRealTimers();
  });
  afterEach(() => vi.useRealTimers());

  it('switching users never reuses the previous account cache', async () => {
    const run = vi.fn(async () => 'a-data');
    const first = request({ key: 'itinerary:1', userId: 'user-a', run });
    await first.promise;
    first.release();

    const runB = vi.fn(async () => 'b-data');
    const second = request({ key: 'itinerary:1', userId: 'user-b', run: runB });
    expect(await second.promise).toBe('b-data');
    expect(second.fromCache).toBe(false);
    expect(runB).toHaveBeenCalledTimes(1);
    expect(__requestControllerState().owner).toBe('user-b');
  });

  it('logout clears every cached private entry', async () => {
    const handle = request({ key: 'itinerary:1', userId: 'user-a', run: async () => 1 });
    await handle.promise;
    handle.release();
    expect(__requestControllerState().size).toBe(1);

    setRequestOwner(null);
    expect(__requestControllerState().size).toBe(0);
  });

  it('expires cached private data after the TTL', async () => {
    vi.useFakeTimers();
    const run = vi.fn(async () => 'v1');
    const first = request({ key: 'itinerary:ttl', userId: 'u', run });
    await first.promise;
    first.release();

    const warm = request({ key: 'itinerary:ttl', userId: 'u', run });
    await warm.promise;
    warm.release();
    expect(run).toHaveBeenCalledTimes(1);

    vi.setSystemTime(Date.now() + PRIVATE_CACHE_TTL_MS + 1);

    const cold = request({ key: 'itinerary:ttl', userId: 'u', run });
    await cold.promise;
    cold.release();
    expect(run).toHaveBeenCalledTimes(2);
  });

  it('never grows beyond the maximum entry count', async () => {
    for (let i = 0; i < PRIVATE_CACHE_MAX_ENTRIES + 20; i += 1) {
      const handle = request({ key: `itinerary:${i}`, userId: 'u', run: async () => i });
      await handle.promise;
      handle.release();
    }
    expect(__requestControllerState().size).toBeLessThanOrEqual(PRIVATE_CACHE_MAX_ENTRIES);
  });
});

describe('lightweight dashboard projection', () => {
  const forbidden = [
    'attendees',
    'flights',
    'hotels',
    'activities',
    'reservations',
    'expedia_data',
  ];

  it('excludes heavy itinerary arrays and provider payloads', () => {
    for (const field of forbidden) {
      expect(DASHBOARD_ITINERARY_FIELDS).not.toContain(field);
    }
  });

  it('keeps only summary itinerary fields', () => {
    expect(DASHBOARD_ITINERARY_FIELDS).toContain('itin_name');
    expect(DASHBOARD_ITINERARY_FIELDS).toContain('itin_date_start');
    expect(DASHBOARD_ITINERARY_FIELDS).toContain('planned_traveler_count');
  });

  it('excludes contact PII from the dashboard profile projection', () => {
    expect(USER_PROFILE_FIELDS).not.toContain('email');
    expect(USER_PROFILE_FIELDS).not.toContain('cell');
  });
});
