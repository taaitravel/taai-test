# Traveler Metrics Modal (View Metrics button)

Keep the button and make it open a full traveler-analytics modal instead of removing it.

## What the modal shows

Computed from the traveler's own itineraries, saved/booked items and profile — no mock data. Metrics with no data show a clean empty state rather than a zero-filled card.

**Header row (lifetime since account inception)**
- Total past spend (completed trips)
- Projected spend (active + upcoming)
- Lifetime total
- Traveler level + progress to next level

**Travel footprint**
- Trips total / completed / upcoming
- Nights away (sum of trip durations)
- Countries visited, cities visited
- Hotel stays total and average nights per stay
- Flights logged and estimated miles covered (great-circle distance between flight origin/destination coordinates already stored on itinerary items; falls back to "add flights to see miles")
- Activities and dining reservations booked

**Money & behaviour**
- Average spend per trip and per night
- Most expensive trip
- Spend split by category (stays, flights, activities, dining, cars)
- Budget efficiency (spend vs budget where a budget exists)
- Cancellations count (items whose booking status is cancelled)
- Booking lead time (average days between booking and trip start)
- Busiest travel month / season

**Companions**
- Trips solo vs with companions
- Most frequent travel companions (from attendees)

## Layout

Dialog at `max-h-[90vh]` with flex-column internal scrolling, bright-card sections, mono labels and gradient numerals matching the existing Travel Metrics card. Mobile: single column, sticky title, side-by-side footer actions. Tabs or sections: Overview / Footprint / Spending / Companions.

## Technical notes

- New `src/hooks/useTravelerAnalytics.ts` aggregating from the already-fetched itineraries plus a query over `cart_items` (type, price, booking status, timestamps) for category split, cancellations and lead time; nothing new written to the database.
- New `src/components/dashboard/metrics/TravelerMetricsDialog.tsx` plus small stat/section subcomponents.
- `TravelMetrics.tsx` only gains dialog open state on the existing button; the current card stays as-is.
- Currency formatted via `formatMoney` with the profile currency preference; dates in the standard `MMM dd` format.
