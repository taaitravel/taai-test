import { describe, expect, it } from 'vitest';
import {
  toPublicCardProjection,
  toPublicProfileProjection,
  visiblePublicCards,
  hasForbiddenField,
  FORBIDDEN_PUBLIC_FIELDS,
} from '../projections';
import { cloneItinerary } from '../clone';
import {
  evaluateSlots,
  FREE_ACTIVE_ITINERARY_LIMIT,
  FREE_TIER_POLICY,
  LIMIT_REACHED_ACTIONS,
} from '../active-slots';
import { getMockItineraryDetail, MOCK_CARDS, DISCOVER_ROWS } from '../mock-discover';

const dirtyRow = {
  id: 'x',
  publicSlug: 'x-trip',
  title: 'Trip',
  summary: 'Summary',
  destinations: ['Lisbon'],
  dayCount: 3,
  regionGroup: 'C',
  coverGradient: 'linear-gradient(#000,#fff)',
  cloneCount: 2,
  publishedAt: '2026-01-01T00:00:00.000Z',
  author: { slug: 'a', displayName: 'A', fictional: true, email: 'a@b.co' },
  curatedBy: 'community',
  moderationStatus: 'ok',
  // everything below must be dropped
  attendees: [{ email: 'x@y.co' }],
  bookings: [{ id: 1 }],
  payments: [{ amount: 10 }],
  chats: ['hi'],
  private_notes: 'secret',
  expedia_data: { raw: true },
  user_id: 'uuid',
  email: 'x@y.co',
  phone: '+1',
};

describe('privacy projections', () => {
  it('drops every forbidden field from a card', () => {
    const card = toPublicCardProjection(dirtyRow);
    for (const field of FORBIDDEN_PUBLIC_FIELDS) {
      expect(Object.keys(card)).not.toContain(field);
    }
    expect(hasForbiddenField(card)).toBe(false);
    expect(card.author).toEqual({ slug: 'a', displayName: 'A', fictional: true });
  });

  it('drops forbidden fields from a profile and its cards', () => {
    const profile = toPublicProfileProjection({
      slug: 'a',
      displayName: 'A',
      shortBio: 'bio',
      discoverable: true,
      email: 'a@b.co',
      itineraries: [dirtyRow],
    });
    expect(hasForbiddenField(profile)).toBe(false);
    expect(profile.itineraries).toHaveLength(1);
    expect(Object.keys(profile)).not.toContain('email');
  });

  it('hides non-ok moderation states from public surfaces', () => {
    const visible = visiblePublicCards([
      { moderationStatus: 'ok' as const },
      { moderationStatus: 'removed' as const },
      { moderationStatus: 'under_review' as const },
    ]);
    expect(visible).toHaveLength(1);
  });

  it('discover fixtures carry no forbidden fields', () => {
    expect(hasForbiddenField(MOCK_CARDS)).toBe(false);
    expect(DISCOVER_ROWS.map(r => r.id)).toEqual(['taai', 'featured', 'trending']);
    expect(DISCOVER_ROWS.find(r => r.id === 'trending')!.cards.length).toBeGreaterThan(0);
  });
});

describe('clone date calculations', () => {
  const source = getMockItineraryDetail(MOCK_CARDS[0].publicSlug)!;

  it('preserves relative day spacing including gaps', () => {
    const gapped = {
      ...source,
      days: [
        { ...source.days[0], day: 1 },
        { ...source.days[1], day: 4 },
        { ...source.days[2], day: 5 },
      ],
    };
    const result = cloneItinerary(gapped, { startDate: '2026-07-01' });
    expect(result.days.map(d => d.offset)).toEqual([0, 3, 4]);
    expect(result.days.map(d => d.date)).toEqual(['2026-07-01', '2026-07-04', '2026-07-05']);
    expect(result.endDate).toBe('2026-07-05');
  });

  it('copies descriptive content but never pricing', () => {
    const result = cloneItinerary(source, { startDate: '2026-07-01' });
    const keys = new Set(result.days.flatMap(d => d.places.flatMap(p => Object.keys(p))));
    expect(keys.has('note')).toBe(true);
    expect(keys.has('priceApprox')).toBe(false);
    expect(keys.has('currency')).toBe(false);
    expect(result.requiresFreshPricing).toBe(true);
  });

  it('handles a month boundary', () => {
    const result = cloneItinerary(source, { startDate: '2026-01-30' });
    expect(result.days[2].date).toBe('2026-02-01');
  });
});

describe('free tier limits', () => {
  it('recommends three active trips and lists what counts', () => {
    expect(FREE_TIER_POLICY.limit).toBe(3);
    expect(FREE_ACTIVE_ITINERARY_LIMIT).toBe(3);
    expect(FREE_TIER_POLICY.excluded).toContain('archived trips');
    expect(FREE_TIER_POLICY.excluded).toContain('deleted trips');
  });

  it('frees a slot when a trip is archived', () => {
    const before = evaluateSlots([{ lifecycle: 'active' }, { lifecycle: 'active' }, { lifecycle: 'active' }]);
    expect(before.ok).toBe(false);
    const after = evaluateSlots([{ lifecycle: 'active' }, { lifecycle: 'active' }, { lifecycle: 'archived' }]);
    expect(after.ok).toBe(true);
    expect(after.used).toBe(2);
  });

  it('offers cleanup and upgrade actions at the limit', () => {
    expect(LIMIT_REACHED_ACTIONS.map(a => a.id)).toEqual(['archive', 'upgrade']);
    expect(LIMIT_REACHED_ACTIONS.find(a => a.id === 'upgrade')!.to).toBe('/subscription');
  });
});
