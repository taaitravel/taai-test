import { describe, it, expect, vi } from 'vitest';
import {
  AI_CONTEXT_CAPS,
  AI_FORBIDDEN_FIELDS,
  AI_ITINERARY_COLUMNS,
  boundHistory,
  createItineraryContextLoader,
  sanitizeItineraryContext,
} from '../../../../supabase/functions/_shared/itinerary-context';

const bigRow = () => ({
  id: 7,
  itin_id: 'trip-7',
  itin_name: 'X'.repeat(400),
  itin_desc: 'D'.repeat(4000),
  itin_date_start: '2026-01-01',
  itin_date_end: '2026-03-01',
  budget: 5000,
  spending: 1200,
  userid: 'user-a',
  itin_locations: Array.from({ length: 40 }, (_, i) => `City ${i}`),
  planned_traveler_count: 2,
  expedia_data: { huge: 'X'.repeat(50_000) },
  attendees: [{ name: 'Nina', email: 'nina@example.com' }],
  hotels: Array.from({ length: 60 }, (_, i) => ({
    name: `Hotel ${i}`,
    city: 'Lisbon',
    cost: 100,
    nights: 2,
    rating: 4,
    expedia_data: { raw: 'X'.repeat(2000) },
    provider_response: { body: 'X'.repeat(2000) },
    notes: 'N'.repeat(5000),
  })),
  flights: [{ airline: 'TP', flight_number: 'TP123', from: 'JFK', to: 'LIS', cost: 500, raw_offer: { x: 1 } }],
  activities: [],
  reservations: [],
});

const makeClient = (row: unknown, counter: { reads: number }) => ({
  from: () => {
    const q: any = {
      select: (cols: string) => {
        counter.reads += 1;
        expect(cols).not.toContain('*');
        return q;
      },
      eq: () => q,
      maybeSingle: async () => ({ data: row, error: null }),
    };
    return q;
  },
});

describe('AI itinerary context allow-list', () => {
  it('never exposes provider blobs, payment data, attendees or PII', () => {
    const context = sanitizeItineraryContext(bigRow())!;
    const serialized = JSON.stringify(context);
    for (const field of AI_FORBIDDEN_FIELDS) {
      expect(serialized).not.toContain(field);
    }
    expect(serialized).not.toContain('nina@example.com');
  });

  it('uses an explicit column allow-list with no provider columns', () => {
    expect(AI_ITINERARY_COLUMNS).not.toContain('*');
    expect(AI_ITINERARY_COLUMNS).not.toContain('expedia_data');
    expect(AI_ITINERARY_COLUMNS).not.toContain('attendees');
  });

  it('caps items per section, locations and days and truncates free text', () => {
    const context = sanitizeItineraryContext(bigRow())!;
    expect(context.hotels).toHaveLength(AI_CONTEXT_CAPS.maxItemsPerSection);
    expect(context.locations).toHaveLength(AI_CONTEXT_CAPS.locations);
    expect(context.days).toBeLessThanOrEqual(AI_CONTEXT_CAPS.maxDays);
    expect(context.name!.length).toBeLessThanOrEqual(AI_CONTEXT_CAPS.nameChars);
    expect(context.description!.length).toBeLessThanOrEqual(AI_CONTEXT_CAPS.descriptionChars);
    expect(context.truncated.hotels).toBe(true);
  });

  it('performs exactly one itinerary read per invocation across every stage', async () => {
    const counter = { reads: 0 };
    const loader = createItineraryContextLoader(makeClient(bigRow(), counter) as never);

    await Promise.all([loader.load(7), loader.load(7), loader.load(7)]);
    await loader.load(7);
    await loader.load(7);

    expect(counter.reads).toBe(1);
    expect(loader.reads()).toBe(1);
  });

  it('returns the owner id so ownership is checked without extra reads', async () => {
    const counter = { reads: 0 };
    const loader = createItineraryContextLoader(makeClient(bigRow(), counter) as never);
    const { ownerId, context } = await loader.load(7);
    expect(ownerId).toBe('user-a');
    expect(context?.id).toBe(7);
    expect(counter.reads).toBe(1);
  });

  it('bounds chat history messages and content length', () => {
    const history = Array.from({ length: 40 }, (_, i) => ({ role: 'user', content: `${i}`.repeat(4000) }));
    const bounded = boundHistory(history);
    expect(bounded).toHaveLength(AI_CONTEXT_CAPS.maxHistoryMessages);
    expect(String(bounded[0].content).length).toBeLessThanOrEqual(1500);
  });

  it('does not log the itinerary context', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const counter = { reads: 0 };
    const loader = createItineraryContextLoader(makeClient(bigRow(), counter) as never);
    await loader.load(7);
    for (const call of log.mock.calls) {
      expect(JSON.stringify(call)).not.toContain('Hotel 1');
    }
    log.mockRestore();
  });
});
