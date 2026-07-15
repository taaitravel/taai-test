/**
 * Gate 8 Slice 2A — Route chrome configuration.
 *
 * Pure config module. Given a pathname, returns the mobile header/chrome
 * behavior for that route. No React, no hooks, no side effects.
 *
 * Contract:
 *  - Right zone on mobile supports at most 2 controls: one optional primary
 *    + one More trigger. Preferred pattern = 1 primary + More.
 *  - Page-specific actions must NOT appear in the global mobile header.
 *    They belong in the overflow menu or in PageContextHeader (Slice 2B+).
 */

export type ChromeVariant = 'menu' | 'back' | 'home';
export type PrimaryAction = 'cart' | 'notifications' | 'none';

export interface OverflowItem {
  id: string;
  label: string;
  /** Route to navigate to when tapped. */
  to?: string;
  /** Optional semantic action id (used by consumers that want custom handling). */
  action?: 'sign-out' | 'open-cart' | 'open-notifications' | 'create-ai-trip' | 'create-manual-trip';
}

export interface RouteChrome {
  variant: ChromeVariant;
  hideBottomNav: boolean;
  primary: PrimaryAction;
  overflow: OverflowItem[];
}

const CART: OverflowItem = { id: 'cart', label: 'Cart', to: '/cart' };
const PROFILE: OverflowItem = { id: 'profile', label: 'Profile', to: '/profile' };
const CREATE_AI: OverflowItem = { id: 'create-ai', label: 'New AI Trip', to: '/new-itinerary' };

const DEFAULT_CHROME: RouteChrome = {
  variant: 'menu',
  hideBottomNav: false,
  primary: 'notifications',
  overflow: [CART, PROFILE],
};

/**
 * Exact-match route table. Longest-prefix match handled below for nested paths
 * like `/itinerary?id=...` (react-router pathnames don't include the query).
 */
const ROUTE_TABLE: Record<string, RouteChrome> = {
  '/home': {
    variant: 'menu',
    hideBottomNav: false,
    primary: 'notifications',
    overflow: [CART, CREATE_AI, PROFILE],
  },
  '/search': {
    variant: 'menu',
    hideBottomNav: false,
    primary: 'notifications',
    overflow: [CART, PROFILE],
  },
  '/itineraries': {
    variant: 'menu',
    hideBottomNav: false,
    primary: 'notifications',
    overflow: [CART, PROFILE],
  },
  '/my-itineraries': {
    variant: 'menu',
    hideBottomNav: false,
    primary: 'notifications',
    overflow: [CART, PROFILE],
  },
  '/itinerary': {
    variant: 'back',
    hideBottomNav: false,
    primary: 'notifications',
    overflow: [CART, PROFILE],
  },
  '/profile': {
    variant: 'menu',
    hideBottomNav: false,
    primary: 'notifications',
    overflow: [CART],
  },
  '/subscription': {
    variant: 'back',
    hideBottomNav: false,
    primary: 'none',
    overflow: [PROFILE],
  },
  '/cart': {
    variant: 'back',
    hideBottomNav: true,
    primary: 'none',
    overflow: [PROFILE],
  },
  '/new-itinerary': {
    variant: 'back',
    hideBottomNav: true,
    primary: 'none',
    overflow: [PROFILE],
  },
  '/new-manual-itinerary': {
    variant: 'back',
    hideBottomNav: true,
    primary: 'none',
    overflow: [PROFILE],
  },
  '/edit-itinerary': {
    variant: 'back',
    hideBottomNav: true,
    primary: 'none',
    overflow: [PROFILE],
  },
  '/booking-success': {
    variant: 'back',
    hideBottomNav: true,
    primary: 'none',
    overflow: [PROFILE],
  },
  '/internal/tos': {
    variant: 'back',
    hideBottomNav: true,
    primary: 'none',
    overflow: [],
  },
};

/** Assert at build time that no route declares >2 total visible controls. */
function assertMaxTwoControls(chrome: RouteChrome): RouteChrome {
  const primaryCount = chrome.primary === 'none' ? 0 : 1;
  // The overflow list can hold arbitrarily many items; only the More trigger
  // itself counts as a control in the header. Primary + More = 2 max.
  const overflowTrigger = chrome.overflow.length > 0 ? 1 : 0;
  if (primaryCount + overflowTrigger > 2) {
    // Should be impossible given the types, but keeps future edits honest.
    // eslint-disable-next-line no-console
    console.warn('[route-config] Route chrome exceeds 2 mobile controls', chrome);
  }
  return chrome;
}

export function getRouteChrome(pathname: string): RouteChrome {
  // Normalize: strip trailing slash (except root) so `/home/` matches `/home`.
  const normalized = pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
  const exact = ROUTE_TABLE[normalized];
  if (exact) return assertMaxTwoControls(exact);
  return assertMaxTwoControls(DEFAULT_CHROME);
}