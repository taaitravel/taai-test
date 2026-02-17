

## Add Dining Search Tab with Reservation Deep-Links

### Overview
Add a "Dining" tab to the /search page that searches for restaurants via the existing Yelp API edge function (`search-yelp-businesses`), and generates OpenTable/Resy deep-links so users can book reservations directly.

### Changes

#### 1. Update SearchType to include "dining"

**Files:** `src/components/search/AdaptiveSearchForm.tsx`, `src/hooks/useSearchOrchestrator.ts`

- Add `'dining'` to the `SearchType` union: `'flights' | 'hotels' | 'cars' | 'activities' | 'packages' | 'dining'`

#### 2. Create DiningSearchFields component

**New file:** `src/components/search/fields/DiningSearchFields.tsx`

Fields:
- Location (reuse PlaceSearch in `restaurant` mode)
- Date (calendar picker)
- Time (select: common dinner slots like 6:00 PM, 7:00 PM, etc.)
- Party size (select: 1-10)
- Cuisine type (optional select: Italian, Japanese, Mexican, American, etc.)

#### 3. Add Dining tab to AdaptiveSearchForm

**File:** `src/components/search/AdaptiveSearchForm.tsx`

- Import `UtensilsCrossed` icon from lucide-react
- Add state for dining fields (location, date, time, partySize, cuisine)
- Add 6th TabsTrigger for "Dining" -- update grid from `grid-cols-5` to `grid-cols-6`
- Add TabsContent rendering DiningSearchFields
- Add dining case to `handleSubmit`, `isFormValid`, and `getSearchButtonText`

#### 4. Add dining search to orchestrator

**File:** `src/hooks/useSearchOrchestrator.ts`

- Add `case 'dining'` that:
  1. Geocodes the location using `search-cities` edge function (to get lat/lon)
  2. Calls the existing `search-yelp-businesses` edge function with `{ term: cuisine or "restaurant", latitude, longitude, location }`
  3. Maps Yelp results to a normalized format including name, rating, price level, image, address, phone, coordinates, and reservation links

#### 5. Generate reservation deep-links

In the orchestrator's dining result mapping, generate:
- **OpenTable link:** `https://www.opentable.com/s?term={restaurant_name}&covers={party_size}&dateTime={date}T{time}`
- **Resy link:** `https://resy.com/cities/{city}?query={restaurant_name}&date={date}&seats={party_size}`
- **Google Maps link:** `https://www.google.com/maps/search/?api=1&query={restaurant_name}+{address}`

These links open in a new browser tab for direct booking.

#### 6. Create DiningResultCard component

**New file:** `src/components/search/cards/DiningResultCard.tsx`

Display:
- Restaurant image (from Yelp)
- Name, rating (stars), price level ($ signs), cuisine categories
- Address
- "Reserve on OpenTable" and "Reserve on Resy" buttons (open deep-links in new tab)
- "View on Google Maps" secondary link

#### 7. Wire up result rendering

**Files:** `src/components/search/SearchResultsGrid.tsx`, `src/components/search/SearchResultsTree.tsx`

- Add `dining` case to render `DiningResultCard` for each result
- Enable map view for dining results (restaurants have lat/lon from Yelp)

#### 8. Update SearchResults and Search page

**File:** `src/components/search/SearchResults.tsx`

- Allow `showMapView` for dining type

**File:** `src/pages/Search.tsx`

- Update `showMapView` condition to include `'dining'`

### Technical Details

- No new edge functions needed -- reuses existing `search-yelp-businesses`
- No new API keys needed -- Yelp API key is already configured
- Deep-links to OpenTable/Resy are URL-based and require no API access
- The Yelp API returns up to 8 businesses per search (current limit in the edge function)

