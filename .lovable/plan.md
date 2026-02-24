

# Dynamic Day Location from Booked Events

## Problem
The daily schedule destination badge (e.g., "LOS ANGELES") is assigned by cycling through the `destinations` array using modulo arithmetic (`destinations[index % destinations.length]`). This means the displayed location has no connection to what's actually booked for that day.

## Solution
Derive the destination label from the events scheduled for each day. Extract the city/location from flights, hotels, activities, and reservations that fall on that date. If multiple unique cities appear, show them joined (e.g., "Paris, Rome"). If no events exist for the day, fall back to the current round-robin behavior.

## Change

### `src/components/itinerary/DailyScheduleSection.tsx`

Replace line 131:
```
const destination = destinations[index % destinations.length];
```

With logic that:
1. Collects city names from all events for that day:
   - Flights: use the `to` field (arrival city) as primary, `from` field for departures
   - Hotels: use the `city` field
   - Activities: use the `city` field
   - Reservations: use the `city` field
2. Deduplicates and joins them (e.g., "Paris" or "Paris, Rome")
3. Falls back to `destinations[index % destinations.length]` if no event cities are found

This is a self-contained change -- only the destination derivation logic on ~line 131 changes. No other files or components are affected.
