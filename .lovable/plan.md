

# Three Changes to Itinerary Schedule Views

## 1. Calendar Popover: Reorder Event Row Elements

**File: `src/components/itinerary/ItineraryCalendarView.tsx`** (lines 291-334)

Currently the popover event row shows: `[dot] [title] [time] ... [view button] [checkbox]` (right side).

Reorder to match the list view pattern: `[dot] [checkbox] [view button] [time] [title]` -- interactive elements first, then time, then title filling remaining space.

## 2. Calendar as Default View + Swap Button Order

**File: `src/components/itinerary/ItineraryContent.tsx`**

- **Line 79**: Change default state from `'list'` to `'calendar'`
- **Lines 266-271**: Swap the `ToggleGroupItem` order so Calendar appears first, List second

## 3. List View: Days with Events Open by Default

**File: `src/components/itinerary/DailyScheduleSection.tsx`**

- **Line 46**: Instead of initializing `openDays` as empty `{}`, compute the initial state by iterating through all days and setting `openDays[index] = true` for any day that has events (> 0). Use a `useMemo` or inline computation based on `buildEventsForDay` to pre-populate the map before the first render.

This way days with events show expanded by default, and users can collapse them manually.

