// Canonical, provider-neutral flight contract.
// Mirrored (type-identical) in src/types/flight-offer.ts for the frontend.
// This copy is the single source used by the edge function AND unit tests.

export type FlightProvider = 'duffel';
export type FlightSearchMode = 'test' | 'live';
export type FlightCommerceCapability = 'reference_only' | 'outbound_link' | 'bookable';
export type EvidenceGrade = 'provider_test' | 'provider_live' | 'estimated';

export type FlightSearchErrorCode =
  | 'VALIDATION_ERROR'
  | 'AUTH_REQUIRED'
  | 'PROVIDER_NOT_CONFIGURED'
  | 'PROVIDER_AUTH_FAILED'
  | 'PROVIDER_RATE_LIMITED'
  | 'PROVIDER_UNAVAILABLE'
  | 'RESPONSE_MAPPING_ERROR';

export type FlightSearchStatus = 'ok' | 'no_results' | 'error';

export interface CanonicalFlightSegment {
  origin: string;
  destination: string;
  departureAt: string;
  arrivalAt: string;
  marketingCarrier: string;
  marketingCarrierName: string;
  operatingCarrier: string | null;
  flightNumber: string;
  aircraft: string | null;
  durationMinutes: number | null;
}

export interface CanonicalFlightSlice {
  origin: string;
  destination: string;
  departureAt: string;
  arrivalAt: string;
  durationMinutes: number | null;
  stopCount: number;
  segments: CanonicalFlightSegment[];
}

export interface CanonicalObservedPrice {
  amount: number;
  currency: string;
}

export interface CanonicalFlightOffer {
  id: string;
  provider: FlightProvider;
  providerOfferId: string;
  mode: FlightSearchMode;
  evidenceGrade: EvidenceGrade;
  commerceCapability: FlightCommerceCapability;
  /** Always null in reference-only mode. No outbound commerce link is emitted. */
  outboundUrl: string | null;
  origin: string;
  destination: string;
  slices: CanonicalFlightSlice[];
  totalDurationMinutes: number | null;
  stopCount: number;
  observedPrice: CanonicalObservedPrice;
  cabinClass: string | null;
  passengerCount: number;
  baggage: { carryOn: number | null; checked: number | null };
  observedAt: string;
  expiresAt: string | null;
}

export interface FlightSearchError {
  code: FlightSearchErrorCode;
  message: string;
  /** Opaque diagnostic id. Never contains provider payloads or credentials. */
  diagnosticId?: string;
  retryable: boolean;
}

export interface FlightSearchResponse {
  requestId: string;
  status: FlightSearchStatus;
  mode: FlightSearchMode;
  providersAttempted: FlightProvider[];
  offers: CanonicalFlightOffer[];
  errors: FlightSearchError[];
}

export interface FlightSearchRequest {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string | null;
  adults: number;
  children: number;
  cabinClass: string;
}

const IATA = /^[A-Z]{3}$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export interface ValidationResult {
  ok: boolean;
  value?: FlightSearchRequest;
  errors: string[];
}

export const MAX_PASSENGERS = 9;

/** Canonical Duffel cabin values; normalizes legacy/case variants (e.g. "premium", "PREMIUM_ECONOMY"). */
export function normalizeCabinClass(value: unknown): string {
  const raw = String(value ?? 'economy').trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (raw === 'premium' || raw === 'premium_economy' || raw === 'premiumeconomy') return 'premium_economy';
  return raw;
}

export function validateFlightSearchRequest(raw: unknown): ValidationResult {
  const errors: string[] = [];
  const body = (raw ?? {}) as Record<string, unknown>;

  const origin = String(body.origin ?? '').trim().toUpperCase();
  const destination = String(body.destination ?? '').trim().toUpperCase();
  const departureDate = String(body.departureDate ?? '').trim();
  const returnRaw = body.returnDate ? String(body.returnDate).trim() : '';
  const adults = body.adults === undefined ? 1 : Number(body.adults);
  const children = body.children === undefined ? 0 : Number(body.children);
  const cabinClass = normalizeCabinClass(body.cabinClass);

  if (!IATA.test(origin)) errors.push('origin must be a 3-letter IATA code');
  if (!IATA.test(destination)) errors.push('destination must be a 3-letter IATA code');
  if (origin && destination && origin === destination) errors.push('origin and destination must differ');
  if (!ISO_DATE.test(departureDate) || Number.isNaN(Date.parse(departureDate))) {
    errors.push('departureDate must be a valid YYYY-MM-DD date');
  }
  if (returnRaw) {
    if (!ISO_DATE.test(returnRaw) || Number.isNaN(Date.parse(returnRaw))) {
      errors.push('returnDate must be a valid YYYY-MM-DD date');
    } else if (Date.parse(returnRaw) < Date.parse(departureDate)) {
      errors.push('returnDate must not precede departureDate');
    }
  }
  if (!Number.isInteger(adults) || adults < 1) errors.push('adults must be an integer of at least 1');
  if (!Number.isInteger(children) || children < 0) errors.push('children must be a non-negative integer');
  if (Number.isInteger(adults) && Number.isInteger(children) && adults + children > MAX_PASSENGERS) {
    errors.push(`total passengers must not exceed ${MAX_PASSENGERS}`);
  }
  const allowedCabins = ['economy', 'premium_economy', 'business', 'first'];
  if (!allowedCabins.includes(cabinClass)) errors.push('cabinClass is not supported');

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    errors: [],
    value: {
      origin,
      destination,
      departureDate,
      returnDate: returnRaw || null,
      adults,
      children,
      cabinClass,
    },
  };
}

/** Maximum normalized offers ever returned to a client. */
export const MAX_RETURNED_OFFERS = 20;

const nonEmpty = (v: unknown): boolean => typeof v === 'string' && v.trim().length > 0;
const CURRENCY = /^[A-Z]{3}$/;
const isTimestamp = (v: unknown): boolean => nonEmpty(v) && !Number.isNaN(Date.parse(String(v)));

/**
 * Rejects structurally incomplete normalized offers so no partially-formed
 * offer can reach the client. Returns true only for fully-formed offers.
 */
export function isValidCanonicalOffer(offer: CanonicalFlightOffer | null | undefined): boolean {
  if (!offer) return false;
  if (!nonEmpty(offer.id) || !nonEmpty(offer.providerOfferId)) return false;
  if (!nonEmpty(offer.provider)) return false;
  if (!Array.isArray(offer.slices) || offer.slices.length === 0) return false;

  const price = Number(offer.observedPrice?.amount);
  if (!Number.isFinite(price) || price <= 0) return false;
  if (!CURRENCY.test(String(offer.observedPrice?.currency ?? '').toUpperCase())) return false;

  for (const slice of offer.slices) {
    if (!Array.isArray(slice.segments) || slice.segments.length === 0) return false;
    for (const segment of slice.segments) {
      if (!nonEmpty(segment.origin) || !nonEmpty(segment.destination)) return false;
      if (!isTimestamp(segment.departureAt) || !isTimestamp(segment.arrivalAt)) return false;
      if (!nonEmpty(segment.flightNumber)) return false;
    }
  }
  return true;
}
