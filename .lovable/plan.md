

# Replace Destination Text with Category Dot Icons

## What Changes
Replace the destination text inside the outline badge on each day row with small colored dots representing the event categories scheduled for that day. Each dot corresponds to a category (flight, hotel, activity, reservation). Multiple events of the same type show multiple dots. All dots are aligned side-by-side inside the existing badge bubble.

## Visual Result
Instead of seeing `Los Angeles, United States` in the badge, you'll see something like:
`[plane-dot] [plane-dot] [bed-dot] [activity-dot] [fork-dot]`

Each dot will be a small colored circle with a tiny icon inside, stacked horizontally.

## Category Colors and Icons
- **Flight**: `Plane` icon, blue tint (e.g., `text-blue-500`)
- **Hotel check-in/out**: `Bed` icon, purple tint (e.g., `text-purple-500`) -- single icon per hotel event
- **Activity**: `MapPin` icon, green tint (e.g., `text-green-500`)
- **Reservation**: `Utensils` icon, orange tint (e.g., `text-orange-500`)

## Technical Details

### File: `src/components/itinerary/DailyScheduleSection.tsx`

1. **Add imports**: Import `Plane`, `Bed`, `MapPin`, `Utensils` from `lucide-react`

2. **Replace the Badge content** (lines 195-197): Keep the `Badge` wrapper with `variant="outline"` but:
   - Remove `max-w-[120px] truncate` (no longer text)
   - Add `flex items-center gap-0.5` for horizontal dot layout
   - Remove `{destination}` text
   - Instead, map over the `events` array and render a small icon for each event:
     - A wrapper span with category-specific color
     - The corresponding Lucide icon at `h-3 w-3` size
   - If no events, show nothing (empty badge or hide it)

3. **Icon mapping helper**: A small inline map from event type to icon component and color class:
   ```
   flight -> Plane, text-blue-500
   hotel-checkin -> Bed, text-purple-500
   hotel-checkout -> Bed, text-purple-400
   activity -> MapPin, text-green-500
   reservation -> Utensils, text-orange-500
   ```

This is a single-file change affecting only lines ~195-197 plus the import line at the top.

