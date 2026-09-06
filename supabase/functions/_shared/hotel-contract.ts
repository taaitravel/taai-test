/**
 * Canonical normalized hotel contracts (egress containment).
 *
 * The hotel provider proxies must NEVER return the full upstream provider
 * response. They return only the fields the frontend renders, capped at
 * MAX_HOTEL_RESULTS, with raw bodies, debug payloads and unused nested objects
 * removed. Affiliate attribution / redirect fields are preserved because the
 * commercial redirect contract depends on them.
 *
 * Upstream payloads are never persisted by these functions.
 *
 * Deno-global free so it can be unit tested from the frontend test runner.
 */

export const MAX_HOTEL_RESULTS = 20;
export const MAX_HOTEL_IMAGES = 5;
export const MAX_HOTEL_AMENITIES = 8;
export const MAX_HOTEL_ROOMS = 10;
export const HOTEL_DESCRIPTION_CHARS = 600;
export const HOTEL_POLICY_CHARS = 300;

/** Fields that must never appear in a normalized hotel response. */
export const HOTEL_FORBIDDEN_FIELDS = [
  'raw',
  'rawResponse',
  'raw_response',
  'providerResponse',
  'provider_response',
  'debug',
  '__debug',
  'trace',
  'requestId',
  'summary_raw',
  'apiResponse',
] as const;

export interface CanonicalHotelSummary {
  id: string;
  name: string;
  city: string | null;
  country: string | null;
  star_rating: number | null;
  review_score: number | null;
  review_count: number | null;
  price_total: number | null;
  price_per_night: number | null;
  currency: string | null;
  image: string | null;
  amenities: string[];
  latitude: number | null;
  longitude: number | null;
  /** Affiliate attribution is required by the commercial redirect contract. */
  affiliate: {
    provider: string;
    partner_id: string | null;
    redirect_url: string | null;
    attribution: string | null;
  };
}

export interface CanonicalHotelDetail extends CanonicalHotelSummary {
  description: string | null;
  images: string[];
  rooms: Array<{
    id: string | null;
    name: string | null;
    bed_type: string | null;
    max_occupancy: number | null;
    price_total: number | null;
    currency: string | null;
    refundable: boolean | null;
  }>;
  policies: {
    check_in: string | null;
    check_out: string | null;
    cancellation: string | null;
  };
}

export interface CanonicalHotelSearchResponse {
  provider: string;
  results: CanonicalHotelSummary[];
  result_count: number;
  truncated: boolean;
}

type Row = Record<string, any>;

const str = (...vals: unknown[]): string | null => {
  for (const v of vals) {
    if (typeof v === 'string' && v.trim()) return v.trim();
    if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  }
  return null;
};

const numOrNull = (...vals: unknown[]): number | null => {
  for (const v of vals) {
    const n = typeof v === 'number' ? v : Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
};

const clip = (value: unknown, max: number): string | null => {
  const s = str(value);
  if (!s) return null;
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
};

const imageList = (raw: unknown): string[] => {
  const arr = Array.isArray(raw) ? raw : raw ? [raw] : [];
  return arr
    .map((i) => str(typeof i === 'object' && i ? (i as Row).url ?? (i as Row).href ?? (i as Row).image : i))
    .filter((u): u is string => Boolean(u))
    .slice(0, MAX_HOTEL_IMAGES);
};

const amenityList = (raw: unknown): string[] => {
  const arr = Array.isArray(raw) ? raw : [];
  return arr
    .map((a) => str(typeof a === 'object' && a ? (a as Row).name ?? (a as Row).label : a))
    .filter((a): a is string => Boolean(a))
    .slice(0, MAX_HOTEL_AMENITIES);
};

const candidateList = (payload: Row): Row[] => {
  const keys = ['properties', 'results', 'hotels', 'data', 'items', 'searchResults'];
  for (const key of keys) {
    const value = payload?.[key];
    if (Array.isArray(value)) return value as Row[];
    if (value && typeof value === 'object') {
      for (const inner of keys) {
        if (Array.isArray((value as Row)[inner])) return (value as Row)[inner] as Row[];
      }
    }
  }
  return Array.isArray(payload) ? (payload as unknown as Row[]) : [];
};

export const normalizeHotelSummary = (
  raw: Row,
  provider: string,
  affiliateDefaults: { partner_id?: string | null; attribution?: string | null } = {}
): CanonicalHotelSummary => {
  const price = raw?.price ?? raw?.pricing ?? raw?.rate ?? {};
  const location = raw?.location ?? raw?.coordinates ?? raw?.geo ?? {};
  const address = raw?.address ?? raw?.destinationInfo ?? {};
  return {
    id: str(raw?.id, raw?.hotel_id, raw?.hotelId, raw?.property_id, raw?.propertyId) ?? 'unknown',
    name: str(raw?.name, raw?.hotel_name, raw?.propertyName, raw?.title) ?? 'Unnamed property',
    city: str(address?.city, raw?.city, raw?.cityName),
    country: str(address?.country, raw?.country, raw?.countryCode),
    star_rating: numOrNull(raw?.star_rating, raw?.starRating, raw?.stars, raw?.class),
    review_score: numOrNull(raw?.review_score, raw?.reviewScore, raw?.rating, raw?.reviews?.score),
    review_count: numOrNull(raw?.review_count, raw?.reviewCount, raw?.reviews?.total),
    price_total: numOrNull(price?.total, price?.grossPrice?.value, price?.amount, raw?.total_price),
    price_per_night: numOrNull(price?.per_night, price?.perNight, price?.lead?.amount, raw?.price_per_night),
    currency: str(price?.currency, price?.currencyCode, raw?.currency) ?? 'USD',
    image: imageList(raw?.images ?? raw?.photos ?? raw?.propertyImage ?? raw?.image)[0] ?? null,
    amenities: amenityList(raw?.amenities ?? raw?.facilities),
    latitude: numOrNull(location?.latitude, location?.lat, raw?.latitude),
    longitude: numOrNull(location?.longitude, location?.lng, location?.lon, raw?.longitude),
    affiliate: {
      provider,
      partner_id: str(raw?.partner_id, raw?.partnerId, affiliateDefaults.partner_id),
      redirect_url: str(raw?.deep_link, raw?.deepLink, raw?.url, raw?.booking_url, raw?.affiliate_url),
      attribution: str(raw?.attribution, affiliateDefaults.attribution) ?? provider,
    },
  };
};

export const normalizeHotelSearchResponse = (
  upstream: unknown,
  provider: string,
  affiliateDefaults: { partner_id?: string | null; attribution?: string | null } = {}
): CanonicalHotelSearchResponse => {
  const payload = (upstream ?? {}) as Row;
  const list = candidateList(payload);
  const capped = list.slice(0, MAX_HOTEL_RESULTS);
  return {
    provider,
    results: capped.map((item) => normalizeHotelSummary(item ?? {}, provider, affiliateDefaults)),
    result_count: capped.length,
    truncated: list.length > MAX_HOTEL_RESULTS,
  };
};

export const normalizeHotelDetail = (
  upstream: unknown,
  provider: string,
  affiliateDefaults: { partner_id?: string | null; attribution?: string | null } = {}
): CanonicalHotelDetail => {
  const payload = (upstream ?? {}) as Row;
  const raw = (payload.property ?? payload.hotel ?? payload.data ?? payload) as Row;
  const policies = raw?.policies ?? raw?.checkin ?? {};
  const rooms = Array.isArray(raw?.rooms) ? raw.rooms : Array.isArray(raw?.roomTypes) ? raw.roomTypes : [];
  return {
    ...normalizeHotelSummary(raw, provider, affiliateDefaults),
    description: clip(raw?.description ?? raw?.summary ?? raw?.about, HOTEL_DESCRIPTION_CHARS),
    images: imageList(raw?.images ?? raw?.photos),
    rooms: (rooms as Row[]).slice(0, MAX_HOTEL_ROOMS).map((room) => ({
      id: str(room?.id, room?.room_id, room?.roomId),
      name: str(room?.name, room?.room_name, room?.description),
      bed_type: str(room?.bed_type, room?.bedType, room?.beds),
      max_occupancy: numOrNull(room?.max_occupancy, room?.maxOccupancy, room?.capacity),
      price_total: numOrNull(room?.price?.total, room?.price, room?.total_price),
      currency: str(room?.price?.currency, room?.currency) ?? 'USD',
      refundable: typeof room?.refundable === 'boolean' ? room.refundable : null,
    })),
    policies: {
      check_in: str(policies?.check_in, policies?.checkIn, policies?.from),
      check_out: str(policies?.check_out, policies?.checkOut, policies?.until),
      cancellation: clip(policies?.cancellation ?? raw?.cancellation_policy, HOTEL_POLICY_CHARS),
    },
  };
};

/**
 * Fallback shaping for non-hotel endpoints served by the same proxies: caps
 * arrays and removes debug/raw envelopes so a full upstream body is never
 * relayed to the browser.
 */
export const capGenericProviderPayload = (upstream: unknown, maxItems = MAX_HOTEL_RESULTS): Row => {
  const payload = (upstream ?? {}) as Row;
  if (Array.isArray(payload)) return { results: payload.slice(0, maxItems), truncated: payload.length > maxItems };
  const out: Row = {};
  for (const [key, value] of Object.entries(payload)) {
    if ((HOTEL_FORBIDDEN_FIELDS as readonly string[]).includes(key)) continue;
    out[key] = Array.isArray(value) ? value.slice(0, maxItems) : value;
  }
  return out;
};
