# AI Write Operations Specification

## Overview

The TAAI AI concierge can now perform real-time database modifications to user itineraries. All changes are tracked in the `itinerary_events` audit table for transparency and potential undo functionality.

## Available Write Operations

### 1. `update_hotel_dates`
Update check-in and/or check-out dates for a hotel in an itinerary.

**Parameters:**
- `itinerary_id` (required): The itinerary ID
- `hotel_name` (required): Name or partial name of the hotel
- `new_check_in` (required): New check-in date (YYYY-MM-DD)
- `new_check_out` (optional): New check-out date (YYYY-MM-DD)

**Example User Request:**
> "Hey TAAI, can you move my hotel check-in from June 10 to June 15?"

### 2. `add_hotel_to_itinerary`
Add a hotel from search results to an itinerary.

**Parameters:**
- `itinerary_id` (required): Target itinerary ID
- `hotel_data` (required): Full hotel object from search

**Flow:** Search → Select → Add to itinerary

### 3. `add_flight_to_itinerary`
Add a flight from search results to an itinerary.

**Parameters:**
- `itinerary_id` (required): Target itinerary ID
- `flight_data` (required): Full flight object from search

### 4. `add_activity_to_itinerary`
Add an activity from search results to an itinerary.

**Parameters:**
- `itinerary_id` (required): Target itinerary ID
- `activity_data` (required): Full activity object from search

### 5. `remove_item_from_itinerary`
Remove a hotel, flight, activity, or reservation from an itinerary.

**Parameters:**
- `itinerary_id` (required): The itinerary ID
- `item_type` (required): "hotel" | "flight" | "activity" | "reservation"
- `item_name` (required): Name or identifier of the item

**Example User Request:**
> "Remove the Grand Hotel from my Paris trip"

### 6. `update_itinerary_dates`
Update the overall trip start and/or end dates.

**Parameters:**
- `itinerary_id` (required): The itinerary ID
- `start_date` (optional): New start date (YYYY-MM-DD)
- `end_date` (optional): New end date (YYYY-MM-DD)

### 7. `update_itinerary_budget`
Update the budget or spending for an itinerary.

**Parameters:**
- `itinerary_id` (required): The itinerary ID
- `budget` (optional): New total budget amount
- `spending` (optional): New total spending amount

### 8. `create_itinerary`
Create a new itinerary for the user.

**Parameters:**
- `name` (required): Itinerary name
- `description` (optional): Trip description
- `start_date` (required): Start date (YYYY-MM-DD)
- `end_date` (required): End date (YYYY-MM-DD)
- `locations` (optional): Array of destination locations
- `budget` (optional): Total budget

---

## Confirmation Requirements

### Always Confirm Before Writing (High-Impact Changes):
- Deleting any item
- Date changes > 3 days
- Price/budget changes > 20%
- Adding items > $500

### Auto-Apply (No Confirmation Needed):
- Minor date adjustments (< 3 days)
- Adding items < $200
- Updating descriptions/notes

---

## Response Format for Writes

```json
{
  "success": true,
  "message": "Updated Grand Hotel check-in from June 10 to June 15",
  "changed_fields": ["check_in"],
  "before": { "check_in": "2024-06-10" },
  "after": { "check_in": "2024-06-15" },
  "updated_item": { ... },
  "updated_spending": 1500
}
```

For errors:
```json
{
  "error": "Hotel 'Grand Hotel' not found in this itinerary.",
  "available_hotels": ["Marriott Downtown", "Hilton Beach"],
  "message": "Available hotels: Marriott Downtown, Hilton Beach"
}
```

---

## Disambiguation Protocol

If multiple items match (e.g., "the hotel"):
1. List all matching items with identifiers
2. Ask user to specify which one
3. Never modify multiple items without explicit confirmation

**Example:**
> User: "Update the hotel dates"
> TAAI: "You have 2 hotels in this itinerary: Marriott Downtown and Hilton Beach. Which one would you like to update?"

---

## Audit Trail

All write operations are logged to the `itinerary_events` table:

| Field | Description |
|-------|-------------|
| `id` | Unique event ID |
| `itinerary_id` | Associated itinerary |
| `user_id` | User who made the change |
| `action` | Operation type (e.g., "update_hotel_dates") |
| `item_type` | Type of item affected |
| `item_id` | Identifier of the item |
| `before_state` | JSON snapshot before change |
| `after_state` | JSON snapshot after change |
| `created_at` | Timestamp of the change |

This enables:
- Full undo functionality
- Change history for users
- Trust and transparency
- Debugging and support

---

## Example Conversations

### Modifying Hotel Dates
**User:** "Hey TAAI, can you please move my check-in at the Grand Hotel from June 10 to June 15? Keep the checkout date the same."

**TAAI:** "Done! I've updated Grand Hotel check-in from June 10 to June 15. Your stay is now 5 nights (June 15-20)."

### Searching and Adding
**User:** "Find me hotels in London under $200/night for July 5-10"

**TAAI:** "Found 6 hotels in London. Browse the options below and tap 'Add to Itinerary' to save your favorite."

*[Shows hotel cards]*

**User:** "Add the Marriott to my London trip"

**TAAI:** "Added Marriott London to your London trip. Your total spending is now $1,450."

### Creating a Trip
**User:** "Create a new trip to Tokyo from March 15-25 with a $3000 budget"

**TAAI:** "Created new itinerary 'Tokyo Adventure' for March 15-25 with a $3,000 budget. Ready to search for flights and hotels?"
