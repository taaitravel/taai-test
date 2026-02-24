

# Replace Destination Text with Category Icon Dots

## What Changes
Replace the destination text (e.g., "Los Angeles, United States") inside the outline badge on each day row with small colored icons representing the event categories scheduled for that day. Each icon corresponds to a category. Multiple events of the same type show multiple icons. All icons are aligned side-by-side inside the existing badge bubble.

## Visual Result
Instead of seeing `Los Angeles, United States` in the badge, you will see colored icons like:
- A row of tiny icons: plane, plane, bed, map-pin, utensils
- If no events exist for the day, the badge is hidden

## Category Colors and Icons
- **Flight**: `Plane` icon, `text-blue-500`
- **Hotel check-in**: `Bed` icon, `text-purple-500`
- **Hotel check-out**: `Bed` icon, `text-purple-400`
- **Activity**: `MapPin` icon, `text-green-500`
- **Reservation**: `Utensils` icon, `text-orange-500`

## Technical Details

### File: `src/components/itinerary/DailyScheduleSection.tsx`

**No new imports needed** -- `Plane`, `Bed`, `MapPin`, `Utensils` are already imported on line 6.

**Replace lines 195-197** (the Badge): Keep the `Badge` wrapper with `variant="outline"` but:
- Remove `max-w-[120px] truncate` classes and `{destination}` text
- Add `flex items-center gap-0.5` for horizontal icon layout
- Map over the `events` array, rendering the matching Lucide icon (`h-3 w-3`) with its category color
- Only render the Badge if `hasEvents` is true (hide it on empty days)

**Icon mapping** (inline helper object):
```
flight       -> Plane,   text-blue-500
hotel-checkin  -> Bed,   text-purple-500
hotel-checkout -> Bed,   text-purple-400
activity     -> MapPin,  text-green-500
reservation  -> Utensils, text-orange-500
```

Single-file change, ~5 lines modified.

