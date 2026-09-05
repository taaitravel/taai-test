/**
 * Authoritative itinerary lifecycle states and the free active-slot rule.
 *
 * This is the single source of truth mirrored by the (unapplied) SQL in
 * supabase/schema-proposals/social-clone-transaction.sql. Any change here MUST
 * be mirrored there — the server check is authoritative at runtime.
 */

export const ITINERARY_LIFECYCLE_STATES = [
  'draft',
  'active',
  'past',
  'archived',
  'deleted',
  'saved_inspiration',
] as const;

export type ItineraryLifecycleState = (typeof ITINERARY_LIFECYCLE_STATES)[number];

export interface LifecycleRule {
  state: ItineraryLifecycleState;
  /** Does a trip in this state occupy one of the three free active slots? */
  consumesSlot: boolean;
  description: string;
}

/**
 * Exact rule: a trip consumes a free slot only when the requesting user OWNS it
 * and its lifecycle is 'draft' or 'active'. Nothing else ever counts.
 */
export const LIFECYCLE_RULES: readonly LifecycleRule[] = [
  {
    state: 'draft',
    consumesSlot: true,
    description: 'Created but not finalised; still editable and occupies a working slot.',
  },
  {
    state: 'active',
    consumesSlot: true,
    description: 'Upcoming or in-progress owned trip, including clones from Discover.',
  },
  {
    state: 'past',
    consumesSlot: false,
    description: 'End date has passed; stays readable forever and frees its slot.',
  },
  {
    state: 'archived',
    consumesSlot: false,
    description: 'Manually archived by the owner; readable, not editable, frees the slot immediately.',
  },
  {
    state: 'deleted',
    consumesSlot: false,
    description: 'Soft-deleted; excluded from every surface and frees the slot immediately.',
  },
  {
    state: 'saved_inspiration',
    consumesSlot: false,
    description: 'Bookmarked Discover inspiration; never a trip of the traveler, never counted.',
  },
] as const;

const SLOT_STATES = new Set<ItineraryLifecycleState>(
  LIFECYCLE_RULES.filter(r => r.consumesSlot).map(r => r.state)
);

/** States that consume one of the free active slots. */
export const SLOT_CONSUMING_STATES = [...SLOT_STATES] as ItineraryLifecycleState[];

export const isSlotConsuming = (
  lifecycle: ItineraryLifecycleState | undefined,
  ownedByRequester = true
): boolean => ownedByRequester && SLOT_STATES.has(lifecycle ?? 'active');

/** Collaborated (non-owned) trips never consume the collaborator's slots. */
export const countConsumedSlots = (
  itineraries: Array<{ lifecycle?: ItineraryLifecycleState; owned?: boolean }>
): number =>
  itineraries.filter(i => isSlotConsuming(i.lifecycle, i.owned !== false)).length;
