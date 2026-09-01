import { describe, expect, it } from 'vitest';
import fixture from './fixtures/duffel-jfk-mia-roundtrip.json';
import {
  MAX_PASSENGERS,
  validateFlightSearchRequest,
} from '../../../../supabase/functions/flight-search/contract';
import {
  buildOfferRequestPayload,
  classifyDuffelStatus,
  normalizeDuffelOffer,
} from '../../../../supabase/functions/flight-search/duffel';
import { buildFlightReferenceRow, FLIGHT_REFERENCE_TABLE_READY } from '../flight-reference-row';
import { formatOfferPrice, formatDurationMinutes } from '../../../types/flight-offer';

const OBSERVED_AT = '2026-09-01T12:00:00.000Z';

const normalizeFixture = () =>
  normalizeDuffelOffer(fixture.data.offers[0], {
    mode: 'test',
    passengerCount: 1,
    observedAt: OBSERVED_AT,
  });

describe('validateFlightSearchRequest', () => {
  it('accepts and canonicalizes a valid request', () => {
    const result = validateFlightSearchRequest({
      origin: 'jfk',
      destination: ' mia ',
      departureDate: '2026-10-12',
      returnDate: '2026-10-19',
      adults: 2,
      children: 1,
      cabinClass: 'ECONOMY',
    });
    expect(result.ok).toBe(true);
    expect(result.value).toMatchObject({
      origin: 'JFK',
      destination: 'MIA',
      cabinClass: 'economy',
      adults: 2,
      children: 1,
    });
  });

  it('rejects bad IATA codes, bad dates, identical airports and passenger overflow', () => {
    expect(validateFlightSearchRequest({ origin: 'JF', destination: 'MIA', departureDate: '2026-10-12' }).ok).toBe(false);
    expect(validateFlightSearchRequest({ origin: 'JFK', destination: 'JFK', departureDate: '2026-10-12' }).ok).toBe(false);
    expect(validateFlightSearchRequest({ origin: 'JFK', destination: 'MIA', departureDate: '12/10/2026' }).ok).toBe(false);
    expect(
      validateFlightSearchRequest({
        origin: 'JFK', destination: 'MIA', departureDate: '2026-10-12', returnDate: '2026-10-01',
      }).ok,
    ).toBe(false);
    expect(
      validateFlightSearchRequest({
        origin: 'JFK', destination: 'MIA', departureDate: '2026-10-12', adults: MAX_PASSENGERS + 1,
      }).ok,
    ).toBe(false);
    expect(
      validateFlightSearchRequest({
        origin: 'JFK', destination: 'MIA', departureDate: '2026-10-12', cabinClass: 'luxury',
      }).ok,
    ).toBe(false);
  });
});

describe('buildOfferRequestPayload', () => {
  it('builds a round-trip offer request with one slice per direction', () => {
    const request = validateFlightSearchRequest({
      origin: 'JFK', destination: 'MIA', departureDate: '2026-10-12', returnDate: '2026-10-19', adults: 1,
    }).value!;
    const payload = buildOfferRequestPayload(request);
    expect(payload.data.slices).toHaveLength(2);
    expect(payload.data.slices[1]).toMatchObject({ origin: 'MIA', destination: 'JFK' });
    expect(payload.data.passengers).toHaveLength(1);
    expect(payload.data.cabin_class).toBe('economy');
  });
});

describe('normalizeDuffelOffer (JFK-MIA synthetic round trip)', () => {
  it('maps the canonical contract fields', () => {
    const offer = normalizeFixture();
    expect(offer.provider).toBe('duffel');
    expect(offer.providerOfferId).toBe('off_test_jfkmia_0001');
    expect(offer.origin).toBe('JFK');
    expect(offer.destination).toBe('MIA');
    expect(offer.slices).toHaveLength(2);
    expect(offer.slices[0].segments[0].flightNumber).toBe('AA1123');
    expect(offer.slices[0].departureAt).toBe('2026-10-12T08:15:00');
    expect(offer.slices[1].arrivalAt).toBe('2026-10-19T20:45:00');
    expect(offer.stopCount).toBe(0);
    expect(offer.totalDurationMinutes).toBe(190 + 185);
    expect(offer.observedPrice).toEqual({ amount: 412.35, currency: 'USD' });
    expect(offer.cabinClass).toBe('economy');
    expect(offer.baggage).toEqual({ carryOn: 1, checked: 0 });
    expect(offer.observedAt).toBe(OBSERVED_AT);
    expect(offer.expiresAt).toBe('2026-09-01T12:30:00Z');
  });

  it('locks test results to reference-only with no outbound link', () => {
    const offer = normalizeFixture();
    expect(offer.mode).toBe('test');
    expect(offer.evidenceGrade).toBe('provider_test');
    expect(offer.commerceCapability).toBe('reference_only');
    expect(offer.outboundUrl).toBeNull();
  });

  it('throws on unusable offers so they can be filtered out', () => {
    expect(() =>
      normalizeDuffelOffer(fixture.data.offers[1], { mode: 'test', passengerCount: 1, observedAt: OBSERVED_AT }),
    ).toThrow();
  });
});

describe('provider error classification', () => {
  it('maps provider status codes onto the taxonomy', () => {
    expect(classifyDuffelStatus(401)).toBe('PROVIDER_AUTH_FAILED');
    expect(classifyDuffelStatus(403)).toBe('PROVIDER_AUTH_FAILED');
    expect(classifyDuffelStatus(429)).toBe('PROVIDER_RATE_LIMITED');
    expect(classifyDuffelStatus(500)).toBe('PROVIDER_UNAVAILABLE');
    expect(classifyDuffelStatus(503)).toBe('PROVIDER_UNAVAILABLE');
  });
});

describe('reference-only save path', () => {
  it('is gated until the flight_references migration is approved', () => {
    expect(FLIGHT_REFERENCE_TABLE_READY).toBe(false);
  });

  it('builds a reference row with no commerce fields', () => {
    const row = buildFlightReferenceRow(normalizeFixture(), 'user-1', 'itin-1');
    expect(row).toMatchObject({
      commerce_capability: 'reference_only',
      evidence_grade: 'provider_test',
      mode: 'test',
      observed_amount: 412.35,
      observed_currency: 'USD',
    });
    expect(Object.keys(row)).not.toContain('booking_status');
    expect(Object.keys(row)).not.toContain('price');
    expect(Object.keys(row)).not.toContain('total');
  });
});

describe('presentation helpers', () => {
  it('formats observed price and durations', () => {
    expect(formatOfferPrice({ amount: 1435.21, currency: 'USD' })).toBe('$1,435.21');
    expect(formatDurationMinutes(190)).toBe('3h 10m');
    expect(formatDurationMinutes(null)).toBe('—');
  });
});
