/**
 * Canonical, provider-neutral flight contract (frontend copy).
 * Type-identical to supabase/functions/flight-search/contract.ts.
 * Flight results are currently reference-only: no booking, no outbound commerce link.
 */

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

export const isCanonicalFlightOffer = (value: unknown): value is CanonicalFlightOffer => {
  const offer = value as CanonicalFlightOffer | null;
  return !!offer && typeof offer === 'object' && Array.isArray(offer.slices) &&
    !!offer.observedPrice && typeof offer.observedPrice.amount === 'number';
};

export const formatDurationMinutes = (minutes: number | null): string => {
  if (minutes === null || !Number.isFinite(minutes)) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

export const formatOfferPrice = (price: CanonicalObservedPrice): string => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: price.currency,
      maximumFractionDigits: 2,
    }).format(price.amount);
  } catch {
    return `${price.amount.toFixed(2)} ${price.currency}`;
  }
};
