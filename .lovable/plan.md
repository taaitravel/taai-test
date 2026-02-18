

# Align TravelHub Quick Actions with Search Tabs

## Problem
The TravelHub quick actions don't match the search page tabs. It has "AI Trip" and "Manual" buttons instead of mirroring the search categories, and it's missing "Packages" and "Dining".

## Changes in `src/components/dashboard/sections/TravelHub.tsx`

### Replace actions array
Remove "AI Trip" and "Manual" buttons. Replace with:

1. **New Itinerary** (gold-gradient, links to `/new-manual-itinerary`) -- uses `Plus` icon
2. **Properties** (links to `/search?tab=hotels`) -- uses `Hotel` icon, renamed from "Hotels" to match search naming
3. **Flights** (links to `/search?tab=flights`) -- uses `Plane` icon
4. **Activities** (links to `/search?tab=activities`) -- uses `Activity` icon (from lucide)
5. **Cars** (links to `/search?tab=cars`) -- uses `Car` icon
6. **Packages** (links to `/search?tab=packages`) -- uses `Package` icon
7. **Dining** (links to `/search?tab=dining`) -- uses `UtensilsCrossed` icon

### Update grid
Change from `grid-cols-3 sm:grid-cols-6` to `grid-cols-4 sm:grid-cols-7` to accommodate 7 buttons.

### Update imports
- Remove `Sparkles`, `Building2`, `MapPin`
- Add `Hotel`, `Activity`, `Package`, `UtensilsCrossed`

### Order and naming
Matches the search page tab order exactly (Properties, Flights, Activities, Cars, Packages, Dining), with "New Itinerary" prepended as the primary action.

