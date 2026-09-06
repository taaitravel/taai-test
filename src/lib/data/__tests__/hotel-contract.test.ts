import { describe, it, expect } from 'vitest';
import {
  HOTEL_FORBIDDEN_FIELDS,
  MAX_HOTEL_IMAGES,
  MAX_HOTEL_RESULTS,
  MAX_HOTEL_ROOMS,
  capGenericProviderPayload,
  normalizeHotelDetail,
  normalizeHotelSearchResponse,
} from '../../../../supabase/functions/_shared/hotel-contract';

/** Synthetic fixture shaped like a real uncapped RapidAPI hotel search body. */
const upstreamSearchFixture = () => ({
  requestId: 'req-123',
  debug: { timings: Array.from({ length: 50 }, (_, i) => ({ step: i, ms: i })) },
  rawResponse: { body: 'X'.repeat(20_000) },
  properties: Array.from({ length: 120 }, (_, i) => ({
    id: `h-${i}`,
    name: `Hotel ${i}`,
    address: { city: 'Lisbon', country: 'PT', line1: 'Rua X', postal: '1000' },
    starRating: 4,
    reviewScore: 8.6,
    reviewCount: 1204,
    price: { total: 640.5, perNight: 160.13, currency: 'EUR', breakdown: Array.from({ length: 12 }, () => ({ label: 'Night', amount: 160.13 })) },
    images: Array.from({ length: 30 }, (_, j) => ({ url: `https://img.example/${i}/${j}.jpg`, caption: 'C'.repeat(200) })),
    amenities: Array.from({ length: 40 }, (_, j) => ({ name: `Amenity ${j}`, description: 'D'.repeat(200) })),
    location: { latitude: 38.72, longitude: -9.14, neighbourhood: { name: 'Baixa', polygon: Array.from({ length: 100 }, () => [38.7, -9.1]) } },
    deepLink: `https://partner.example/hotel/${i}?aid=42`,
    partnerId: '42',
    rooms: Array.from({ length: 40 }, (_, j) => ({ id: `r-${j}`, name: `Room ${j}`, ratePlans: Array.from({ length: 10 }, () => ({ code: 'X'.repeat(100) })) })),
    providerResponse: { raw: 'Y'.repeat(3_000) },
    trace: Array.from({ length: 20 }, () => 'trace'),
  })),
});

const bytes = (value: unknown) => JSON.stringify(value).length;

describe('canonical hotel search contract', () => {
  it('caps results at 20 and marks truncation', () => {
    const normalized = normalizeHotelSearchResponse(upstreamSearchFixture(), 'expedia');
    expect(normalized.results).toHaveLength(MAX_HOTEL_RESULTS);
    expect(normalized.result_count).toBe(MAX_HOTEL_RESULTS);
    expect(normalized.truncated).toBe(true);
  });

  it('never returns raw upstream bodies or debug payloads', () => {
    const serialized = JSON.stringify(normalizeHotelSearchResponse(upstreamSearchFixture(), 'expedia'));
    for (const field of HOTEL_FORBIDDEN_FIELDS) {
      expect(serialized).not.toContain(field);
    }
    expect(serialized).not.toContain('ratePlans');
    expect(serialized).not.toContain('polygon');
  });

  it('preserves affiliate attribution and redirect fields', () => {
    const [first] = normalizeHotelSearchResponse(upstreamSearchFixture(), 'expedia').results;
    expect(first.affiliate.redirect_url).toContain('partner.example');
    expect(first.affiliate.partner_id).toBe('42');
    expect(first.affiliate.provider).toBe('expedia');
    expect(first.affiliate.attribution).toBe('expedia');
  });

  it('reduces the response by at least 80% on the large fixture', () => {
    const upstream = upstreamSearchFixture();
    const before = bytes(upstream);
    const after = bytes(normalizeHotelSearchResponse(upstream, 'expedia'));
    const reduction = 1 - after / before;
    // Reported in the release evidence table.
    expect(before).toBeGreaterThan(after);
    expect(reduction).toBeGreaterThanOrEqual(0.8);
  });
});

describe('canonical hotel detail contract', () => {
  const detailFixture = () => ({
    property: {
      ...upstreamSearchFixture().properties[0],
      description: 'Q'.repeat(5000),
      policies: { checkIn: '15:00', checkOut: '11:00', cancellation: 'C'.repeat(2000) },
      rooms: Array.from({ length: 40 }, (_, j) => ({
        id: `r-${j}`,
        name: `Room ${j}`,
        bedType: '1 king bed',
        maxOccupancy: 2,
        price: { total: 320, currency: 'EUR' },
        refundable: j % 2 === 0,
        ratePlans: Array.from({ length: 10 }, () => ({ code: 'X'.repeat(100) })),
      })),
    },
    debug: { x: 'Y'.repeat(5000) },
  });

  it('caps images, rooms and truncates long text', () => {
    const detail = normalizeHotelDetail(detailFixture(), 'expedia');
    expect(detail.images.length).toBeLessThanOrEqual(MAX_HOTEL_IMAGES);
    expect(detail.rooms).toHaveLength(MAX_HOTEL_ROOMS);
    expect(detail.description!.length).toBeLessThanOrEqual(600);
    expect(detail.policies.cancellation!.length).toBeLessThanOrEqual(300);
    expect(detail.rooms[0].bed_type).toBe('1 king bed');
  });

  it('shrinks the detail payload by at least 80%', () => {
    const fixture = detailFixture();
    const reduction = 1 - bytes(normalizeHotelDetail(fixture, 'expedia')) / bytes(fixture);
    expect(reduction).toBeGreaterThanOrEqual(0.8);
  });
});

describe('generic provider payload cap', () => {
  it('caps arrays and drops raw/debug envelopes', () => {
    const shaped = capGenericProviderPayload({
      results: Array.from({ length: 100 }, (_, i) => i),
      rawResponse: { x: 1 },
      debug: { y: 2 },
    });
    expect((shaped.results as unknown[]).length).toBe(MAX_HOTEL_RESULTS);
    expect(shaped.rawResponse).toBeUndefined();
    expect(shaped.debug).toBeUndefined();
  });
});
