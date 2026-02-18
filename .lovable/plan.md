

# Free-Standing Hero Section + Dark Mode Fix

## Problem
1. The gradient backgrounds (`from-foreground/10 via-foreground/5`) create ugly shadowy boxes in dark mode
2. Everything is double-boxed (buttons inside a bordered container, stats inside bordered containers) -- looks cluttered
3. `text-muted-foreground` in TravelHub ("Quick Actions", recent activity text, browse button) is invisible in dark mode

## Changes

### 1. `HeroSection.tsx` -- Remove all container boxes
- Remove the outer `bg-gradient-to-br ... border border-border backdrop-blur-md rounded-2xl` wrapper around TravelHub
- Remove the same gradient/border/backdrop styling from each of the 3 stats cards
- Keep the grid layout and padding, just no background, no border, no gradient
- Stats will sit cleanly on the page background with just their icons and text

### 2. `TravelHub.tsx` -- Fix dark mode text visibility
- Replace `text-muted-foreground` with `text-foreground/60` on:
  - "Quick Actions" heading
  - Browse trips button text
  - Recent activity text and timestamps
- This ensures all text is visible against the dark background

### Visual Result (both themes)

```text
Quick Actions                          0 upcoming · 0 past
[AI Trip] [Manual] [Flights] [Hotels] [Cars] [Activities]
Updated Singapore budget (2h) · Added hotel (1d) · New itinerary (3d)

 Next Travel          Lifetime Total Spent       Traveler Level
 May 19               $48,159.86                 Explorer
 EDGAR FANTASTIC...   14 trips completed         17 countries · 24 flights
 90 days away
```

No boxes, no gradients, no borders -- just clean content on the page.

### Files Modified
- **`src/components/dashboard/HeroSection.tsx`** -- Strip gradient/border/backdrop classes from the TravelHub wrapper and all 3 stat card wrappers
- **`src/components/dashboard/sections/TravelHub.tsx`** -- Replace `text-muted-foreground` with `text-foreground/60` (3 locations)

