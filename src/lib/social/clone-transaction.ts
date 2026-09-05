/**
 * Client mirror / simulator of the (UNAPPLIED) transactional clone function
 * public.clone_public_itinerary(). The write path is disabled: CLONE_RPC_READY
 * stays false until the SQL in
 * supabase/schema-proposals/social-clone-transaction.sql is approved and applied.
 *
 * The simulator exists so concurrency, rollback and ownership behaviour can be
 * tested locally without touching the database.
 */

import { cloneItinerary, type CloneResult } from './clone';
import { countConsumedSlots, type ItineraryLifecycleState } from './lifecycle';
import { FREE_ACTIVE_ITINERARY_LIMIT, ACTIVE_LIMIT_MESSAGE } from './types';

/** Never flip this on from the client. */
export const CLONE_RPC_READY = false;

export interface SlotRow {
  id: string;
  ownerId: string;
  lifecycle: ItineraryLifecycleState;
}

export interface CloneOutcome {
  ok: boolean;
  reason?: 'unauthenticated' | 'limit_reached' | 'clone_failed';
  message?: string;
  /** Present only on success. */
  itinerary?: CloneResult & { ownerId: string; visibility: 'private' };
}

/**
 * In-memory store standing in for the itinerary table plus the per-user
 * advisory lock the SQL takes. Serialising per owner is exactly what
 * pg_advisory_xact_lock(hashtext(owner_id)) guarantees.
 */
export class CloneTransactionSimulator {
  private rows: SlotRow[];
  private locks = new Set<string>();
  private queues = new Map<string, Array<() => void>>();

  constructor(rows: SlotRow[] = []) {
    this.rows = [...rows];
  }

  snapshot(): SlotRow[] {
    return [...this.rows];
  }

  private async lock(ownerId: string): Promise<void> {
    if (!this.locks.has(ownerId)) {
      this.locks.add(ownerId);
      return;
    }
    await new Promise<void>(resolve => {
      const queue = this.queues.get(ownerId) ?? [];
      queue.push(resolve);
      this.queues.set(ownerId, queue);
    });
  }

  private unlock(ownerId: string): void {
    const next = this.queues.get(ownerId)?.shift();
    if (next) next();
    else this.locks.delete(ownerId);
  }

  /**
   * Mirrors the SQL: authenticate → lock → count → insert → commit, with a full
   * rollback (no rows kept) whenever any step throws.
   */
  async clone(
    userId: string | null,
    source: Parameters<typeof cloneItinerary>[0],
    request: Parameters<typeof cloneItinerary>[1],
    hooks: { onInsert?: (row: SlotRow) => void } = {}
  ): Promise<CloneOutcome> {
    if (!userId) {
      return { ok: false, reason: 'unauthenticated', message: 'Sign in to save this trip.' };
    }

    await this.lock(userId);
    const before = this.snapshot();
    let inserted: SlotRow | null = null;
    try {
      const used = countConsumedSlots(
        this.rows.filter(r => r.ownerId === userId).map(r => ({ lifecycle: r.lifecycle }))
      );
      if (used >= FREE_ACTIVE_ITINERARY_LIMIT) {
        return { ok: false, reason: 'limit_reached', message: ACTIVE_LIMIT_MESSAGE };
      }

      const cloned = cloneItinerary(source, request);
      inserted = { id: `clone-${this.rows.length + 1}`, ownerId: userId, lifecycle: 'active' };
      this.rows.push(inserted);
      hooks.onInsert?.(inserted);

      return { ok: true, itinerary: { ...cloned, ownerId: userId, visibility: 'private' } };
    } catch (error) {
      // ROLLBACK: restore the exact pre-transaction snapshot.
      this.rows = before;
      return { ok: false, reason: 'clone_failed', message: (error as Error).message };
    } finally {
      this.unlock(userId);
    }
  }
}
