

## Plan: Pass Search Dates, Guest Counts, and Total Costs Through to Itinerary Items

### Problem Summary

When users search for hotels or activities with specific dates and guest/participant counts, that critical data is lost at multiple points in the pipeline:

1. **Search cards don't receive `searchParams`** -- the `CategoryCarousel` has `searchParams` but never passes them to individual `HotelSearchCard` or `ActivitySearchCard` components
2. **Activity cards use today's date** instead of the user's search date for the ItineraryMatcherModal
3. **Guest/room/participant counts are not stored** when items are saved to the itinerary
4. **Total trip cost is not calculated** (e.g., price x nights x rooms for hotels, price x participants for activities)
5. **The AddItemDialog (manual add) is missing** fields for number of guests/rooms (hotels) and number of participants (activities)

### Changes

#### 1. Pass `searchParams` down to search cards

**File: `src/components/search/CategoryCarousel.tsx`**
- Pass `searchParams` as a prop to `HotelSearchCard`, `ActivitySearchCard`, and other card components via `renderCard()`

#### 2. Update `HotelSearchCard` to use search params

**File: `src/components/search/cards/HotelSearchCard.tsx`**
- Accept optional `searchParams` prop (checkin, checkout, adults, rooms)
- Use `searchParams.checkin` / `searchParams.checkout` for the ItineraryMatcherModal `searchDates` instead of falling back to today
- Include `adults`, `rooms`, `checkin`, `checkout` in `item_data` when saving to `cart_items`
- Calculate and display total trip cost: `pricePerNight x nights x rooms`

#### 3. Update `ActivitySearchCard` to use search params

**File: `src/components/search/cards/ActivitySearchCard.tsx`**
- Accept optional `searchParams` prop (checkin, participants)
- Use `searchParams.checkin` for the ItineraryMatcherModal `searchDates` instead of hardcoded `new Date()`
- Include `date`, `participants` in `item_data` when saving to `cart_items`
- Calculate and display total group cost: `pricePerPerson x participants`

#### 4. Update `HotelResultCard` and `ActivityResultCard` (grid view cards)

**File: `src/components/search/cards/HotelResultCard.tsx`**
- Same changes as HotelSearchCard: accept `searchParams`, store dates/guests in `item_data`

**File: `src/components/search/cards/ActivityResultCard.tsx`**
- Same changes as ActivitySearchCard: accept `searchParams`, store date/participants in `item_data`

#### 5. Update `AddItemDialog` with missing fields

**File: `src/components/itinerary/AddItemDialog.tsx`**
- **Hotels form**: Add "Rooms" and "Guests" number inputs. Update total cost calculation to multiply `cost_per_night x nights x rooms`
- **Activities form**: Add "Participants" number input. Show calculated total: `cost_per_person x participants`
- Store these values (`rooms`, `guests`, `participants`) in the submitted item object so they appear in the itinerary schedule

#### 6. Pass `searchParams` through grid/map views

**File: `src/components/search/SearchResultsGrid.tsx`**
- Accept and forward `searchParams` to individual result cards

**File: `src/components/search/SearchResults.tsx`**
- Ensure `searchParams` flows to all view modes (tree, grid, map)

### Data Flow After Changes

```text
AdaptiveSearchForm
  --> searchParams { checkin, checkout, adults, rooms, participants }
    --> SearchResults
      --> CategoryCarousel (tree view)
        --> HotelSearchCard(hotel, searchParams)
          --> ItineraryMatcherModal(searchDates from searchParams)
          --> cart_items.item_data includes { checkIn, checkOut, adults, rooms, totalCost }
        --> ActivitySearchCard(activity, searchParams)
          --> ItineraryMatcherModal(searchDates from searchParams)
          --> cart_items.item_data includes { date, participants, totalCost }
      --> SearchResultsGrid (grid view)
        --> Same prop forwarding
```

### Summary of Files Changed

| File | Change |
|------|--------|
| `src/components/search/CategoryCarousel.tsx` | Forward `searchParams` to card components |
| `src/components/search/cards/HotelSearchCard.tsx` | Accept `searchParams`, use real dates, store guests/rooms, calculate total |
| `src/components/search/cards/ActivitySearchCard.tsx` | Accept `searchParams`, use real date, store participants, calculate total |
| `src/components/search/cards/HotelResultCard.tsx` | Accept `searchParams`, use real dates, store guests/rooms |
| `src/components/search/cards/ActivityResultCard.tsx` | Accept `searchParams`, use real date, store participants |
| `src/components/search/SearchResults.tsx` | Pass `searchParams` to all view sub-components |
| `src/components/search/SearchResultsGrid.tsx` | Forward `searchParams` to individual cards |
| `src/components/itinerary/AddItemDialog.tsx` | Add Rooms/Guests fields for hotels, Participants field for activities, update cost calculations |

