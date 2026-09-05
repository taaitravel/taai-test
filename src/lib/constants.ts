import taaiWordmark from "@/assets/taai-wordmark.png.asset.json";

export const LOGO_URL = "/lovable-uploads/1c94ff06-05c4-46fe-b015-481744bc6ce1.png";
/** Tight long wordmark (no padding) — use where the logo must read clearly. */
export const LOGO_WORDMARK_URL = taaiWordmark.url;

export const AUTHENTICATED_MENU_ITEMS = [
  { label: "Home", path: "/home" },
  { label: "Discover", path: "/discover" },
  { label: "Itineraries", path: "/itineraries" },
  { label: "New Itinerary", path: "/new-itinerary" },
  { label: "Manual Itinerary", path: "/new-manual-itinerary" },
  { label: "Subscription", path: "/subscription" },
  { label: "Profile & Settings", path: "/profile" },
] as const;

export type DrawerItem = { label: string; path: string };
export type DrawerSection = { id: string; title: string; items: DrawerItem[] };

// Authenticated mobile drawer — secondary account/plan/support/legal surface.
// Primary navigation (Home, Itineraries, Search, New Trip, Profile) lives in
// the bottom nav; do NOT duplicate it here. Profile & Settings is retained
// as the documented account-management entry point.
export const AUTHENTICATED_DRAWER_SECTIONS: DrawerSection[] = [
  {
    id: "explore",
    title: "Explore",
    items: [{ label: "Discover Itineraries", path: "/discover" }],
  },
  {
    id: "account",
    title: "Account",
    items: [
      { label: "Profile & Settings", path: "/profile" },
      { label: "Traveler Preferences", path: "/profile?tab=preferences" },
      { label: "Traveler Setup", path: "/profile-setup" },
    ],
  },
  {
    id: "plan",
    title: "Plan",
    items: [{ label: "Subscription", path: "/subscription" }],
  },
  {
    id: "support",
    title: "Support",
    items: [{ label: "Contact Support", path: "/contact" }],
  },
  {
    id: "info-legal",
    title: "Info & Legal",
    items: [
      { label: "What We Do", path: "/what-we-do" },
      { label: "Privacy Policy", path: "/privacy-policy" },
      { label: "Terms of Service", path: "/terms" },
    ],
  },
];

export const PUBLIC_MENU_ITEMS = [
  { label: "What We Do", path: "/what-we-do" },
  { label: "Subscription", path: "/subscription" },
  { label: "Contact Us", path: "/contact" },
  { label: "Sign In", path: "/login" },
] as const;

export const FOOTER_LINKS = [
  { label: "Privacy Policy", path: "/privacy-policy" },
  { label: "Terms of Service", path: "/terms" },
  { label: "Contact Us", path: "/contact" },
  { label: "What We Do", path: "/what-we-do" },
] as const;
