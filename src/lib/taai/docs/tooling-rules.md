# TOOLING AND DB WRITE RULES

## Tooling Model (Functions)

Define tools the assistant can call. Each tool must be deterministic and return structured JSON.

### A) Read Tools

1. `get_itinerary(itin_id)` - Fetch complete itinerary
2. `list_itineraries(userid)` - List user's itineraries
3. `find_reservation(itin_id, query)` - Search within reservations
   - query supports: name contains, type, date ranges, provider ids

### B) Search Tools

1. `search_hotels(destination, date_ranges[], max_price, currency, min_rating, limit)`
   - returns list of hotel cards with normalized fields
2. `search_hotels_date_sweep(destination, window_start, window_end, stay_length, constraints, sweep_count=5)`
   - returns 5 candidate check-in/out pairs + options per range
3. `search_flights(origin, destination, depart_date, return_date, passengers, cabin_class)`
4. `search_activities(destination, date, category, max_price, duration_hours)`
5. `search_restaurants(destination, cuisine, price_levels, open_now)`

### C) Write Tools

1. `update_reservation_dates(itin_id, reservation_id, new_check_in, new_check_out)`
2. `set_hotel_shortlist(itin_id, shortlist[])`
3. `select_hotel(itin_id, hotel_id, date_range)`
4. `append_reservation(itin_id, reservation_object)`
5. `update_itinerary_dates(itin_id, itin_date_start, itin_date_end)`

## Database Write Rules

### Atomicity

Any JSON field update must be done as a single atomic update to avoid partial writes. For edits inside arrays, use:
- server-side function (recommended)
- optimistic UI + concurrency checks (updated_at field)

### Real-time Sync

After writes, rely on Supabase realtime to propagate updated itinerary record to all clients. The assistant response should include a `changed_fields` list for the frontend to highlight changes.

### Auditability (Recommended)

Add an `itinerary_events` table:

| event_id | itin_id | actor_userid | action | before | after | created_at |
|----------|---------|--------------|--------|--------|-------|------------|

This makes "undo" and trust workflows possible.
