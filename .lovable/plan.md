## Fix Search Stack

### 1. Fix `search-cities` edge function
Change `Deno.env.get('MAPBOX-TAAI-TOKEN')` → `Deno.env.get('MAPBOX_TAAI_TOKEN')`. The hyphenated name is invalid and is why PlaceSearch / destination autocomplete returns 500.

### 2. Graceful Yelp fallback
Update `search-yelp-businesses` to return `200 { businesses: [], disabled: true, reason: 'coming_soon' }` when `YELP_API_KEY` is missing, instead of throwing.

### 3. Dining tab: "Coming Soon" badge
- Keep Dining visible in the search category tabs (preserves memory'd order Properties → Flights → Activities → Cars → Packages → Dining).
- Add a small "Soon" badge on the Dining tab.
- In the Dining results view, when the function returns `disabled: true`, render a friendly empty state: "Restaurant search is coming soon — rolling out after launch." No error toast.

### 4. Verify other providers still work
Amadeus (flights, activities) and Booking.com (properties via RAPID_API_KEY) keys are confirmed. Mapbox token confirmed. No other changes needed.

### Files
- `supabase/functions/search-cities/index.ts` — env var fix
- `supabase/functions/search-yelp-businesses/index.ts` — soft-fail when key missing
- Dining results component + search tab bar — Coming Soon badge + empty state

No DB migrations, no new secrets.
