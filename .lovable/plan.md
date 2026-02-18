

# Add Vacation Rentals + VRBO Differentiation to Properties Search

## Overview
Extend the Properties search to surface vacation rentals/apartments from Booking.com alongside regular hotels, visually distinguishing them with a gold/yellow tone and provider badges. Add a "Property Type" filter so users can toggle between Hotels, Vacation Rentals, or both.

## Changes

### 1. `src/hooks/useSearchOrchestrator.ts` -- Tag results with property type
- In the `hotels` case, after processing Booking.com results, add a `propertyCategory` field to each result
- Booking.com API returns `property.propertyType` or `property.accommodationTypeName` in the response -- parse this to tag results as `'hotel'` or `'rental'` (apartments, vacation homes, villas, hostels, etc.)
- Any property whose type includes keywords like "apartment", "vacation home", "villa", "holiday home", "homestay", "resort" gets tagged as `propertyCategory: 'rental'`, everything else as `propertyCategory: 'hotel'`
- Also add a `providerTag` field (always `'Booking.com'` for now -- future-ready for VRBO)

### 2. `supabase/functions/expedia-rapid-api/index.ts` -- Add VRBO search endpoint
- The Expedia Rapid API on RapidAPI can surface VRBO listings (VRBO is owned by Expedia Group)
- Update the existing edge function to also support a VRBO-specific host header (`vrbo.p.rapidapi.com` or route through `expedia13.p.rapidapi.com` with vacation rental parameters)
- Alternatively, if the Expedia API doesn't reliably return VRBO results, we search Booking.com with `accommodation_types` filter set to apartment/vacation rental types

### 3. `src/hooks/useSearchOrchestrator.ts` -- Merge VRBO/rental results
- After the Booking.com search, attempt an Expedia API search for vacation rentals in the same destination
- Tag Expedia/VRBO results with `propertyCategory: 'rental'` and `providerTag: 'VRBO'`
- Merge both result sets, interleaving rentals with hotels so the user sees a mix
- If Expedia/VRBO call fails, gracefully fall back to Booking.com-only results (no error shown)

### 4. `src/components/search/cards/HotelSearchCard.tsx` -- Gold styling for rentals
- Check `hotel.propertyCategory === 'rental'` to apply differentiated styling:
  - Card border changes from `border-white/20` to `border-[#ffce87]/40` (gold border)
  - Price text changes from pink (`#ff849c`) to gold (`#ffce87`)
  - The `+ Property` button gets a gold gradient instead of the default primary gradient
  - Source badge gets a subtle gold tint: `bg-[#ffce87]/10 text-[#ffce87]/80`
- For VRBO-sourced results specifically:
  - Add a small "V" icon badge in the top-left corner of the card (overlaying the image), styled with a gold background and dark text
  - The source badge reads "VRBO" instead of "Booking.com"
- Hotel-sourced results remain unchanged (current dark card with pink accents)

### 5. `src/components/search/HotelFilters.tsx` -- Add Property Type filter
- Add a new `propertyType` field to `HotelFilterState`: `'all' | 'hotel' | 'rental'`
- Add a "Property Type" filter section at the top of the filters panel with three radio-style options:
  - **All Properties** (default)
  - **Hotels Only** -- traditional hotels, resorts
  - **Vacation Rentals** -- apartments, villas, vacation homes (with a small gold dot indicator)
- Default to `'all'`

### 6. `src/hooks/useHotelFilters.ts` -- Apply property type filter
- Add `propertyType` to the `HotelFilterState` interface (default: `'all'`)
- In the `filteredResults` memo, add a check:
  - If `propertyType === 'hotel'`, only show results where `propertyCategory === 'hotel'`
  - If `propertyType === 'rental'`, only show results where `propertyCategory === 'rental'`
  - If `'all'`, show everything

### 7. Visual Summary

Hotels keep the current look:
- Dark card, pink price, pink "+ Property" button, "Booking.com" badge

Vacation Rentals (Booking.com sourced):
- Dark card with gold border glow
- Gold price text
- Gold "+ Property" button
- "Booking.com" badge with gold tint

VRBO Rentals:
- Same gold treatment as above
- Small gold "V" badge in top-left corner of image
- "VRBO" source badge

### 8. Itinerary Integration
- When a rental is saved to an itinerary via the `+ Property` button, the `item_data` in `cart_items` will include:
  - `propertyCategory: 'rental'`
  - `providerTag: 'VRBO'` or `'Booking.com'`
- This ensures the itinerary detail view can later render these with the same gold differentiation

## Files to modify
1. `src/hooks/useSearchOrchestrator.ts` -- tag results with propertyCategory + providerTag, add VRBO search
2. `src/components/search/cards/HotelSearchCard.tsx` -- conditional gold styling + V badge for VRBO
3. `src/components/search/HotelFilters.tsx` -- add Property Type filter section
4. `src/hooks/useHotelFilters.ts` -- filter by propertyType
5. `supabase/functions/expedia-rapid-api/index.ts` -- potential VRBO endpoint support

