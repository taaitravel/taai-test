/**
 * Privacy projections for social surfaces.
 *
 * Every public surface (Discover, another traveler's profile, a public
 * itinerary page) may ONLY read the fields produced here. Anything not listed
 * is dropped, including attendees, bookings, confirmations, payments, chats,
 * provider payloads, user IDs, email, phone and private notes.
 *
 * These are pure functions — no reads, no writes, no production data.
 */

import type {
  ItineraryCardProjection,
  ModerationState,
  PublicProfileProjection,
  RegionGroup,
} from './types';

/** Fields that must never leave the server for a public surface. */
export const FORBIDDEN_PUBLIC_FIELDS = [
  'attendees',
  'travelers',
  'group_members',
  'bookings',
  'confirmations',
  'payments',
  'payment_method',
  'chats',
  'private_notes',
  'provider_offers',
  'expedia_data',
  'user_id',
  'userid',
  'email',
  'cell',
  'phone',
  'address',
  'preferences',
] as const;

/** Allow-listed card fields. Used by tests and by the future SQL projection. */
export const PUBLIC_CARD_FIELDS = [
  'id',
  'publicSlug',
  'title',
  'summary',
  'destinations',
  'dayCount',
  'regionGroup',
  'coverGradient',
  'cloneCount',
  'publishedAt',
  'author',
  'curatedBy',
  'moderationStatus',
] as const;

export const PUBLIC_PROFILE_FIELDS = [
  'slug',
  'displayName',
  'shortBio',
  'discoverable',
  'fictional',
  'itineraries',
] as const;

const pick = <T extends object, K extends keyof T>(source: T, keys: readonly K[]): Pick<T, K> => {
  const out = {} as Pick<T, K>;
  for (const key of keys) {
    if (source[key] !== undefined) out[key] = source[key];
  }
  return out;
};

/** Strips any record down to the public card allow-list. */
export const toPublicCardProjection = (row: Record<string, unknown>): ItineraryCardProjection => {
  const author = (row.author ?? {}) as Record<string, unknown>;
  const card = pick(row as unknown as ItineraryCardProjection, PUBLIC_CARD_FIELDS);
  return {
    ...card,
    destinations: Array.isArray(card.destinations) ? [...card.destinations] : [],
    regionGroup: (card.regionGroup ?? 'C') as RegionGroup,
    moderationStatus: (card.moderationStatus ?? 'ok') as ModerationState,
    author: {
      slug: String(author.slug ?? ''),
      displayName: String(author.displayName ?? ''),
      fictional: true,
    },
  };
};

/** Strips a profile record down to the public profile allow-list. */
export const toPublicProfileProjection = (
  row: Record<string, unknown>
): PublicProfileProjection => {
  const profile = pick(row as unknown as PublicProfileProjection, PUBLIC_PROFILE_FIELDS);
  const cards = Array.isArray(row.itineraries) ? (row.itineraries as Record<string, unknown>[]) : [];
  return {
    ...profile,
    slug: String(profile.slug ?? ''),
    displayName: String(profile.displayName ?? ''),
    shortBio: String(profile.shortBio ?? ''),
    discoverable: profile.discoverable !== false,
    fictional: true,
    itineraries: cards.map(toPublicCardProjection),
  };
};

/** Only itineraries a viewer is allowed to see on someone else's profile. */
export const visiblePublicCards = <T extends { moderationStatus?: ModerationState }>(
  cards: T[]
): T[] => cards.filter(card => (card.moderationStatus ?? 'ok') === 'ok');

/** True when a projection accidentally carries a forbidden field. */
export const hasForbiddenField = (value: unknown): boolean =>
  FORBIDDEN_PUBLIC_FIELDS.some(field =>
    new RegExp(`"${field}"\\s*:`).test(JSON.stringify(value ?? {}))
  );
