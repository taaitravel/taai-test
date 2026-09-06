/**
 * Social itinerary foundation — client contracts.
 * Everything here is synthetic/mock until the schema proposal in
 * supabase/schema-proposals/social-itinerary-foundation.sql is approved.
 */

export type ItineraryVisibility = 'private' | 'unlisted' | 'public';
export type ModerationState = 'ok' | 'flagged' | 'under_review' | 'unpublished' | 'removed';
export type ItineraryLifecycle = 'active' | 'archived' | 'past';

export type RegionGroup = 'A' | 'B' | 'C' | 'D' | 'F';

export const REGION_GROUP_LABELS: Record<RegionGroup, string> = {
  A: 'USA, Canada, Bahamas, Mexico & Central America',
  B: 'South America / LATAM',
  C: 'Europe & Middle East',
  D: 'Africa through Australia',
  F: 'Asia & remaining regions',
};

/**
 * Lightweight card projection. Discover and public profiles load ONLY this —
 * never full itinerary JSON, attendees, chats, bookings or provider payloads.
 */
export interface ItineraryCardProjection {
  id: string;
  publicSlug: string;
  title: string;
  summary: string;
  destinations: string[];
  dayCount: number;
  regionGroup: RegionGroup;
  coverGradient: string;
  /** Optional traveler-uploaded cover photo; falls back to the gradient. */
  coverImageUrl?: string | null;

  cloneCount: number;
  publishedAt: string;
  author: {
    slug: string;
    displayName: string;
    /** Fictional creators only — never a real identifiable person. */
    fictional: true;
  };
  curatedBy: 'taai' | 'community';
  moderationStatus: ModerationState;
}

/** Public profile projection — no email, phone, address or private preferences. */
export interface PublicProfileProjection {
  slug: string;
  displayName: string;
  shortBio: string;
  discoverable: boolean;
  fictional: true;
  itineraries: ItineraryCardProjection[];
}

export type PublicPlaceKind = 'stay' | 'activity' | 'dining' | 'transit';

/** A curated place reference — never a booking, never a held price. */
export interface PublicItineraryPlace {
  name: string;
  kind: PublicPlaceKind;
  note: string;
  /** Local time suggestion, 24h "HH:mm". */
  time?: string;
  /** Neighbourhood / area label. */
  area?: string;
  /** Indicative reference amount only; real pricing is searched fresh. */
  priceApprox?: number;
  currency?: string;
}

export interface PublicItineraryDay {
  day: number;
  /** Suggested date for the sample window (shifts on clone). */
  date: string;
  city: string;
  places: PublicItineraryPlace[];
}

/** A public itinerary detail view — planning structure only. */
export interface PublicItineraryDetail extends ItineraryCardProjection {
  suggestedStartDate: string;
  suggestedEndDate: string;
  currency: string;
  travelStyleTags: string[];
  /** Indicative reference spend grouped by item type. */
  budget: Record<PublicPlaceKind, number>;
  days: PublicItineraryDay[];
  attribution: string;
}


export const ACTIVE_LIMIT_MESSAGE =
  'You currently have three active trips. Archive one to start another, or upgrade for additional active itineraries. Your saved inspiration and past trips will remain available.';

export const FREE_ACTIVE_ITINERARY_LIMIT = 3;
