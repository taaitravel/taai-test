import { describe, expect, it } from 'vitest';
import { CloneTransactionSimulator, CLONE_RPC_READY } from '../clone-transaction';
import {
  LIFECYCLE_RULES,
  SLOT_CONSUMING_STATES,
  countConsumedSlots,
  isSlotConsuming,
} from '../lifecycle';
import { evaluateSlots, LIMIT_REACHED_ACTIONS } from '../active-slots';
import { cloneItinerary } from '../clone';
import { toPublicCardProjection, hasForbiddenField } from '../projections';
import { getMockItineraryDetail, MOCK_CARDS } from '../mock-discover';
import {
  INVITATION_CONTRACT_READY,
  INVITATION_AUTHORIZATION_RULES,
  INVITATION_FORBIDDEN_FIELDS,
} from '../invitation-contract';

const source = getMockItineraryDetail(MOCK_CARDS[0].publicSlug)!;

describe('lifecycle slot rule', () => {
  it('counts only owned draft and active trips', () => {
    expect(SLOT_CONSUMING_STATES.sort()).toEqual(['active', 'draft']);
    expect(LIFECYCLE_RULES).toHaveLength(6);
    expect(isSlotConsuming('archived')).toBe(false);
    expect(isSlotConsuming('past')).toBe(false);
    expect(isSlotConsuming('deleted')).toBe(false);
    expect(isSlotConsuming('saved_inspiration')).toBe(false);
    expect(isSlotConsuming('active', false)).toBe(false); // collaborator, not owner
  });

  it('archived and past trips free the slot', () => {
    const used = countConsumedSlots([
      { lifecycle: 'active' },
      { lifecycle: 'draft' },
      { lifecycle: 'archived' },
      { lifecycle: 'past' },
      { lifecycle: 'saved_inspiration' },
    ]);
    expect(used).toBe(2);
    expect(evaluateSlots([{ lifecycle: 'active' }, { lifecycle: 'past' }, { lifecycle: 'archived' }]).ok).toBe(true);
  });
});

describe('transactional clone', () => {
  it('stays disabled until the SQL proposal is applied', () => {
    expect(CLONE_RPC_READY).toBe(false);
  });

  it('rejects unauthenticated requests', async () => {
    const sim = new CloneTransactionSimulator();
    const out = await sim.clone(null, source, { startDate: '2026-07-01' });
    expect(out.ok).toBe(false);
    expect(out.reason).toBe('unauthenticated');
  });

  it('lets only one of two simultaneous requests take the final free slot', async () => {
    const sim = new CloneTransactionSimulator([
      { id: 'a', ownerId: 'u1', lifecycle: 'active' },
      { id: 'b', ownerId: 'u1', lifecycle: 'active' },
    ]);
    const [first, second] = await Promise.all([
      sim.clone('u1', source, { startDate: '2026-07-01' }),
      sim.clone('u1', source, { startDate: '2026-08-01' }),
    ]);
    const results = [first, second];
    expect(results.filter(r => r.ok)).toHaveLength(1);
    const blocked = results.find(r => !r.ok)!;
    expect(blocked.reason).toBe('limit_reached');
    expect(sim.snapshot().filter(r => r.ownerId === 'u1')).toHaveLength(3);
  });

  it('rolls back completely when the clone fails', async () => {
    const sim = new CloneTransactionSimulator([{ id: 'a', ownerId: 'u1', lifecycle: 'active' }]);
    const before = sim.snapshot();
    const out = await sim.clone('u1', source, { startDate: '2026-07-01' }, {
      onInsert: () => {
        throw new Error('day insert failed');
      },
    });
    expect(out.ok).toBe(false);
    expect(out.reason).toBe('clone_failed');
    expect(sim.snapshot()).toEqual(before);
  });

  it('creates the clone private and owned by the requester', async () => {
    const sim = new CloneTransactionSimulator();
    const out = await sim.clone('u9', source, { startDate: '2026-07-01' });
    expect(out.ok).toBe(true);
    expect(out.itinerary!.ownerId).toBe('u9');
    expect(out.itinerary!.visibility).toBe('private');
    expect(out.itinerary!.lifecycle).toBe('active');
    expect(out.itinerary!.requiresFreshPricing).toBe(true);
  });
});

describe('date shifting edge cases', () => {
  const gapped = (days: number[]) => ({
    ...source,
    days: days.map((day, i) => ({ ...source.days[i % source.days.length], day })),
  });

  it('crosses a month boundary', () => {
    const r = cloneItinerary(gapped([1, 2, 3]), { startDate: '2026-01-30' });
    expect(r.days.map(d => d.date)).toEqual(['2026-01-30', '2026-01-31', '2026-02-01']);
  });

  it('crosses a year boundary', () => {
    const r = cloneItinerary(gapped([1, 2, 3]), { startDate: '2026-12-30' });
    expect(r.days.map(d => d.date)).toEqual(['2026-12-30', '2026-12-31', '2027-01-01']);
    expect(r.endDate).toBe('2027-01-01');
  });

  it('handles a leap day and a non-leap February', () => {
    expect(cloneItinerary(gapped([1, 2, 3]), { startDate: '2028-02-28' }).days.map(d => d.date)).toEqual([
      '2028-02-28',
      '2028-02-29',
      '2028-03-01',
    ]);
    expect(cloneItinerary(gapped([1, 2, 3]), { startDate: '2026-02-27' }).days.map(d => d.date)).toEqual([
      '2026-02-27',
      '2026-02-28',
      '2026-03-01',
    ]);
  });

  it('preserves gaps across a month boundary', () => {
    const r = cloneItinerary(gapped([1, 4, 6]), { startDate: '2026-03-30' });
    expect(r.days.map(d => d.offset)).toEqual([0, 3, 5]);
    expect(r.days.map(d => d.date)).toEqual(['2026-03-30', '2026-04-02', '2026-04-04']);
  });
});

describe('field leakage', () => {
  it('never copies excluded source data into a clone', () => {
    const r = cloneItinerary(source, { startDate: '2026-07-01' });
    for (const forbidden of [
      'bookings',
      'confirmations',
      'payments',
      'travelers',
      'group_members',
      'private_notes',
      'chats',
      'provider_offers',
      'historical_prices',
      'ownerId',
      'user_id',
      'collaborators',
      'attendees',
      'invitations',
    ]) {
      expect(Object.keys(r)).not.toContain(forbidden);
    }
    expect(hasForbiddenField(r)).toBe(false);
    const placeKeys = new Set(r.days.flatMap(d => d.places.flatMap(p => Object.keys(p))));
    expect(placeKeys.has('priceApprox')).toBe(false);
  });

  it('public card projection drops private ownership and contact data', () => {
    const card = toPublicCardProjection({
      ...MOCK_CARDS[0],
      user_id: 'uuid',
      email: 'a@b.co',
      attendees: [{ email: 'x@y.co' }],
      bookings: [{ id: 1 }],
      private_notes: 'secret',
    });
    expect(hasForbiddenField(card)).toBe(false);
    expect(Object.keys(card)).not.toContain('private_notes');
  });
});

describe('invitation contract and upgrade gating', () => {
  it('is defined but not implemented', () => {
    expect(INVITATION_CONTRACT_READY).toBe(false);
    expect(INVITATION_AUTHORIZATION_RULES.length).toBeGreaterThanOrEqual(6);
    expect(INVITATION_FORBIDDEN_FIELDS).toContain('source_collaborators');
  });

  it('keeps Upgrade plan disabled and coming soon', () => {
    const upgrade = LIMIT_REACHED_ACTIONS.find(a => a.id === 'upgrade')!;
    expect(upgrade.disabled).toBe(true);
    expect(upgrade.label).toMatch(/coming soon/i);
  });
});
