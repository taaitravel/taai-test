import type { CanonicalFlightOffer } from '@/types/flight-offer';

/**
 * Pure, dependency-free reference-record mapping.
 *
 * The reference-only storage table (public.flight_references) is proposed but
 * NOT applied — see supabase/schema-proposals/flight-references.sql. Until that
 * migration is approved and applied, saving is blocked instead of falling back
 * to cart_items, which would put a reference-only observation into the
 * commerce/checkout path.
 */
export const FLIGHT_REFERENCE_TABLE_READY = false;

export const FLIGHT_REFERENCE_TABLE = 'flight_references';

export interface SaveFlightReferenceResult {
  ok: boolean;
  reason?: 'schema_pending' | 'not_authenticated' | 'failed';
  message?: string;
}

export const buildFlightReferenceRow = (
  offer: CanonicalFlightOffer,
  userId: string,
  itineraryId: string,
) => ({
  user_id: userId,
  itinerary_id: itineraryId,
  provider: offer.provider,
  provider_offer_id: offer.providerOfferId,
  mode: offer.mode,
  evidence_grade: offer.evidenceGrade,
  commerce_capability: offer.commerceCapability,
  origin_iata: offer.origin,
  destination_iata: offer.destination,
  cabin_class: offer.cabinClass,
  passenger_count: offer.passengerCount,
  stop_count: offer.stopCount,
  total_duration_minutes: offer.totalDurationMinutes,
  observed_amount: offer.observedPrice.amount,
  observed_currency: offer.observedPrice.currency,
  observed_at: offer.observedAt,
  expires_at: offer.expiresAt,
  slices: offer.slices as unknown as Record<string, unknown>[],
});
