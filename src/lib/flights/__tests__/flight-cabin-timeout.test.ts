import { describe, expect, it } from 'vitest';
import {
  normalizeCabinClass,
  validateFlightSearchRequest,
} from '../../../../supabase/functions/flight-search/contract';
import {
  DUFFEL_SUPPLIER_TIMEOUT_MS,
  DUFFEL_TIMEOUT_MS,
  buildOfferRequestPayload,
  buildOfferRequestUrl,
} from '../../../../supabase/functions/flight-search/duffel';

describe('cabin class normalization', () => {
  it('maps legacy and case variants to the canonical Duffel value', () => {
    for (const input of ['premium', 'PREMIUM', 'Premium Economy', 'PREMIUM_ECONOMY', 'premium_economy']) {
      expect(normalizeCabinClass(input)).toBe('premium_economy');
    }
    expect(normalizeCabinClass('ECONOMY')).toBe('economy');
  });

  it('accepts premium variants through request validation and payload building', () => {
    for (const input of ['premium', 'PREMIUM', 'PREMIUM_ECONOMY']) {
      const result = validateFlightSearchRequest({
        origin: 'JFK', destination: 'MIA', departureDate: '2026-10-12', cabinClass: input,
      });
      expect(result.ok).toBe(true);
      expect(result.value!.cabinClass).toBe('premium_economy');
      expect(buildOfferRequestPayload(result.value!).data.cabin_class).toBe('premium_economy');
    }
  });
});

describe('offer-request URL', () => {
  it('requests synchronous offers with a supplier timeout under the client timeout', () => {
    const url = buildOfferRequestUrl();
    expect(url).toContain('return_offers=true');
    expect(url).toContain('supplier_timeout=10000');
    expect(DUFFEL_SUPPLIER_TIMEOUT_MS).toBeLessThan(DUFFEL_TIMEOUT_MS);
  });
});
