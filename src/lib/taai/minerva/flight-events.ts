/**
 * taai.Minerva canonical event emitters for flight search.
 * Flight search is currently test-mode / reference-only, so every event is
 * tagged synthetic. No purchase or booking events are emitted here.
 */

import type { CanonicalFlightOffer, FlightSearchErrorCode, FlightSearchStatus } from '@/types/flight-offer';

export const MINERVA_FLIGHT_EVENT_IDS = {
  searchSubmitted: 'taai.minerva.flight_search_submitted',
  searchCompleted: 'taai.minerva.flight_search_completed',
  offerViewed: 'taai.minerva.flight_offer_viewed',
  referenceSaved: 'taai.minerva.flight_reference_saved',
} as const;

export type MinervaFlightEventId =
  (typeof MINERVA_FLIGHT_EVENT_IDS)[keyof typeof MINERVA_FLIGHT_EVENT_IDS];

export interface MinervaFlightEvent {
  eventId: MinervaFlightEventId;
  occurredAt: string;
  synthetic: true;
  mode: 'test';
  provider: 'duffel';
  requestId: string | null;
  attribution: {
    surface: 'search';
    channel: 'internal_test';
    agent: 'miles';
  };
  payload: Record<string, unknown>;
}

const emit = (event: MinervaFlightEvent) => {
  // Transport is intentionally local until the Minerva sink is provisioned.
  console.info('[minerva]', event.eventId, event);
  return event;
};

const base = (
  eventId: MinervaFlightEventId,
  requestId: string | null,
  payload: Record<string, unknown>,
): MinervaFlightEvent => ({
  eventId,
  occurredAt: new Date().toISOString(),
  synthetic: true,
  mode: 'test',
  provider: 'duffel',
  requestId,
  attribution: { surface: 'search', channel: 'internal_test', agent: 'miles' },
  payload,
});

export const trackFlightSearchSubmitted = (params: {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string | null;
  passengers: number;
  cabinClass: string;
}) => emit(base(MINERVA_FLIGHT_EVENT_IDS.searchSubmitted, null, { ...params }));

export const trackFlightSearchCompleted = (params: {
  requestId: string | null;
  status: FlightSearchStatus;
  offerCount: number;
  errorCode?: FlightSearchErrorCode | null;
  durationMs: number;
}) => emit(base(MINERVA_FLIGHT_EVENT_IDS.searchCompleted, params.requestId, {
  status: params.status,
  offerCount: params.offerCount,
  errorCode: params.errorCode ?? null,
  durationMs: params.durationMs,
}));

export const trackFlightOfferViewed = (offer: CanonicalFlightOffer) =>
  emit(base(MINERVA_FLIGHT_EVENT_IDS.offerViewed, null, {
    providerOfferId: offer.providerOfferId,
    origin: offer.origin,
    destination: offer.destination,
    observedAmount: offer.observedPrice.amount,
    observedCurrency: offer.observedPrice.currency,
    evidenceGrade: offer.evidenceGrade,
    commerceCapability: offer.commerceCapability,
  }));

export const trackFlightReferenceSaved = (offer: CanonicalFlightOffer, itineraryId: string) =>
  emit(base(MINERVA_FLIGHT_EVENT_IDS.referenceSaved, null, {
    providerOfferId: offer.providerOfferId,
    itineraryId,
    origin: offer.origin,
    destination: offer.destination,
    observedAmount: offer.observedPrice.amount,
    observedCurrency: offer.observedPrice.currency,
    evidenceGrade: offer.evidenceGrade,
    commerceCapability: offer.commerceCapability,
  }));
