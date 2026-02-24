

# Auto-Format Destinations on Save and Add

## Problem
Destination names are stored as-is without consistent formatting. The `enhance-city-formatting` edge function exists but is only triggered manually. We want it to run automatically every time a destination is added or an itinerary is saved.

## Changes

### 1. `src/components/itinerary/ItineraryContent.tsx` -- Auto-format on Add Destination

In `handleAddDestination`, after receiving the city name from `AddDestinationDialog` (which already provides lat/lng from PlaceSearch), pass the raw city name through `enhanceCityFormatting` to get the properly formatted "City, Country" name before saving.

- Call `enhanceCityFormatting([cityName])` from the existing `useEnhancedCityFormatting` hook (already imported)
- If it returns a result, use the `formattedName` instead of the raw `cityName` for both `itin_locations` and `itin_map_locations`
- Fall back to the original name if the enhancement fails

### 2. `src/pages/CreateManualItinerary.tsx` -- Auto-format on Create

In `handleCreateItinerary`, before inserting into Supabase:

- Import and use `useEnhancedCityFormatting`
- Call `enhanceCityFormatting(locationsArray)` on the array of city names
- Replace `locationsArray` and `selectedLocations` map entries with the enhanced formatted names and coordinates
- Fall back to originals if enhancement fails

### 3. `src/pages/CreateItinerary.tsx` -- Auto-format on Save (AI flow)

In `saveItinerary`, before the insert:

- Import and use `useEnhancedCityFormatting`
- Call `enhanceCityFormatting(itineraryData.locations)` if locations exist
- Update the locations and mapLocations with formatted names before saving
- Fall back to originals if enhancement fails

## Technical Details

- The `enhanceCityFormatting` function calls the `enhance-city-formatting` edge function which uses Mapbox geocoding to return `"City, Country"` formatted names with accurate lat/lng
- The hook is already available at `src/hooks/useEnhancedCityFormatting.ts`
- No new dependencies needed
- The formatting call is async, so each save/add operation will have a brief additional network call (~200-500ms)
- If the edge function fails, the original user-provided names are preserved as fallback
