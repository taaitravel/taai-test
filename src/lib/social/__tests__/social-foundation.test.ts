import { describe, expect, it, beforeEach } from 'vitest';
import { cloneItinerary, CLONE_EXCLUDED_FIELDS } from '../clone';
import { evaluateSlots, FREE_ACTIVE_ITINERARY_LIMIT, SLOT_RPC_READY } from '../active-slots';
import { getMockItineraryDetail, MOCK_CARDS, DISCOVER_ROWS } from '../mock-discover';
import {
  MINERVA_SOCIAL_EVENT_IDS,
  buildSocialEvent,
  emitSocialEvent,
  __resetSocialEventDedupe,
} from '@/lib/taai/minerva/social-events';

describe('clone', () => {
  const source = getMockItineraryDetail(MOCK_CARDS[0].publicSlug)!;

  it('shifts dates while preserving day order', () => {
    const result = cloneItinerary(source, { startDate: '2026-09-10' });
    expect(result.days[0].date).toBe('2026-09-10');
    expect(result.days.map(d => d.day)).toEqual(source.days.map(d => d.day));
    expect(result.endDate).toBe(result.days[result.days.length - 1].date);
  });

  it('creates a private, active copy that needs fresh pricing', () => {
    const result = cloneItinerary(source, { startDate: '2026-01-01' });
    expect(result.visibility).toBe('private');
    expect(result.lifecycle).toBe('active');
    expect(result.requiresFreshPricing).toBe(true);
  });

  it('never copies bookings, travelers, chats or old prices', () => {
    const result = cloneItinerary(source, { startDate: '2026-01-01' });
    expect(result.excluded).toEqual(CLONE_EXCLUDED_FIELDS);
    const serialized = JSON.stringify(result.days);
    expect(serialized).not.toMatch(/booking|payment|traveler|chat|price/i);
  });

  it('requires a date before cloning', () => {
    expect(() => cloneItinerary(source, { startDate: '' })).toThrow();
  });
});

describe('active itinerary slots', () => {
  it('counts only active itineraries', () => {
    const check = evaluateSlots([
      { lifecycle: 'active' },
      { lifecycle: 'archived' },
      { lifecycle: 'past' },
    ]);
    expect(check.ok).toBe(true);
    expect(check.used).toBe(1);
    expect(check.allowed).toBe(FREE_ACTIVE_ITINERARY_LIMIT);
  });

  it('blocks at the limit with a supportive message', () => {
    const check = evaluateSlots([{ lifecycle: 'active' }, { lifecycle: 'active' }, { lifecycle: 'active' }]);
    expect(check.ok).toBe(false);
    expect(check.message).toMatch(/three active trips/i);
  });

  it('stays fail-closed until the migration is applied', () => {
    expect(SLOT_RPC_READY).toBe(false);
  });
});

describe('discover fixtures', () => {
  it('exposes only card projections without heavy payloads', () => {
    for (const card of MOCK_CARDS) {
      expect(Object.keys(card)).not.toContain('days');
      expect(Object.keys(card)).not.toContain('attendees');
      expect(card.author.fictional).toBe(true);
      expect(card.moderationStatus).toBe('ok');
    }
  });

  it('covers all five region groups', () => {
    expect(new Set(MOCK_CARDS.map(c => c.regionGroup))).toEqual(new Set(['A', 'B', 'C', 'D', 'F']));
  });

  it('builds non-empty discover rows', () => {
    for (const row of DISCOVER_ROWS) expect(row.cards.length).toBeGreaterThan(0);
  });
});

describe('minerva social events', () => {
  beforeEach(() => __resetSocialEventDedupe());

  it('deduplicates identical intent and carries no PII', () => {
    const event = buildSocialEvent(MINERVA_SOCIAL_EVENT_IDS.cloneStarted, 'clone_flow', {
      itinerarySlug: 'x',
    });
    expect(emitSocialEvent(event)).not.toBeNull();
    expect(emitSocialEvent(event)).toBeNull();
    expect(JSON.stringify(event)).not.toMatch(/@|email|phone/i);
    expect(event.synthetic).toBe(true);
  });
});
