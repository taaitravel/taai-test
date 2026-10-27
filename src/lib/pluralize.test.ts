import { describe, expect, it } from 'vitest';
import { pluralize } from './pluralize';

describe('pluralize', () => {
  it('uses itineraries for zero and many', () => {
    expect(pluralize(0, 'itinerary', 'itineraries')).toBe('0 itineraries');
    expect(pluralize(2, 'itinerary', 'itineraries')).toBe('2 itineraries');
  });

  it('keeps the singular for one', () => {
    expect(pluralize(1, 'itinerary', 'itineraries')).toBe('1 itinerary');
    expect(pluralize(1, 'trip')).toBe('1 trip');
  });
});
