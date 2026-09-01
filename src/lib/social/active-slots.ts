/**
 * Free active-itinerary limit — client mirror of the SERVER rule.
 *
 * The authoritative check lives in the (unapplied) migration:
 * `public.reserve_active_itinerary_slot()` plus a BEFORE INSERT trigger, both
 * taking a per-user transaction advisory lock so concurrent clone/create
 * requests cannot both pass. This module is presentation only and fails closed
 * while the migration is unapplied.
 */

import { ACTIVE_LIMIT_MESSAGE, FREE_ACTIVE_ITINERARY_LIMIT } from './types';

export const SLOT_RPC_READY = false; // flip on only after the migration is applied

export interface SlotCheck {
  ok: boolean;
  used: number;
  allowed: number;
  message?: string;
}

/** Pure helper: bookmarks, archived and past itineraries never count. */
export const evaluateSlots = (
  itineraries: Array<{ lifecycle?: 'active' | 'archived' | 'past' }>,
  allowed = FREE_ACTIVE_ITINERARY_LIMIT
): SlotCheck => {
  const used = itineraries.filter(i => (i.lifecycle ?? 'active') === 'active').length;
  return used >= allowed
    ? { ok: false, used, allowed, message: ACTIVE_LIMIT_MESSAGE }
    : { ok: true, used, allowed };
};

export { ACTIVE_LIMIT_MESSAGE, FREE_ACTIVE_ITINERARY_LIMIT };
