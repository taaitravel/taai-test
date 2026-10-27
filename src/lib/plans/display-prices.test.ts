import { describe, expect, it } from 'vitest';
import { DISPLAY_PLAN_PRICES } from './display-prices';

describe('plan card display prices', () => {
  it('shows taaiTraveler+ yearly as $183', () => {
    expect(DISPLAY_PLAN_PRICES.taai_traveler_plus.annual).toBe(183);
    expect(DISPLAY_PLAN_PRICES.taai_traveler_plus.monthly).toBe(19);
  });
});
