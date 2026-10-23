import { describe, expect, it } from 'vitest';
import { assignHotelLabels, resolveStayPrice } from '../../../supabase/functions/_shared/hotel-presentation';

describe('hotel price and labels', () => {
  it('splits a stay total that was copied into the nightly field', () => {
    expect(resolveStayPrice({ nightly: 800, total: 800, nights: 4, rooms: 1 })).toEqual({
      nightly: 200,
      total: 800,
    });
    expect(resolveStayPrice({ nightly: null, total: 600, nights: 3, rooms: 1 })).toEqual({
      nightly: 200,
      total: 600,
    });
  });

  it('labels from rating, price, and distance, and skips a label without data', () => {
    const labels = assignHotelLabels([
      { id: 'a', pricePerNight: 400, rating: 9.2, reviewCount: 800, distanceMiles: 2.4 },
      { id: 'b', pricePerNight: 140, rating: 8.4, reviewCount: 120, distanceMiles: 0.4 },
      { id: 'c', pricePerNight: 90, rating: 6, reviewCount: 10, distanceMiles: null },
    ]);
    expect(labels.get('a')?.label).toBe('Best Overall');
    expect(labels.get('b')?.label).toBe('Best Value');
    expect(labels.get('c')).toBeUndefined();
    expect([...labels.values()].map((label) => label.reason).join(' ')).not.toMatch(/walkable/i);
  });

  it('does not assign Best Value from list position when nothing is rated 8 or higher', () => {
    const labels = assignHotelLabels([
      { id: 'first', pricePerNight: 50, rating: 6, reviewCount: 4, distanceMiles: null },
      { id: 'second', pricePerNight: 40, rating: 5, reviewCount: 2, distanceMiles: null },
    ]);
    expect([...labels.values()].map((label) => label.label)).not.toContain('Best Value');
  });
});
