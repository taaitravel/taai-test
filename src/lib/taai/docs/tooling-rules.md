# TOOLING AND DB WRITE RULES

## Tooling Model (Functions)

Define tools the assistant can call. Each tool must be deterministic and return structured JSON.

### A) Read Tools

1. `get_itinerary(itin_id)` - Fetch complete itinerary
2. `list_itineraries(userid)` - List user's itineraries
3. `find_reservation(itin_id, query)` - Search within reservations
   - query supports: name contains, type, date ranges, provider ids

### B) Search Tools

1. `search_hotels(destination, check_in, check_out, guests, rooms, max_price, min_rating)`
   - returns list of hotel cards with normalized fields and diversity labels
2. `search_flights(origin, destination, depart_date, return_date, passengers, cabin_class)`
   - returns options with pricing and booking details
3. `search_activities(destination, date, category, max_price)`
   - returns activities with pricing and descriptions
4. `search_restaurants(destination, cuisine, price, open_now)`
   - returns restaurant options from Yelp

### C) Write Tools (Database Modifications)

1. `update_hotel_dates(itin_id, hotel_name, new_check_in, new_check_out?)`
   - Modify check-in/check-out for existing hotel
   - Returns: success, changed_fields, updated_item

2. `add_hotel_to_itinerary(itin_id, hotel_data)`
   - Add hotel from search results to itinerary
   - Auto-updates spending field
   - Returns: success, new_item, updated_spending

3. `add_flight_to_itinerary(itin_id, flight_data)`
   - Add flight from search results to itinerary
   - Auto-updates spending field

4. `add_activity_to_itinerary(itin_id, activity_data)`
   - Add activity from search results to itinerary
   - Auto-updates spending field

5. `remove_item_from_itinerary(itin_id, item_type, item_name)`
   - Remove any item type from itinerary
   - item_type: "hotel" | "flight" | "activity" | "reservation"
   - Auto-updates spending field

6. `update_itinerary_dates(itin_id, start_date?, end_date?)`
   - Update overall trip dates

7. `update_itinerary_budget(itin_id, budget?, spending?)`
   - Update budget or spending amounts

8. `create_itinerary(name, description?, start_date, end_date, locations?, budget?)`
   - Create new itinerary for user
   - Returns: new itinerary ID

### Safety Rules for Writes

- **Unique Identification**: Never modify a reservation unless the target item is uniquely identified.
- **Disambiguation**: If multiple items match, list options and ask user to specify.
- **Confirmation Required**: For high-impact changes (deletions, date shifts > 3 days, price changes > 20%), confirm before applying.
- **Changed Fields**: Always return `changed_fields` list for UI highlighting.
- **Audit Trail**: All changes logged to `itinerary_events` table with before/after state.

## Database Write Rules

### Atomicity

Any JSON field update must be done as a single atomic update to avoid partial writes. For edits inside arrays, use:
- server-side function (recommended)
- optimistic UI + concurrency checks (updated_at field)

### Real-time Sync

After writes, rely on Supabase realtime to propagate updated itinerary record to all clients. The assistant response should include a `changed_fields` list for the frontend to highlight changes.

### Audit Trail (itinerary_events table)

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| itinerary_id | BIGINT | Associated itinerary |
| user_id | UUID | User who made the change |
| action | TEXT | Operation type |
| item_type | TEXT | Type of item affected |
| item_id | TEXT | Identifier of the item |
| before_state | JSONB | Snapshot before change |
| after_state | JSONB | Snapshot after change |
| created_at | TIMESTAMPTZ | When change occurred |

This makes "undo" and trust workflows possible.
