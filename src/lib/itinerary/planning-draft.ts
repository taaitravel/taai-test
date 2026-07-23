import type {
  PlanningDraftItem,
  PlanningDraftItemKind,
  PlanningDraftResultType,
} from '@/types/planning-draft';

const CATEGORY_TO_KIND: Record<PlanningDraftResultType, PlanningDraftItemKind> = {
  flights: 'flight',
  hotels: 'hotel',
  activities: 'activity',
  restaurants: 'restaurant',
};

function djb2(seed: string): string {
  let hash = 5381;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) + hash + seed.charCodeAt(i)) | 0;
  }
  // unsigned hex
  return (hash >>> 0).toString(16);
}

function isRecord(x: unknown): x is Record<string, unknown> {
  return !!x && typeof x === 'object';
}

function str(x: unknown): string | null {
  if (typeof x === 'string' && x.trim()) return x.trim();
  if (typeof x === 'number' && Number.isFinite(x)) return String(x);
  return null;
}

function num(x: unknown): number | null {
  if (typeof x === 'number' && Number.isFinite(x)) return x;
  if (typeof x === 'string' && x.trim() !== '') {
    const n = Number(x);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function normalizeFlight(r: Record<string, unknown>): Omit<PlanningDraftItem, 'draftId'> {
  const issues: string[] = [];
  const airline =
    str(r.airlineName) ??
    str(r.airline) ??
    (Array.isArray(r.validatingAirlineCodes) ? str((r.validatingAirlineCodes as unknown[])[0]) : null);
  const flightNumber = str(r.flightNumber) ?? str(r.flight_number);
  const title = [airline, flightNumber].filter(Boolean).join(' ') || 'Flight';

  const dep = isRecord(r.departure) ? r.departure : {};
  const arr = isRecord(r.arrival) ? r.arrival : {};
  const departureAt = str((dep as Record<string, unknown>).at) ?? str(r.departure);
  const originIata = str((dep as Record<string, unknown>).iataCode) ?? str(r.from);
  const destIata = str((arr as Record<string, unknown>).iataCode) ?? str(r.to);

  if (!departureAt) issues.push('Missing departure date/time');
  if (!originIata || !destIata) issues.push('Missing origin or destination');

  const priceObj = isRecord(r.price) ? r.price : null;
  const price =
    (priceObj ? num(priceObj.total) : null) ??
    num(r.price) ??
    num(r.total);
  const currency =
    (priceObj ? (str(priceObj.currency) as string | null) : null) ??
    str(r.currency);
  if (price !== null && !currency) issues.push('Currency not confirmed');

  const sourceResultId =
    str(r.id) ?? str(r.offerId) ?? str(r.flightId) ?? null;

  return {
    kind: 'flight',
    title,
    provider: airline,
    sourceResultId,
    providerRef: null,
    serviceDateStart: departureAt,
    serviceDateEnd: str((arr as Record<string, unknown>).at) ?? null,
    locationLabel: originIata && destIata ? `${originIata} → ${destIata}` : null,
    price,
    currency,
    availabilityStatus: 'provider_search_result',
    checkoutReadiness: 'not_checkout_ready',
    validationIssues: issues,
    rawSource: r,
  };
}

function normalizeHotel(r: Record<string, unknown>): Omit<PlanningDraftItem, 'draftId'> {
  const issues: string[] = [];
  const title =
    str(r.name) ?? str(r.hotel_name) ?? str(r.hotelName) ?? 'Hotel';
  const provider = str(r.provider) ?? str(r.source) ?? 'booking';

  const city = str(r.city) ?? str(r.location);
  const address = str(r.address);
  const locationLabel = city ?? address;
  if (!locationLabel) issues.push('Location not confirmed');

  const checkIn = str(r.checkin) ?? str(r.checkInDate) ?? str(r.checkIn);
  const checkOut = str(r.checkout) ?? str(r.checkOutDate) ?? str(r.checkOut);
  if (!checkIn) issues.push('Check-in date not confirmed');
  if (!checkOut) issues.push('Check-out date not confirmed');

  const priceBreakdown = isRecord(r.priceBreakdown) ? r.priceBreakdown : null;
  const gross = priceBreakdown && isRecord(priceBreakdown.grossPrice) ? priceBreakdown.grossPrice : null;
  const price =
    (gross ? num(gross.value) : null) ??
    num(r.min_total_price) ??
    num(r.price) ??
    num(r.cost);
  const currency =
    (gross ? (str(gross.currency) as string | null) : null) ??
    str(r.currency);
  if (price !== null && !currency) issues.push('Currency not confirmed');

  const sourceResultId =
    str(r.hotel_id) ?? str(r.hotelId) ?? str(r.id) ?? null;
  const providerRef = str(r.url) ?? str(r.bookingUrl) ?? null;

  return {
    kind: 'hotel',
    title,
    provider,
    sourceResultId,
    providerRef,
    serviceDateStart: checkIn,
    serviceDateEnd: checkOut,
    locationLabel,
    price,
    currency,
    availabilityStatus: 'provider_search_result',
    checkoutReadiness: 'not_checkout_ready',
    validationIssues: issues,
    rawSource: r,
  };
}

function normalizeActivity(r: Record<string, unknown>): Omit<PlanningDraftItem, 'draftId'> {
  const issues: string[] = [];
  const title = str(r.name) ?? 'Activity';
  const provider = str(r.provider) ?? str(r.source) ?? null;

  const locationLabel = str(r.location) ?? str(r.address);
  if (!locationLabel) issues.push('Location not confirmed');

  const serviceDateStart = str(r.date) ?? str(r.startDate) ?? null;
  if (!serviceDateStart) issues.push('Date not confirmed');

  const price = num(r.price) ?? num(r.cost);
  const currency = str(r.currency);
  if (price !== null && !currency) issues.push('Currency not confirmed');

  const sourceResultId = str(r.id) ?? str(r.activityId) ?? null;

  return {
    kind: 'activity',
    title,
    provider,
    sourceResultId,
    providerRef: null,
    serviceDateStart,
    serviceDateEnd: null,
    locationLabel,
    price,
    currency,
    availabilityStatus: 'provider_search_result',
    checkoutReadiness: 'not_checkout_ready',
    validationIssues: issues,
    rawSource: r,
  };
}

function normalizeRestaurant(r: Record<string, unknown>): Omit<PlanningDraftItem, 'draftId'> {
  const issues: string[] = [];
  const title = str(r.name) ?? 'Restaurant';
  const provider = str(r.provider) ?? str(r.source) ?? 'yelp';

  const locationLabel = str(r.address) ?? str(r.location);
  if (!locationLabel) issues.push('Location not confirmed');

  const rawPrice = num(r.price);
  let price: number | null = rawPrice;
  if (rawPrice === 0) {
    price = null;
    issues.push('Price not confirmed');
  } else if (rawPrice === null) {
    issues.push('Price not confirmed');
  }
  const currency = str(r.currency);
  if (price !== null && !currency) issues.push('Currency not confirmed');

  const sourceResultId = str(r.id) ?? str(r.yelpId) ?? null;

  return {
    kind: 'restaurant',
    title,
    provider,
    sourceResultId,
    providerRef: str(r.openTableUrl) ?? str(r.resyUrl) ?? str(r.url) ?? null,
    serviceDateStart: null,
    serviceDateEnd: null,
    locationLabel,
    price,
    currency,
    availabilityStatus: 'planning_only',
    checkoutReadiness: 'not_checkout_ready',
    validationIssues: issues,
    rawSource: r,
  };
}

/**
 * Sole authority for turning a raw carousel result into a normalized
 * planning-draft item. Returns null for unknown categories or malformed input.
 * Cards MUST NOT re-derive draftId or fingerprint logic.
 */
export function normalizeResult(
  resultType: string,
  rawResult: unknown,
): PlanningDraftItem | null {
  if (!isRecord(rawResult)) return null;
  if (!(resultType in CATEGORY_TO_KIND)) return null;
  const category = resultType as PlanningDraftResultType;

  let base: Omit<PlanningDraftItem, 'draftId'>;
  switch (category) {
    case 'flights':
      base = normalizeFlight(rawResult);
      break;
    case 'hotels':
      base = normalizeHotel(rawResult);
      break;
    case 'activities':
      base = normalizeActivity(rawResult);
      break;
    case 'restaurants':
      base = normalizeRestaurant(rawResult);
      break;
  }

  const seed = [
    base.title,
    base.serviceDateStart ?? '',
    base.locationLabel ?? '',
    base.price ?? '',
    base.currency ?? '',
  ].join('|');

  const suffix = base.sourceResultId ?? djb2(seed);
  const draftId = `${base.kind}:${base.provider ?? 'unknown'}:${suffix}`;

  return { ...base, draftId };
}