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

/**
 * Free-tier policy (recommended v0.1):
 * - initial limit: 3 ACTIVE itineraries;
 * - counts toward the limit: itineraries the traveler owns with lifecycle
 *   'active', including cloned ("Add to your trips") copies;
 * - never counts: archived trips, past trips, deleted trips and saved
 *   inspiration from Discover;
 * - archiving or deleting an active trip frees the slot immediately;
 * - archived and past trips stay readable, they just cannot be edited as active.
 */
export const FREE_TIER_POLICY = {
  limit: FREE_ACTIVE_ITINERARY_LIMIT,
  counts: ['active owned itineraries', 'cloned itineraries while active'],
  excluded: ['archived trips', 'past trips', 'deleted trips', 'saved inspiration'],
  frees_slot: ['archive', 'delete'],
} as const;

/** Actions offered when the limit is reached. */
export const LIMIT_REACHED_ACTIONS = [
  { id: 'archive', label: 'Archive a trip', to: '/my-itineraries' },
  { id: 'upgrade', label: 'Upgrade plan', to: '/subscription' },
] as const;

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
