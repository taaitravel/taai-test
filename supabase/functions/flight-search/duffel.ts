// Duffel adapter: offer-request endpoint only. No offers/orders/payments calls.
import {
  CanonicalFlightOffer,
  CanonicalFlightSegment,
  CanonicalFlightSlice,
  FlightSearchErrorCode,
  FlightSearchRequest,
} from './contract.ts';

export const DUFFEL_API_BASE = 'https://api.duffel.com';
export const DUFFEL_API_VERSION = 'v2';
export const DUFFEL_TIMEOUT_MS = 15_000;

function isoDurationToMinutes(value: unknown): number | null {
  if (typeof value !== 'string') return null;
  const match = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?)?$/.exec(value);
  if (!match) return null;
  const [, d, h, m] = match;
  const minutes = (Number(d ?? 0) * 1440) + (Number(h ?? 0) * 60) + Number(m ?? 0);
  return minutes > 0 ? minutes : null;
}

function normalizeSegment(raw: any): CanonicalFlightSegment {
  const marketing = raw?.marketing_carrier ?? {};
  const operating = raw?.operating_carrier ?? null;
  const passenger = Array.isArray(raw?.passengers) ? raw.passengers[0] : undefined;
  return {
    origin: String(raw?.origin?.iata_code ?? ''),
    destination: String(raw?.destination?.iata_code ?? ''),
    departureAt: String(raw?.departing_at ?? ''),
    arrivalAt: String(raw?.arriving_at ?? ''),
    marketingCarrier: String(marketing?.iata_code ?? ''),
    marketingCarrierName: String(marketing?.name ?? marketing?.iata_code ?? 'Airline'),
    operatingCarrier: operating?.iata_code ? String(operating.iata_code) : null,
    flightNumber: `${marketing?.iata_code ?? ''}${raw?.marketing_carrier_flight_number ?? raw?.operating_carrier_flight_number ?? ''}`,
    aircraft: raw?.aircraft?.name ? String(raw.aircraft.name) : null,
    durationMinutes: isoDurationToMinutes(raw?.duration),
    ...(passenger ? {} : {}),
  };
}

function normalizeSlice(raw: any): CanonicalFlightSlice {
  const segments: CanonicalFlightSegment[] = Array.isArray(raw?.segments)
    ? raw.segments.map(normalizeSegment)
    : [];
  return {
    origin: String(raw?.origin?.iata_code ?? segments[0]?.origin ?? ''),
    destination: String(raw?.destination?.iata_code ?? segments[segments.length - 1]?.destination ?? ''),
    departureAt: segments[0]?.departureAt ?? '',
    arrivalAt: segments[segments.length - 1]?.arrivalAt ?? '',
    durationMinutes: isoDurationToMinutes(raw?.duration),
    stopCount: Math.max(segments.length - 1, 0),
    segments,
  };
}

function baggageOf(raw: any): { carryOn: number | null; checked: number | null } {
  const bags = raw?.slices?.[0]?.segments?.[0]?.passengers?.[0]?.baggages;
  if (!Array.isArray(bags)) return { carryOn: null, checked: null };
  const find = (type: string) => {
    const hit = bags.find((b: any) => b?.type === type);
    return hit && typeof hit.quantity === 'number' ? hit.quantity : null;
  };
  return { carryOn: find('carry_on'), checked: find('checked') };
}

/**
 * Maps a Duffel offer onto the canonical contract.
 * Duffel test-mode results are always locked to reference-only, provider_test evidence.
 */
export function normalizeDuffelOffer(
  raw: any,
  ctx: { mode: 'test' | 'live'; passengerCount: number; observedAt: string },
): CanonicalFlightOffer {
  const slices: CanonicalFlightSlice[] = Array.isArray(raw?.slices) ? raw.slices.map(normalizeSlice) : [];
  if (slices.length === 0) throw new Error('offer has no slices');

  const amount = Number(raw?.total_amount);
  const currency = String(raw?.total_currency ?? '');
  if (!Number.isFinite(amount) || !currency) throw new Error('offer has no usable price');

  let totalDuration: number | null = null;
  for (const slice of slices as CanonicalFlightSlice[]) {
    if (slice.durationMinutes === null) continue;
    totalDuration = (totalDuration ?? 0) + slice.durationMinutes;
  }


  const cabin = raw?.slices?.[0]?.segments?.[0]?.passengers?.[0]?.cabin_class ?? null;

  return {
    id: String(raw?.id ?? ''),
    provider: 'duffel',
    providerOfferId: String(raw?.id ?? ''),
    mode: ctx.mode,
    evidenceGrade: ctx.mode === 'test' ? 'provider_test' : 'provider_live',
    commerceCapability: 'reference_only',
    outboundUrl: null,
    origin: slices[0].origin,
    destination: slices[0].destination,
    slices,
    totalDurationMinutes: totalDuration,
    stopCount: slices.reduce((n, s) => n + s.stopCount, 0),
    observedPrice: { amount, currency },
    cabinClass: cabin ? String(cabin) : null,
    passengerCount: ctx.passengerCount,
    baggage: baggageOf(raw),
    observedAt: ctx.observedAt,
    expiresAt: raw?.expires_at ? String(raw.expires_at) : null,
  };
}

export function classifyDuffelStatus(status: number): FlightSearchErrorCode {
  if (status === 401 || status === 403) return 'PROVIDER_AUTH_FAILED';
  if (status === 429) return 'PROVIDER_RATE_LIMITED';
  return 'PROVIDER_UNAVAILABLE';
}

export function buildOfferRequestPayload(req: FlightSearchRequest) {
  const passengers = [
    ...Array.from({ length: req.adults }, () => ({ type: 'adult' as const })),
    ...Array.from({ length: req.children }, () => ({ age: 8 })),
  ];
  const slices = [
    { origin: req.origin, destination: req.destination, departure_date: req.departureDate },
  ];
  if (req.returnDate) {
    slices.push({ origin: req.destination, destination: req.origin, departure_date: req.returnDate });
  }
  return { data: { slices, passengers, cabin_class: req.cabinClass } };
}
