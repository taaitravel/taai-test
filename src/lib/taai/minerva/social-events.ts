/**
 * taai.Minerva canonical social/discovery events.
 * These are behaviour/intent events — never bookings, payments or conversions.
 * All events emitted from the synthetic Discover fixtures are tagged synthetic.
 */

export const MINERVA_SOCIAL_EVENT_IDS = {
  publicProfileViewed: 'taai.minerva.public_profile_viewed',
  publicItineraryViewed: 'taai.minerva.public_itinerary_viewed',
  inspirationSaved: 'taai.minerva.itinerary_inspiration_saved',
  cloneStarted: 'taai.minerva.itinerary_clone_started',
  cloned: 'taai.minerva.itinerary_cloned',
  cloneDatesSelected: 'taai.minerva.clone_dates_selected',
  cloneInvitationStarted: 'taai.minerva.clone_invitation_started',
  activeLimitReached: 'taai.minerva.active_itinerary_limit_reached',
} as const;

export type MinervaSocialEventId =
  (typeof MINERVA_SOCIAL_EVENT_IDS)[keyof typeof MINERVA_SOCIAL_EVENT_IDS];

export interface MinervaSocialEvent {
  eventId: MinervaSocialEventId;
  /** Deduplication key — identical intent in the same context emits once. */
  dedupeKey: string;
  occurredAt: string;
  synthetic: boolean;
  surface: 'discover' | 'public_profile' | 'public_itinerary' | 'clone_flow';
  agent: 'miles';
  /** No PII: slugs and ids only. */
  subject: { itinerarySlug?: string; profileSlug?: string; dayCount?: number };
  detail?: Record<string, string | number | boolean | null>;
}

const emitted = new Set<string>();

export const __resetSocialEventDedupe = () => emitted.clear();

export const buildSocialEvent = (
  eventId: MinervaSocialEventId,
  surface: MinervaSocialEvent['surface'],
  subject: MinervaSocialEvent['subject'],
  detail?: MinervaSocialEvent['detail'],
  synthetic = true
): MinervaSocialEvent => ({
  eventId,
  dedupeKey: [eventId, surface, subject.itinerarySlug ?? '', subject.profileSlug ?? ''].join(':'),
  occurredAt: new Date().toISOString(),
  synthetic,
  surface,
  agent: 'miles',
  subject,
  detail,
});

/**
 * Records the event locally (console in dev) and returns it when it was not a
 * duplicate. No network calls — the Minerva sink is not wired in this slice.
 */
export const emitSocialEvent = (event: MinervaSocialEvent): MinervaSocialEvent | null => {
  if (emitted.has(event.dedupeKey)) return null;
  emitted.add(event.dedupeKey);
  if (import.meta.env?.DEV) {
    // eslint-disable-next-line no-console
    console.debug('[minerva]', event.eventId, event.subject);
  }
  return event;
};
