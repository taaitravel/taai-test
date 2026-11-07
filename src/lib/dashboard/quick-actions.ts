/**
 * Dashboard shortcuts. Search and a new itinerary stay available.
 * Travel booking checkout is intentionally not linked from here.
 */
export const DASHBOARD_QUICK_ACTIONS = [
  { label: 'New Itinerary', to: '/new-manual-itinerary' },
  { label: 'Properties', to: '/search?tab=hotels' },
  { label: 'Flights', to: '/search?tab=flights' },
  { label: 'Activities', to: '/search?tab=activities' },
  { label: 'Cars', to: '/search?tab=cars' },
  { label: 'Packages', to: '/search?tab=packages' },
  { label: 'Dining', to: '/search?tab=dining' },
] as const;

export function quickActionOpensCheckout(path: string): boolean {
  return path === '/cart' || path.startsWith('/checkout') || path.startsWith('/booking-success');
}
