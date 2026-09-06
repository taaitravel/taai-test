import { describe, it, expect } from 'vitest';
import {
  MAX_HOTEL_RESULTS,
  normalizeHotelDetail,
  normalizeHotelSearchResponse,
} from '../../../../supabase/functions/_shared/hotel-contract';
import { buildHotelBookingSnapshot } from '@/lib/booking/hotel-booking';

const upstreamHotel = {
  id: 'h-1',
  name: 'Hotel Arts Barcelona',
  address: { city: 'Barcelona', country: 'ES', line1: 'Carrer de la Marina 19' },
  starRating: 5,
  reviewScore: 8.9,
  reviewCount: 4120,
  price: { total: 1435.21, per_night: 478.4, currency: 'EUR' },
  images: [{ url: 'https://cdn.example/a.jpg' }, { url: 'https://cdn.example/b.jpg' }],
  amenities: [{ name: 'Wifi' }, { name: 'Pool' }],
  location: { latitude: 41.3866, longitude: 2.1963 },
  deep_link: 'https://booking.example/h-1?aid=123',
  raw_response: { huge: 'x'.repeat(5000) },
};

const searchParams = { checkin: '2026-03-01', checkout: '2026-03-04', rooms: 1, adults: 2 };

describe('normalized hotel results satisfy every rendered field', () => {
  const response = normalizeHotelSearchResponse({ results: [upstreamHotel] }, 'booking.com');
  const hotel = response.results[0];

  it('provides the fields HotelResultCard renders', () => {
    expect(hotel.images?.[0]).toBe('https://cdn.example/a.jpg');
    expect(hotel.name).toBe('Hotel Arts Barcelona');
    expect(hotel.rating).toBe(8.9);
    expect(hotel.location || hotel.address).toBeTruthy();
    expect(hotel.amenities).toContain('Wifi');
  });

  it('supports the booking snapshot without provider blobs', () => {
    const snapshot = buildHotelBookingSnapshot(hotel as unknown as Record<string, unknown>, searchParams);
    expect(snapshot.issues).toEqual([]);
    expect(snapshot.nights).toBe(3);
    expect(snapshot.currency).toBe('EUR');
    expect(snapshot.totalPrice).toBeCloseTo(1435.21, 2);
  });

  it('preserves affiliate attribution and drops raw bodies', () => {
    expect(hotel.affiliate.redirect_url).toBe('https://booking.example/h-1?aid=123');
    expect(hotel.affiliate.attribution).toBe('booking.com');
    expect(JSON.stringify(hotel)).not.toContain('raw_response');
    expect(JSON.stringify(hotel)).not.toContain('xxxxxxxxxx');
  });

  it('caps search results', () => {
    const many = normalizeHotelSearchResponse(
      { results: Array.from({ length: 60 }, (_, i) => ({ ...upstreamHotel, id: `h-${i}` })) },
      'expedia',
    );
    expect(many.results).toHaveLength(MAX_HOTEL_RESULTS);
    expect(many.truncated).toBe(true);
  });

  it('detail keeps rooms, policies and description bounded', () => {
    const detail = normalizeHotelDetail(
      { property: { ...upstreamHotel, description: 'y'.repeat(2000), rooms: [{ id: 'r1', name: 'King room', bedType: '1 King bed', price: { total: 478.4, currency: 'EUR' } }] } },
      'expedia',
    );
    expect(detail.description?.length).toBeLessThanOrEqual(600);
    expect(detail.rooms[0].bed_type).toBe('1 King bed');
    expect(detail.images.length).toBeGreaterThan(0);
  });
});
