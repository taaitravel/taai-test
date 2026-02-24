

# Fix: View Details Button Not Opening Modal

## Problem
When clicking the "View details" button (the small circle with an external link icon) on an event in the Daily Schedule, nothing happens. The button calls `onViewItem`, which triggers `openFlightBrowser(index)` / `openHotelBrowser(index)` etc. These functions correctly set `browserState.flightBrowserOpen = true` (and similar), but **no component reads `browserState`** to render a modal. The state is set but never consumed -- the modal simply does not exist yet.

## Solution
Add a detail viewer Dialog in `Itinerary.tsx` that:
1. Reads `browserState` to determine which item type is open and at which index
2. Renders a Dialog showing the selected item's details
3. Uses the existing close functions (`closeFlightBrowser`, etc.) to dismiss it

## Technical Details

### File: `src/pages/Itinerary.tsx`

1. Import `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle` from `@/components/ui/dialog`
2. Import category icons (`Plane`, `Building2`, `MapPin`, `Utensils`) from `lucide-react`
3. After the existing `<AddItemDialog>`, add a new `<Dialog>` that:
   - Computes `isOpen` from `browserState.flightBrowserOpen || hotelBrowserOpen || activityBrowserOpen || reservationBrowserOpen`
   - Determines the active type and index from whichever is open
   - Pulls the item from `itineraryData[type][index]`
   - Renders a detail view with the item's key fields (name, dates, city, cost, etc.)
   - On close, calls the corresponding `close*Browser()` function
   - Includes an "Edit" button that closes the viewer and opens the existing edit dialog

4. The detail content will render different fields based on type:
   - **Flight**: airline, flight number, from/to, departure/arrival, cost
   - **Hotel**: name, city, check-in/check-out, cost
   - **Activity**: name, city, date, cost
   - **Reservation**: name, type, city, date, time, cost

This is a single-file change to `src/pages/Itinerary.tsx` -- no new components needed.
