import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

/**
 * Hermes request-containment regressions:
 * - equivalent rerenders issue one request
 * - unmount aborts the real network request
 * - manual refresh bypasses stale cache
 * - a user change cannot reuse another user's cache
 * - Discover never queries private itinerary payloads
 */

type Call = { table: string; cols: string; signal?: AbortSignal };
const calls: Call[] = [];
let currentUser = { id: 'u1' };
let resolveNext: ((v: unknown) => void) | null = null;

const makeBuilder = (table: string, cols: string, rows: any[], single: any) => {
  const call: Call = { table, cols };
  calls.push(call);

  const settle = () =>
    new Promise<any>((resolve, reject) => {
      if (table === 'itinerary' && resolveNext === null && call.signal) {
        // Held open so the test can assert abort-on-unmount.
        call.signal.addEventListener('abort', () => {
          const err = new Error('aborted');
          err.name = 'AbortError';
          reject(err);
        });
        setTimeout(() => resolve({ data: rows, error: null }), 5000);
        return;
      }
      resolve({ data: rows, error: null });
    });

  const builder: any = {
    eq: () => builder,
    gte: () => builder,
    lte: () => builder,
    in: () => builder,
    limit: () => builder,
    order: () => builder,
    abortSignal: (signal: AbortSignal) => {
      call.signal = signal;
      return builder;
    },
    single: () => settle().then(() => ({ data: single, error: null })),
    then: (resolve: any, reject: any) => settle().then(resolve, reject),
  };
  return builder;
};

let holdItineraryRequests = false;

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (table: string) => ({
      select: (cols: string) => {
        if (table === 'itinerary') {
          const rows = [{ id: 1, itin_name: 'Trip', userid: currentUser.id }];
          if (holdItineraryRequests) {
            const call: Call = { table, cols };
            calls.push(call);
            const builder: any = {
              eq: () => builder,
              gte: () => builder,
              lte: () => builder,
              limit: () => builder,
              order: () => builder,
              abortSignal: (signal: AbortSignal) => {
                call.signal = signal;
                return builder;
              },
              single: () => builder.then(),
              then: (resolve: any, reject: any) =>
                new Promise<any>((_res, rej) => {
                  call.signal?.addEventListener('abort', () => {
                    const err = new Error('aborted');
                    err.name = 'AbortError';
                    rej(err);
                  });
                }).then(resolve, reject),
            };
            return builder;
          }
          return makeBuilder(table, cols, rows, rows[0]);
        }
        if (table === 'users') {
          return makeBuilder(table, cols, [], { userid: currentUser.id, first_name: 'Marco' });
        }
        return makeBuilder(table, cols, [], null);
      },
    }),
    functions: { invoke: async () => ({ data: {}, error: null }) },
    auth: { getUser: async () => ({ data: { user: currentUser }, error: null }) },
  },
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: currentUser }),
}));

vi.mock('sonner', () => ({ toast: { error: () => {} } }));

import { useDashboardData } from '@/hooks/useDashboardData';
import { resetRequestController, __requestControllerState } from '@/lib/data/request-controller';
import { DISCOVER_ROWS, MOCK_CARDS, getMockItineraryDetail } from '@/lib/social/mock-discover';

const itineraryCalls = () => calls.filter(c => c.table === 'itinerary');

beforeEach(() => {
  calls.length = 0;
  currentUser = { id: 'u1' };
  resolveNext = null;
  holdItineraryRequests = false;
  resetRequestController();
});

describe('request controller — dashboard summary reads', () => {
  it('issues one request for equivalent rerenders', async () => {
    const { rerender } = renderHook(({ f }: { f: any }) => useDashboardData(f), {
      initialProps: { f: { sortBy: 'start_date' } },
    });
    await waitFor(() => expect(itineraryCalls().length).toBe(1));
    for (let i = 0; i < 8; i++) rerender({ f: { sortBy: 'start_date' } });
    await new Promise(r => setTimeout(r, 30));
    expect(itineraryCalls().length).toBe(1);
  });

  it('uses a lightweight projection without provider payloads or itinerary blobs', async () => {
    renderHook(() => useDashboardData({ sortBy: 'start_date' }));
    await waitFor(() => expect(itineraryCalls().length).toBe(1));
    const cols = itineraryCalls()[0].cols;
    expect(cols).not.toContain('*');
    expect(cols).not.toContain('expedia_data');
  });

  it('aborts the real network request when the last consumer unmounts', async () => {
    holdItineraryRequests = true;
    const { unmount } = renderHook(() => useDashboardData({ sortBy: 'start_date' }));
    await waitFor(() => expect(itineraryCalls().length).toBe(1));
    const signal = itineraryCalls()[0].signal!;
    expect(signal.aborted).toBe(false);
    unmount();
    await waitFor(() => expect(signal.aborted).toBe(true));
    expect(__requestControllerState().size).toBe(0);
  });

  it('manual refresh bypasses the cached response', async () => {
    const { result } = renderHook(() => useDashboardData({ sortBy: 'start_date' }));
    await waitFor(() => expect(itineraryCalls().length).toBe(1));
    result.current.refetchData();
    await waitFor(() => expect(itineraryCalls().length).toBe(2));
  });

  it('never reuses another user cache after a user change', async () => {
    const first = renderHook(() => useDashboardData({ sortBy: 'start_date' }));
    await waitFor(() => expect(itineraryCalls().length).toBe(1));
    first.unmount();

    currentUser = { id: 'u2' };
    renderHook(() => useDashboardData({ sortBy: 'start_date' }));
    await waitFor(() => expect(itineraryCalls().length).toBe(2));
    // Nothing from u1 survives in the in-memory cache.
    expect(__requestControllerState().keys.every(k => !k.includes('u1'))).toBe(true);
  });

  it('caches private records in memory only', async () => {
    renderHook(() => useDashboardData({ sortBy: 'start_date' }));
    await waitFor(() => expect(itineraryCalls().length).toBe(1));
    expect(sessionStorage.length).toBe(0);
    expect(
      Object.keys(localStorage).some(k => k.startsWith('dashboard:') || k.startsWith('itinerary:'))
    ).toBe(false);
  });
});

describe('Discover projections', () => {
  it('renders exactly six synthetic fixtures without querying private tables', () => {
    expect(MOCK_CARDS.length).toBe(6);
    expect(DISCOVER_ROWS.length).toBe(2);
    expect(itineraryCalls().length).toBe(0);
    expect(calls.length).toBe(0);
  });

  it('exposes card projections free of attendees, bookings and provider payloads', () => {
    const forbidden = ['attendees', 'flights', 'hotels', 'reservations', 'expedia_data', 'userid', 'email'];
    MOCK_CARDS.forEach(card => {
      forbidden.forEach(field => expect(Object.keys(card)).not.toContain(field));
    });
    const detail = getMockItineraryDetail(MOCK_CARDS[0].publicSlug)!;
    forbidden.forEach(field => expect(Object.keys(detail)).not.toContain(field));
    expect(calls.length).toBe(0);
  });
});
