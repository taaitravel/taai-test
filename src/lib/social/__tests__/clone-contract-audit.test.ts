/**
 * Adversarial audit simulation for the (UNAPPLIED) social cloning contract.
 * Nothing here touches the database. It mirrors the SQL in
 * supabase/schema-proposals/social-clone-transaction.sql and its companion
 * proposal tests (social-clone-transaction.test.sql).
 */

import { describe, expect, it } from 'vitest';
import {
  CLONE_RPC_READY,
  CloneTransactionSimulator,
  type SlotRow,
} from '../clone-transaction';
import { INVITATION_CONTRACT_READY } from '../invitation-contract';
import { SLOT_RPC_READY, evaluateSlots } from '../active-slots';
import { countConsumedSlots, effectiveLifecycleState, isSlotConsuming } from '../lifecycle';
import { PUBLIC_CARD_FIELDS } from '../projections';
import { DISCOVER_ROWS, getMockItineraryDetail } from '../mock-discover';

const readProposal = async (): Promise<string> => {
  const fs = await import('node:fs/promises');
  return fs.readFile('supabase/schema-proposals/social-clone-transaction.sql', 'utf8');
};

const OWNER = 'user-a';
const source = getMockItineraryDetail(DISCOVER_ROWS[0].publicSlug)!;

const rows = (n: number): SlotRow[] =>
  Array.from({ length: n }, (_, i) => ({
    id: `own-${i}`,
    ownerId: OWNER,
    lifecycle: 'active' as const,
  }));

describe('readiness flags stay off', () => {
  it('keeps every write path disabled', () => {
    expect(CLONE_RPC_READY).toBe(false);
    expect(INVITATION_CONTRACT_READY).toBe(false);
    expect(SLOT_RPC_READY).toBe(false);
  });
});

describe('1 + 2. every slot-consuming path serialises on the same per-user lock', () => {
  it('two concurrent direct creates cannot both take the final slot', async () => {
    const sim = new CloneTransactionSimulator(rows(2));
    const results = await Promise.all([
      sim.createDirect(OWNER),
      sim.createDirect(OWNER),
    ]);
    expect(results.filter(r => r.ok)).toHaveLength(1);
    expect(results.filter(r => r.reason === 'limit_reached')).toHaveLength(1);
    expect(sim.snapshot().filter(r => r.ownerId === OWNER)).toHaveLength(3);
  });

  it('a direct create racing the clone RPC yields exactly one winner', async () => {
    const sim = new CloneTransactionSimulator(rows(2));
    const results = await Promise.all([
      sim.createDirect(OWNER),
      sim.clone(OWNER, source, { startDate: '2027-04-01' }),
    ]);
    expect(results.filter(r => r.ok)).toHaveLength(1);
    expect(sim.snapshot()).toHaveLength(3);
  });

  it('different users never block each other', async () => {
    const sim = new CloneTransactionSimulator(rows(2));
    const [mine, theirs] = await Promise.all([
      sim.createDirect(OWNER),
      sim.createDirect('user-b'),
    ]);
    expect(mine.ok).toBe(true);
    expect(theirs.ok).toBe(true);
  });

  it('the proposal uses one shared lock key helper on insert, update and clone', async () => {
    const sql = await readProposal();
    const locks = sql.match(/pg_advisory_xact_lock\(public\.itinerary_slot_lock_key\(/g) ?? [];
    expect(locks.length).toBe(3); // clone RPC + insert trigger + update trigger
    expect(sql).not.toMatch(/pg_advisory_xact_lock\(hashtext/);
  });

  it('does not double count the proposed row: 2 used still allows one insert', () => {
    expect(evaluateSlots(rows(2).map(r => ({ lifecycle: r.lifecycle }))).ok).toBe(true);
    expect(evaluateSlots(rows(3).map(r => ({ lifecycle: r.lifecycle }))).ok).toBe(false);
  });

  it('closes the state-escalation bypass with an update trigger', async () => {
    const sql = await readProposal();
    expect(sql).toMatch(/before update on public\.itinerary/);
    expect(sql).toMatch(/i\.id <> new\.id/); // row under update excluded from count
    expect(sql).toMatch(/OWNER_IMMUTABLE/);
  });
});

describe('3. expired active trips follow one authoritative rule', () => {
  const today = '2026-09-05';

  it('treats an active trip whose end date passed as past', () => {
    expect(effectiveLifecycleState('active', '2026-08-01', today)).toBe('past');
    expect(effectiveLifecycleState('active', '2026-09-05', today)).toBe('active');
    expect(effectiveLifecycleState('draft', '2020-01-01', today)).toBe('draft');
  });

  it('frees the slot for expired active trips', () => {
    const expired = [
      { lifecycle: 'active' as const, endDate: '2026-01-01' },
      { lifecycle: 'active' as const, endDate: '2026-02-01' },
      { lifecycle: 'active' as const, endDate: '2026-03-01' },
    ];
    expect(countConsumedSlots(expired, today)).toBe(0);
    expect(evaluateSlots(expired, 3, today).ok).toBe(true);
  });

  it('still counts trips that have not ended and never counts collaborations', () => {
    expect(isSlotConsuming('active', true, '2026-12-01', today)).toBe(true);
    expect(isSlotConsuming('active', false, '2026-12-01', today)).toBe(false);
  });

  it('mirrors the database rule in SQL', async () => {
    const sql = await readProposal();
    expect(sql).toMatch(/itinerary_effective_state/);
    expect(sql).toMatch(/_end_date is null or _end_date >= current_date/);
    expect(sql).toMatch(/lifecycle_consumes_slot\(i\.lifecycle_state, i\.end_date\)/);
  });
});

describe('4. base-table RLS keeps itineraries owner-only', () => {
  it('grants nothing to anon and scopes every policy to auth.uid()', async () => {
    const sql = await readProposal();
    expect(sql).toMatch(/revoke all on public\.itinerary from anon/);
    expect(sql).toMatch(/force row level security/);
    expect(sql).toMatch(/using \(user_id = auth\.uid\(\)\)/);
    expect(sql).toMatch(/with check \(user_id = auth\.uid\(\)\)/);
    // no anon/authenticated SELECT policy on the base table beyond ownership
    expect(sql).not.toMatch(/on public\.itinerary for select to anon/);
  });
});

describe('5. public projection tables are read-only for clients', () => {
  it('grants select only and revokes writes', async () => {
    const sql = await readProposal();
    for (const table of ['itinerary_public_card', 'itinerary_public_day']) {
      expect(sql).toMatch(new RegExp(`grant select on public\\.${table}`));
      expect(sql).toMatch(new RegExp(`revoke insert, update, delete on public\\.${table}`));
      expect(sql).not.toMatch(new RegExp(`create policy[^;]+on public\\.${table} for (insert|update|delete)`));
    }
    expect(sql).toMatch(/revoke all on sequence public\.itinerary_public_day_id_seq/);
  });
});

describe('6. clone_public_itinerary is hardened', () => {
  it('requires auth, pins search_path, has no owner parameter and is authenticated-only', async () => {
    const sql = await readProposal();
    expect(sql).toMatch(/clone_public_itinerary\(\s*\n?\s*_public_slug text,\s*\n?\s*_start_date\s+date\s*\n?\)/);
    expect(sql).not.toMatch(/clone_public_itinerary\([^)]*_owner/);
    expect(sql).toMatch(/AUTH_REQUIRED/);
    expect(sql).toMatch(/revoke all on function public\.clone_public_itinerary\(text, date\) from public, anon/);
    expect(sql).toMatch(/grant execute on function public\.clone_public_itinerary\(text, date\) to authenticated/);
    expect(sql).toMatch(/returns bigint/); // no sensitive source fields returned
  });

  it('rejects private, unlisted, unpublished and nonexistent sources', async () => {
    const sql = await readProposal();
    const guard = sql.slice(sql.indexOf('select * into v_card'));
    expect(guard).toMatch(/listing_status = 'listed'/);
    expect(guard).toMatch(/moderation_status = 'ok'/);
    expect(guard).toMatch(/published_at is not null/);
    expect(guard).toMatch(/unpublished_at is null/);
    expect(guard).toMatch(/SOURCE_NOT_AVAILABLE/);
  });

  it('pins search_path to empty on every proposal function', async () => {
    const sql = await readProposal();
    const definitions = sql.match(/create or replace function public\.[a-z_]+/g) ?? [];
    const pinned = sql.match(/set search_path = ''/g) ?? [];
    expect(definitions.length).toBeGreaterThan(8);
    expect(pinned.length).toBe(definitions.length);
    expect(sql).not.toMatch(/set search_path = public/);
  });

  it('clones as the caller, private, with no source identity', async () => {
    const sim = new CloneTransactionSimulator([]);
    const result = await sim.clone(OWNER, source, { startDate: '2027-04-01' });
    expect(result.ok).toBe(true);
    expect(result.itinerary?.ownerId).toBe(OWNER);
    expect(result.itinerary?.visibility).toBe('private');
    expect(JSON.stringify(result.itinerary)).not.toMatch(/user_id|ownerEmail|bookings|payment/i);
  });

  it('refuses unauthenticated and rejects a caller-supplied owner', async () => {
    const sim = new CloneTransactionSimulator([]);
    expect((await sim.clone(null, source, { startDate: '2027-04-01' })).reason).toBe('unauthenticated');
    const injected = await sim.clone(OWNER, source, { startDate: '2027-04-01' });
    expect(injected.itinerary?.ownerId).toBe(OWNER);
    expect(sim.snapshot().every(r => r.ownerId === OWNER)).toBe(true);
  });
});

describe('7. share tokens: hashes only, expiry and revocation required', () => {
  it('stores hashes, requires expiry, and never returns the hash', async () => {
    const sql = await readProposal();
    expect(sql).toMatch(/token_hash\s+text not null unique/);
    expect(sql).toMatch(/expires_at\s+timestamptz not null/);
    expect(sql).toMatch(/revoked_at/);
    expect(sql).toMatch(/revoke all on public\.itinerary_share_token from anon, authenticated/);
    const fn = sql.slice(sql.indexOf('function public.resolve_share_token'));
    expect(fn).toMatch(/returns text/);
    expect(fn).toMatch(/t\.revoked_at is null/);
    expect(fn).toMatch(/t\.expires_at > pg_catalog\.now\(\)/);
    expect(fn).not.toMatch(/raise notice|raise log/i); // no raw-token logging
  });

  it('unpublishing revokes live tokens', async () => {
    const sql = await readProposal();
    const fn = sql.slice(sql.indexOf('function public.unpublish_itinerary_projection'));
    expect(fn).toMatch(/update public\.itinerary_share_token[\s\S]*set revoked_at/);
  });
});

describe('8. projection lifecycle leaves no stale public record', () => {
  it('defines publish, refresh, unpublish and cascading delete', async () => {
    const sql = await readProposal();
    expect(sql).toMatch(/function public\.publish_itinerary_projection/);
    expect(sql).toMatch(/refreshed_at/);
    expect(sql).toMatch(/function public\.unpublish_itinerary_projection/);
    expect(sql).toMatch(/trg_sync_projection_on_visibility_change/);
    expect((sql.match(/on delete cascade/g) ?? []).length).toBeGreaterThanOrEqual(3);
  });

  it('keeps the public card allow-list free of private fields', () => {
    for (const forbidden of ['user_id', 'email', 'bookings', 'payments', 'attendees']) {
      expect(PUBLIC_CARD_FIELDS as readonly string[]).not.toContain(forbidden);
    }
  });
});
