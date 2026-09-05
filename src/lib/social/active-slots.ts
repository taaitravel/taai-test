/**
 * Free active-itinerary limit — client mirror of the SERVER rule.
 *
 * The authoritative check lives in the (unapplied) proposal
 * supabase/schema-proposals/social-clone-transaction.sql:
 * `public.reserve_active_itinerary_slot()` plus a BEFORE INSERT trigger and
 * `public.clone_public_itinerary()`, all taking a per-user transaction advisory
 * lock so concurrent clone/create requests cannot both pass. This module is
 * presentation only and fails closed while the proposal is unapplied.
 */

import { ACTIVE_LIMIT_MESSAGE, FREE_ACTIVE_ITINERARY_LIMIT } from './types';
import { countConsumedSlots, LIFECYCLE_RULES, type ItineraryLifecycleState } from './lifecycle';

export const SLOT_RPC_READY = false; // flip on only after the proposal is applied

export interface SlotCheck {
  ok: boolean;
  used: number;
  allowed: number;
  message?: string;
}

/**
 * Free-tier policy (recommended v0.1):
 * - initial limit: 3 slot-consuming itineraries;
 * - counts toward the limit: itineraries the traveler OWNS whose lifecycle is
 *   'draft' or 'active', including cloned ("Add to your trips") copies;
 * - never counts: past, archived, deleted trips, saved inspiration and trips
 *   owned by someone else where the traveler is only a collaborator;
 * - archiving or deleting a trip frees the slot immediately;
 * - archived and past trips stay readable, they just cannot be edited as active.
 */
export const FREE_TIER_POLICY = {
  limit: FREE_ACTIVE_ITINERARY_LIMIT,
  counts: ['draft owned itineraries', 'active owned itineraries', 'cloned itineraries while active'],
  excluded: [
    'archived trips',
    'past trips',
    'deleted trips',
    'saved inspiration',
    'trips owned by someone else',
  ],
  frees_slot: ['archive', 'delete', 'trip end date passes'],
  rules: LIFECYCLE_RULES,
} as const;

/** Actions offered when the limit is reached. Upgrade is not live yet. */
export const LIMIT_REACHED_ACTIONS = [
  { id: 'archive', label: 'Archive a trip', to: '/my-itineraries', disabled: false },
  { id: 'upgrade', label: 'Upgrade plan — coming soon', to: '/subscription', disabled: true },
] as const;

/** Pure helper: bookmarks, archived, past and non-owned itineraries never count. */
export const evaluateSlots = (
  itineraries: Array<{ lifecycle?: ItineraryLifecycleState; owned?: boolean }>,
  allowed = FREE_ACTIVE_ITINERARY_LIMIT
): SlotCheck => {
  const used = countConsumedSlots(itineraries);
  return used >= allowed
    ? { ok: false, used, allowed, message: ACTIVE_LIMIT_MESSAGE }
    : { ok: true, used, allowed };
};

export { ACTIVE_LIMIT_MESSAGE, FREE_ACTIVE_ITINERARY_LIMIT };
