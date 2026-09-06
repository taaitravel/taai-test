/**
 * Bounded itinerary-context loader for AI chat (egress containment).
 *
 * Rules enforced here:
 * - ONE itinerary read per AI-chat invocation. Every internal stage reuses the
 *   same bounded snapshot.
 * - Explicit column allow-list. `select('*')` is never used, so raw provider
 *   JSON (`expedia_data`), payment data, provider response bodies and private
 *   profile fields can never leave the database.
 * - Hard caps on days, items per section and history messages.
 * - Free-form text is truncated at documented limits.
 * - The snapshot is never logged; only metadata counts are.
 *
 * This module is intentionally free of Deno globals so it can be unit tested
 * from the frontend test runner.
 */

/** Columns the AI is allowed to read. Never add provider/payment columns. */
export const AI_ITINERARY_COLUMNS = [
  'id',
  'itin_id',
  'itin_name',
  'itin_desc',
  'itin_date_start',
  'itin_date_end',
  'budget',
  'spending',
  'itin_locations',
  'planned_traveler_count',
  'userid',
  'flights',
  'hotels',
  'activities',
  'reservations',
].join(', ');

/** Columns forbidden in any AI-facing projection or response. */
export const AI_FORBIDDEN_FIELDS = [
  'expedia_data',
  'provider_response',
  'raw_response',
  'raw_offer',
  'raw_offers',
  'payment_intent',
  'payment_method',
  'stripe_customer_id',
  'stripe_session_id',
  'card_last4',
  'attendees',
  'email',
  'cell',
  'phone',
  'item_data',
] as const;

/** Documented caps. */
export const AI_CONTEXT_CAPS = {
  maxDays: 14,
  maxItemsPerSection: 20,
  maxHistoryMessages: 10,
  nameChars: 120,
  descriptionChars: 600,
  itemTextChars: 200,
  locations: 12,
} as const;

export const truncate = (value: unknown, max: number): string | null => {
  if (typeof value !== 'string') return value == null ? null : String(value).slice(0, max);
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
};

const num = (value: unknown): number | null => {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
};

type Row = Record<string, unknown>;

const pick = (item: Row, textFields: string[], numberFields: string[]): Row => {
  const out: Row = {};
  for (const f of textFields) {
    if (item[f] != null) out[f] = truncate(item[f], AI_CONTEXT_CAPS.itemTextChars);
  }
  for (const f of numberFields) {
    const v = num(item[f]);
    if (v != null) out[f] = v;
  }
  return out;
};

const SECTION_SHAPES: Record<string, { text: string[]; numeric: string[] }> = {
  flights: {
    text: ['airline', 'flight_number', 'from', 'to', 'departure', 'arrival', 'booking_status'],
    numeric: ['cost'],
  },
  hotels: {
    text: ['name', 'city', 'check_in', 'check_out', 'booking_status'],
    numeric: ['nights', 'cost', 'rating'],
  },
  activities: {
    text: ['name', 'city', 'date', 'duration', 'booking_status'],
    numeric: ['cost'],
  },
  reservations: {
    text: ['type', 'name', 'city', 'date', 'time', 'booking_status'],
    numeric: ['party_size', 'cost'],
  },
};

export interface BoundedItineraryContext {
  id: number | null;
  itin_id: string | null;
  name: string | null;
  description: string | null;
  date_start: string | null;
  date_end: string | null;
  budget: number | null;
  spending: number | null;
  locations: string[];
  traveler_count: number | null;
  days: number | null;
  flights: Row[];
  hotels: Row[];
  activities: Row[];
  reservations: Row[];
  truncated: Record<string, boolean>;
}

const dayCount = (start: unknown, end: unknown): number | null => {
  if (typeof start !== 'string' || typeof end !== 'string') return null;
  const a = Date.parse(start);
  const b = Date.parse(end);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return Math.max(1, Math.round((b - a) / 86_400_000) + 1);
};

/** Builds the bounded, sanitized snapshot handed to the model. */
export const sanitizeItineraryContext = (row: Row | null | undefined): BoundedItineraryContext | null => {
  if (!row) return null;
  const truncated: Record<string, boolean> = {};
  const sections: Record<string, Row[]> = {};

  for (const [section, shape] of Object.entries(SECTION_SHAPES)) {
    const raw = Array.isArray(row[section]) ? (row[section] as Row[]) : [];
    if (raw.length > AI_CONTEXT_CAPS.maxItemsPerSection) truncated[section] = true;
    sections[section] = raw
      .slice(0, AI_CONTEXT_CAPS.maxItemsPerSection)
      .map((item) => pick((item ?? {}) as Row, shape.text, shape.numeric));
  }

  const locationsRaw = Array.isArray(row.itin_locations) ? (row.itin_locations as unknown[]) : [];
  if (locationsRaw.length > AI_CONTEXT_CAPS.locations) truncated.locations = true;

  const days = dayCount(row.itin_date_start, row.itin_date_end);
  if (days != null && days > AI_CONTEXT_CAPS.maxDays) truncated.days = true;

  return {
    id: num(row.id),
    itin_id: typeof row.itin_id === 'string' ? row.itin_id : null,
    name: truncate(row.itin_name, AI_CONTEXT_CAPS.nameChars),
    description: truncate(row.itin_desc, AI_CONTEXT_CAPS.descriptionChars),
    date_start: typeof row.itin_date_start === 'string' ? row.itin_date_start : null,
    date_end: typeof row.itin_date_end === 'string' ? row.itin_date_end : null,
    budget: num(row.budget),
    spending: num(row.spending),
    locations: locationsRaw
      .slice(0, AI_CONTEXT_CAPS.locations)
      .filter((l): l is string => typeof l === 'string'),
    traveler_count: num(row.planned_traveler_count),
    days: days == null ? null : Math.min(days, AI_CONTEXT_CAPS.maxDays),
    flights: sections.flights,
    hotels: sections.hotels,
    activities: sections.activities,
    reservations: sections.reservations,
    truncated,
  };
};

/** Caps and truncates chat history before it is sent upstream. */
export const boundHistory = <T extends { role?: string; content?: unknown }>(messages: T[] | null | undefined): T[] =>
  (messages ?? []).slice(-AI_CONTEXT_CAPS.maxHistoryMessages).map((m) => ({
    ...m,
    content: truncate(m.content, 1500),
  }));

export interface MinimalQuery {
  select: (columns: string) => MinimalQuery;
  eq: (column: string, value: unknown) => MinimalQuery;
  maybeSingle: () => Promise<{ data: Row | null; error: unknown }>;
}
export interface MinimalClient {
  from: (table: string) => MinimalQuery;
}

export interface ItineraryContextLoader {
  /** Loads the bounded snapshot. Repeated calls in the same invocation reuse it. */
  load: (itineraryId: number) => Promise<{ context: BoundedItineraryContext | null; ownerId: string | null; error?: string }>;
  /** Number of real database reads performed by this loader. */
  reads: () => number;
  /** Drops the cached snapshot after a write so the next stage sees fresh data. */
  invalidate: (itineraryId?: number) => void;
}

/**
 * One loader per AI-chat invocation. Guarantees a single itinerary read that
 * every internal stage (tool calls, follow-up turns, summaries) reuses.
 */
export const createItineraryContextLoader = (client: MinimalClient): ItineraryContextLoader => {
  const cache = new Map<number, Promise<{ context: BoundedItineraryContext | null; ownerId: string | null; error?: string }>>();
  let reads = 0;

  const load = (itineraryId: number) => {
    const cached = cache.get(itineraryId);
    if (cached) return cached;

    reads += 1;
    const promise = (async () => {
      const { data, error } = await client
        .from('itinerary')
        .select(AI_ITINERARY_COLUMNS)
        .eq('id', itineraryId)
        .maybeSingle();

      if (error || !data) {
        return { context: null, ownerId: null, error: 'itinerary_not_found' };
      }
      return {
        context: sanitizeItineraryContext(data),
        ownerId: typeof data.userid === 'string' ? data.userid : null,
      };
    })();

    cache.set(itineraryId, promise);
    return promise;
  };

  return {
    load,
    reads: () => reads,
    invalidate: (itineraryId?: number) => {
      if (itineraryId == null) cache.clear();
      else cache.delete(itineraryId);
    },
  };
};
