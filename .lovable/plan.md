
## Make Dashboard Trip Cards Match Itinerary Page Cards

The trip cards in `TripsSection.tsx` on the home/dashboard page are currently using plain `bg-card` styling, while the `ItineraryCard` component on the My Itineraries page uses the branded `trip-card-past` gradient background, responsive sizing, hover effects, location-based emojis, and status badges. This plan will align them.

### What Changes

**File: `src/components/dashboard/TripsSection.tsx`**

1. **Card class**: Replace `bg-card border-border` with `trip-card-past` to get the same rose/coral/gold gradient background
2. **Title hover**: Add `group-hover:text-white transition-colors` to the trip name heading
3. **Emoji logic**: Port the location-based emoji function from `ItineraryCard` (e.g., Japan = noodles, Paris = tower, beach = palm tree) instead of hardcoded emojis
4. **Location badges**: Match the pattern from ItineraryCard -- show first location + "+N more" badge instead of up to 2 full locations
5. **Status badge**: Add a status badge at the bottom (upcoming/active/completed) matching the ItineraryCard pattern
6. **Badge styling**: Match the exact badge classes: `text-[10px] sm:text-xs lg:text-sm bg-muted text-muted-foreground border-border px-1 sm:px-2`
7. **Responsive text sizes**: Match ItineraryCard sizes for emoji (`text-base sm:text-xl lg:text-2xl`), title (`text-sm sm:text-base`), dates (`text-xs sm:text-sm`), and attendee icon (`h-2.5 w-2.5 sm:h-3 sm:w-3`)

### Technical Details

- The `trip-card-past` CSS class is defined in `src/index.css` and provides the branded gradient background with light/dark mode variants
- The emoji and status logic will be extracted as helper functions within the component, mirroring the `getEmoji()` and `getStatus()` methods from `ItineraryCard`
- The stacked card layout (absolute positioning with translateY/translateX offsets) will remain unchanged
- The responsive container size `w-[255px] h-[375px]` already matches the ItineraryCard's largest breakpoint
