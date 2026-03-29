export const LOGO_URL = "/lovable-uploads/1c94ff06-05c4-46fe-b015-481744bc6ce1.png";

export const AUTHENTICATED_MENU_ITEMS = [
  { label: "Home", path: "/home" },
  { label: "Itineraries", path: "/itineraries" },
  { label: "New Itinerary", path: "/new-itinerary" },
  { label: "Manual Itinerary", path: "/new-manual-itinerary" },
  { label: "Subscription", path: "/subscription" },
  { label: "Profile & Settings", path: "/profile" },
] as const;

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
