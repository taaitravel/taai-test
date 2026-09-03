/**
 * Lightweight dashboard/list projection.
 *
 * Deliberately excludes attendees, flights, hotels, activities, reservations,
 * provider payloads (expedia_data) and any contact PII (email, cell/phone).
 * Full itinerary content is fetched only after an itinerary is opened
 * (see useItineraryData / useAuthenticatedItineraryData).
 */
export interface DashboardItinerarySummary {
  /** Identifiers */
  id: number;
  itin_id: string | null;
  /** Title + short description */
  itin_name: string;
  itin_desc: string | null;
  /** Dates */
  itin_date_start: string | null;
  itin_date_end: string | null;
  /** Locations */
  itin_locations: string[];
  itin_map_locations: Array<{ city?: string; lat?: number; lng?: number }>;
  /** Cover reference only — not the full media payload */
  cover_image: string | null;
  /** Budget summary */
  budget: number;
  spending: number;
  budget_rate: number | null;
  b_efficiency_rate: number | null;
  /** Traveler count */
  planned_traveler_count: number | null;
  /** Lifecycle */
  user_type: string | null;
  /** Timestamps */
  created_at: string | null;
}

/** Lightweight profile projection for dashboard chrome — no email, no cell/phone. */
export interface DashboardProfileSummary {
  userid: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  user_type: string | null;
  date_format: string | null;
  currency: string | null;
  theme_preference: string | null;
  countries_visited: unknown;
  flight_freq: unknown;
  avg_spending: number | null;
  taai_rating: number | null;
  created_at: string | null;
}
