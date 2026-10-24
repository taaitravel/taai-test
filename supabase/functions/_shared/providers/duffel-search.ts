import {
  buildOfferRequestPayload,
  buildOfferRequestUrl,
  DUFFEL_API_BASE,
  DUFFEL_API_VERSION,
  DUFFEL_TIMEOUT_MS,
  normalizeCabinClass,
  normalizeDuffelOffer,
} from '../../flight-search/duffel.ts';

export interface MilesFlightQuery {
  origin: string;
  destination: string;
  departDate: string;
  returnDate?: string | null;
  passengers?: number;
  cabinClass?: string | null;
}

const tokenAndMode = (): { token: string; mode: 'test' | 'live' } | null => {
  const live = Deno.env.get('DUFFEL_LIVE_KEY')?.trim() || '';
  const test = Deno.env.get('DUFFEL_TEST_KEY')?.trim() || '';
  const token = live || test;
  if (!token) return null;
  const mode: 'test' | 'live' = live !== '' || token.startsWith('duffel_live') ? 'live' : 'test';
  return { token, mode };
};

/**
 * Reference fares from the same Duffel offer-request adapter the Search page uses.
 * No orders, payments, or booking calls.
 */
export const searchDuffelFlights = async (query: MilesFlightQuery) => {
  const auth = tokenAndMode();
  if (!auth) return { error: 'Flight search is currently unavailable', results: [] as unknown[] };

  const cabin = normalizeCabinClass(query.cabinClass || 'economy');
  const payload = buildOfferRequestPayload({
    origin: String(query.origin || '').toUpperCase(),
    destination: String(query.destination || '').toUpperCase(),
    departureDate: query.departDate,
    returnDate: query.returnDate || null,
    adults: Math.min(Math.max(Number(query.passengers) || 1, 1), 9),
    children: 0,
    cabinClass: cabin,
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DUFFEL_TIMEOUT_MS);
  try {
    const response = await fetch(buildOfferRequestUrl(DUFFEL_API_BASE), {
      method: 'POST',
      signal: controller.signal,
      redirect: 'manual',
      headers: {
        Authorization: `Bearer ${auth.token}`,
        'Duffel-Version': DUFFEL_API_VERSION,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (response.status >= 300 && response.status < 400) {
      return { error: 'Flight search failed', results: [] };
    }
    if (!response.ok) {
      console.error('Duffel flight search failed', response.status);
      return { error: 'Flight search failed', results: [] };
    }
    const body = await response.json();
    const offers = Array.isArray(body?.data?.offers) ? body.data.offers : [];
    const observedAt = new Date().toISOString();
    const results = offers.slice(0, 6).map((offer: unknown, index: number) => {
      try {
        const normalized = normalizeDuffelOffer(offer, {
          mode: auth.mode,
          passengerCount: Math.min(Math.max(Number(query.passengers) || 1, 1), 9),
          observedAt,
        });
        const first = normalized.slices[0]?.segments[0];
        return {
          id: normalized.id || `duffel_${index}`,
          airline: first?.marketingCarrierName || 'Airline',
          carrierCode: first?.marketingCarrier || '',
          flightNumber: first?.flightNumber || '',
          price: normalized.observedPrice.amount,
          currency: normalized.observedPrice.currency,
          departure: normalized.slices[0]?.departureAt || '',
          arrival: normalized.slices[0]?.arrivalAt || '',
          origin: normalized.origin,
          destination: normalized.destination,
          duration: normalized.totalDurationMinutes ? `${normalized.totalDurationMinutes} min` : '',
          stops: normalized.stopCount,
          date: query.departDate,
          cabin: normalized.cabinClass || cabin,
          source: 'duffel',
          mode: auth.mode,
          commerceCapability: 'reference_only',
          bookable: false,
          note: 'Reference fare. Compare it on the airline site. taai does not sell this flight.',
        };
      } catch {
        return null;
      }
    }).filter(Boolean);

    return {
      constraint_summary: `Reference fares from ${query.origin} to ${query.destination} on ${query.departDate}`,
      results,
      action_buttons: ['select', 'shuffle'],
    };
  } catch (error) {
    console.error('Duffel flight search error', error instanceof Error ? error.message : 'error');
    return { error: 'Flight search failed', results: [] };
  } finally {
    clearTimeout(timer);
  }
};
