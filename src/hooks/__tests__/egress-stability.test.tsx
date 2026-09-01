import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

/**
 * Regression tests for the Supabase egress incident:
 * rerenders with *equivalent but newly-allocated* objects/arrays must not
 * trigger additional reads.
 */

type Counter = { itinerarySelects: number; userSelects: number; countrySelects: number; functionInvokes: number };
const counts: Counter = { itinerarySelects: 0, userSelects: 0, countrySelects: 0, functionInvokes: 0 };
const selectedColumns: string[] = [];

const makeBuilder = (rows: any[], single: any) => {
  const builder: any = {
    eq: () => builder,
    gte: () => builder,
    lte: () => builder,
    in: () => builder,
    limit: () => builder,
    order: () => builder,
    single: async () => ({ data: single, error: null }),
    then: (resolve: any) => Promise.resolve({ data: rows, error: null }).then(resolve),
  };
  return builder;
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (table: string) => ({
      select: (cols: string) => {
        selectedColumns.push(`${table}:${cols}`);
        if (table === 'itinerary') {
          counts.itinerarySelects += 1;
          return makeBuilder([{ id: 1, itin_name: 'Trip', userid: 'u1' }], { id: 1, itin_name: 'Trip' });
        }
        if (table === 'users') {
          counts.userSelects += 1;
          return makeBuilder([], { userid: 'u1', first_name: 'Marco' });
        }
        counts.countrySelects += 1;
        return makeBuilder(
          [{ country_name: 'Japan', latitude: 36, longitude: 138, country_code: 'JP' }],
          null
        );
      },
    }),
    functions: {
      invoke: async () => {
        counts.functionInvokes += 1;
        return { data: { countries: [] }, error: null };
      },
    },
    auth: { getUser: async () => ({ data: { user: { id: 'u1' } }, error: null }) },
  },
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'u1' } }),
}));

vi.mock('@/hooks/use-toast', () => ({
  // New identity on every render — the hooks must not depend on it.
  useToast: () => ({ toast: () => {} }),
}));

vi.mock('sonner', () => ({ toast: { error: () => {} } }));

vi.mock('@/hooks/useMapLocationSync', () => ({
  useMapLocationSync: () => ({ syncMapLocations: () => {}, isUpdating: false }),
}));

import { useDashboardData } from '@/hooks/useDashboardData';
import { useItineraryData } from '@/hooks/useItineraryData';
import { useCountryData, __resetCountryCache } from '@/hooks/useCountryData';
import { __resetReadGuard, trackRead, stableListKey } from '@/lib/data/read-guard';

beforeEach(() => {
  counts.itinerarySelects = 0;
  counts.userSelects = 0;
  counts.countrySelects = 0;
  counts.functionInvokes = 0;
  selectedColumns.length = 0;
  __resetCountryCache();
  __resetReadGuard();
});

afterEach(() => vi.restoreAllMocks());

describe('useDashboardData', () => {
  it('does not refetch when an equivalent filterOptions object is passed on rerender', async () => {
    const { rerender } = renderHook(
      ({ f }: { f: any }) => useDashboardData(f),
      { initialProps: { f: { sortBy: 'start_date', dateFrom: '2026-01-01' } } }
    );

    await waitFor(() => expect(counts.itinerarySelects).toBe(1));
    const before = { itin: counts.itinerarySelects, users: counts.userSelects };

    for (let i = 0; i < 10; i++) {
      // New object identity, identical values.
      rerender({ f: { sortBy: 'start_date', dateFrom: '2026-01-01' } });
    }
    await new Promise(r => setTimeout(r, 30));

    expect(counts.itinerarySelects).toBe(before.itin);
    expect(counts.userSelects).toBe(before.users);
    expect(counts.itinerarySelects).toBe(1);
  });

  it('refetches when a primitive filter value actually changes', async () => {
    const { rerender } = renderHook(
      ({ f }: { f: any }) => useDashboardData(f),
      { initialProps: { f: { sortBy: 'start_date' } } }
    );
    await waitFor(() => expect(counts.itinerarySelects).toBe(1));
    rerender({ f: { sortBy: 'created_at' } });
    await waitFor(() => expect(counts.itinerarySelects).toBe(2));
  });

  it('uses explicit projections and excludes provider payloads', async () => {
    renderHook(() => useDashboardData({ sortBy: 'start_date' }));
    await waitFor(() => expect(selectedColumns.length).toBeGreaterThan(0));
    const itinerarySelect = selectedColumns.find(c => c.startsWith('itinerary:'))!;
    expect(itinerarySelect).not.toContain('*');
    expect(itinerarySelect).not.toContain('expedia_data');
  });
});

describe('useItineraryData', () => {
  it('does not refetch on rerender despite an unstable toast identity', async () => {
    const { rerender } = renderHook(({ id }: { id: string }) => useItineraryData(id), {
      initialProps: { id: '7' },
    });
    await waitFor(() => expect(counts.itinerarySelects).toBe(1));
    for (let i = 0; i < 10; i++) rerender({ id: '7' });
    await new Promise(r => setTimeout(r, 30));
    expect(counts.itinerarySelects).toBe(1);
  });

  it('projects explicit fields only', async () => {
    renderHook(() => useItineraryData('7'));
    await waitFor(() => expect(selectedColumns.length).toBeGreaterThan(0));
    expect(selectedColumns[0]).not.toContain('*');
    expect(selectedColumns[0]).not.toContain('expedia_data');
  });
});

describe('useCountryData', () => {
  it('does not refetch for equivalent arrays, reordered arrays or duplicates', async () => {
    const { rerender } = renderHook(({ c }: { c: string[] }) => useCountryData(c), {
      initialProps: { c: ['Japan', 'Peru'] },
    });
    await waitFor(() => expect(counts.countrySelects).toBe(1));

    rerender({ c: ['Japan', 'Peru'] });
    rerender({ c: ['Peru', 'Japan'] });
    rerender({ c: ['Japan', 'Japan', 'Peru'] });
    await new Promise(r => setTimeout(r, 30));

    expect(counts.countrySelects).toBe(1);
  });

  it('does not geocode the same missing country twice in a session', async () => {
    const { rerender } = renderHook(({ c }: { c: string[] }) => useCountryData(c), {
      initialProps: { c: ['Atlantis'] },
    });
    await waitFor(() => expect(counts.functionInvokes).toBe(1));
    rerender({ c: ['Atlantis'] });
    rerender({ c: ['Atlantis', 'Japan'] });
    await new Promise(r => setTimeout(r, 30));
    expect(counts.functionInvokes).toBe(1);
  });
});

describe('read guard', () => {
  it('warns after more than five identical reads in the window', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    for (let i = 0; i < 6; i++) trackRead('itinerary:list:test');
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toContain('itinerary:list:test');
    expect(String(warn.mock.calls[0][0])).not.toContain('sb_');
  });

  it('builds sorted deduplicated keys', () => {
    expect(stableListKey(['b', 'a', 'b', ' a ', null])).toBe('a|b');
  });
});
