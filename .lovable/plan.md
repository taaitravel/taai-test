Make the home page Upcoming/Past Trips stacks and the My Itineraries mobile stacks behave and look identical: one reusable swipe-enabled stack, sized 255×375 (the current home dimensions), wrapped in the home page's centered titled section layout.

## 1. Reusable stack component

Treat `MobileItineraryStack` as the single source of truth for "stack of trip cards".

- Already 255×375, already supports: horizontal swipe to cycle (looping 1↔N), vertical-up swipe to open, axis lock, indicator. No behavior changes needed.
- Add a small visual prop pass-through so it can be used outside the My Itineraries page without the collection action buttons (i.e. `showCollectionActions` defaults to `false` and is only enabled by `MobileStacksView`).
- Keep render of `ItineraryCard` inside; that component already mirrors the home page card content (emoji/dates/locations/people/status).

## 2. New shared section wrapper

Create `src/components/itinerary-stacks/StackSection.tsx`:

- Centered header: icon + title + count, matching the home page style (`text-lg font-semibold`, icon `h-5 w-5 mr-2`, centered on mobile).
- Body: renders `MobileItineraryStack` with the items, centered, with the existing 255×375 footprint and the `↔ browse · ↑ open` hint.
- Empty/loading states ported from `TripsSection` (Plane spinner, calendar/clock empty icons).

## 3. Home page (`TripsSection.tsx`)

Rewrite to use `StackSection` twice:

- "Upcoming" (Calendar icon) — upcoming trips
- "Past Trips" (Clock icon) — past trips

Remove the static `renderTripCard` stack and the `onTripClick` prop. Tap/up-swipe on the top card now navigates straight to `/itinerary?id=...` via `MobileItineraryStack`. Layout stays `grid grid-cols-1 md:grid-cols-2 gap-6`, centered on mobile.

## 4. Dashboard wiring (`DashboardContent.tsx`)

- Remove `TripBrowser` import + render and the `showTripBrowser` / `openTripBrowser` / `closeTripBrowser` props passed to `TripsSection`. Keep the existing "Browse trips" hero button working if it's still wanted, otherwise delete that hook usage. (Will check `useDashboardData` for unused state and prune.)
- Delete `src/components/dashboard/TripBrowser.tsx` (no longer used).

## 5. My Itineraries page (`MobileStacksView.tsx`)

- Replace its current left-aligned header row with the new `StackSection` wrapper so headers, spacing, and the stack itself are identical to home.
- Section order unchanged: "All Itineraries" (Globe icon) first, then each collection (Folder icon). Keep the "Open" affordance — move it to a small chevron link under/next to the centered title.
- Keep the "New Stack" dashed button at the bottom.
- Keep existing `idMap` fetch fix.

## 6. Out of scope

- Desktop My Itineraries grid/map/list views.
- Any AI categorization.
- Backend / data hooks (besides pruning the now-unused TripBrowser hook fields).
- Card visual restyle — `ItineraryCard` already provides the right look; we are only unifying size, gestures, and section chrome.

## Technical notes

- New file: `src/components/itinerary-stacks/StackSection.tsx`.
- Edited: `TripsSection.tsx`, `DashboardContent.tsx`, `MobileStacksView.tsx`, possibly `useDashboardData` (prune unused TripBrowser state).
- Deleted: `src/components/dashboard/TripBrowser.tsx`.
- `MobileItineraryStack` gains an optional `showCollectionActions` flag (default `false`); My Itineraries passes `true`, home passes nothing.
