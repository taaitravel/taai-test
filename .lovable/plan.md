

# Dashboard Hero Redesign: TravelHub Top + Stats Row

## Overview
Replace the current "Welcome back, TAAI!" hero with the Quick Actions (TravelHub) at the top, followed by a compact 3-column info row showing: Next Travel Date (left), Lifetime Total Spent (center), and Traveler Badge (right). Move the current "Lifetime Total Spent" card in TravelMetrics to show "Projected Spend" instead (only counting future-dated itineraries).

## Layout (top to bottom)

```text
+-----------------------------------------------------------+
| Quick Actions bar (AI Trip, Manual, Flights, Hotels, etc.) |
+-----------------------------------------------------------+
| Next Travel     |  Lifetime Total  |   Traveler Badge     |
| Mar 15          |  Spent           |   Explorer            |
| Trip Name       |  $XX,XXX         |   (countries/flights) |
| "5 days away"   |  (past only)     |                       |
+-----------------------------------------------------------+
```

## What Changes

### 1. `HeroSection.tsx` -- Complete Redesign
- Remove the old "Welcome back" greeting and the big plane animation
- Top: Render the TravelHub quick actions (currently at bottom of page)
- Below: A 3-column compact row:
  - **Left**: Next travel date + trip name + "X days away" badge (reuse existing UpcomingTravel logic, made compact)
  - **Center**: Lifetime Total Spent -- calculated from itineraries where `itin_date_start` is in the past (not future)
  - **Right**: Traveler level badge (Explorer, Adventurer, etc.) with countries/flights summary
- All text uses `text-foreground` and `text-foreground/60` (not `text-muted-foreground`) for dark mode visibility

### 2. `DashboardContent.tsx` -- Remove Duplicate QuickActions
- Remove the standalone `<QuickActions>` block that currently sits below TripsSection (it moves into the hero)
- Keep everything else (StatsSection, TripsFilter, TripsSection, etc.)

### 3. `calculateUserStats` in `dashboardUtils.ts` -- Split Spending
- Add a new `projectedSpend` calculation: sum of `spending` from itineraries where `itin_date_start > today`
- Rename existing `totalSpent` to only count itineraries where `itin_date_start <= today` (past/current trips)
- Pass both values through the stats pipeline

### 4. `TravelMetrics.tsx` -- Swap "Lifetime Total Spent" for "Projected Spend"
- The big spending card that currently shows "Lifetime Total Spent $XX,XXX" will now show "Projected Spend" (future trips only)
- The ranked trips list below it filters to future trips only

### 5. Dark Mode Text Fix
- Replace all `text-muted-foreground` in the new hero area with `text-foreground/60` per the project's semantic theme standard
- Ensures labels like "Upcoming Travel", "Lifetime Total Spent", trip names are all visible in dark mode

## Technical Details

### Modified Files

**`src/components/dashboard/HeroSection.tsx`**
- Remove imports for HeroWelcome, UpcomingTravel
- Import TravelHub, Badge, useDashboardSections
- Accept new props: `fullUserStats`, `onBrowseTrips`
- Render TravelHub at top, then 3-col stats row below

**`src/components/dashboard/DashboardContent.tsx`**
- Remove `<QuickActions>` from the bottom grid
- Pass `fullUserStats` and `onBrowseTrips` to HeroSection

**`src/lib/dashboardUtils.ts`**
- Split `totalSpent` into past-only spending
- Add `projectedSpend` for future-dated itineraries

**`src/hooks/useDashboard.ts`**
- Include `projectedSpend` in `fullUserStats`

**`src/components/dashboard/sections/TravelMetrics.tsx`**
- Change "Lifetime Total Spent" card to "Projected Spend"
- Filter ranked trips to future-only

### Files No Longer Needed (can be cleaned up later)
- `src/components/dashboard/sections/HeroWelcome.tsx` -- replaced by inline content
- `src/components/dashboard/sections/UpcomingTravel.tsx` -- plane animation removed, next trip info inlined
- `src/components/dashboard/QuickActions.tsx` -- TravelHub used directly

