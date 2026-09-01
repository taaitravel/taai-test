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

/** A public itinerary detail view — planning structure only. */
export interface PublicItineraryDetail extends ItineraryCardProjection {
  days: Array<{
    day: number;
    city: string;
    /** Curated place references, not bookings. */
    places: Array<{ name: string; kind: 'stay' | 'activity' | 'dining' | 'transit'; note: string }>;
  }>;
  attribution: string;
}

export const ACTIVE_LIMIT_MESSAGE =
  'You currently have three active trips. Archive one to start another, or upgrade for additional active itineraries. Your saved inspiration and past trips will remain available.';

export const FREE_ACTIVE_ITINERARY_LIMIT = 3;
