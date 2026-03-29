

# Extend Calendar View Beyond Trip Dates

## Problem
The calendar currently only renders months that the trip spans. There's no room to see dates before or after the trip, making the view feel cramped and limiting context.

## Solution
Extend `tripMonths` computation to include 1 month before the trip start and 1 month after the trip end. Also remove the fixed `h-[1100px]` on the ScrollArea so the calendar can breathe naturally.

## Technical Details

### File: `src/components/itinerary/ItineraryCalendarView.tsx`

**Lines 61-70** (`tripMonths` useMemo): Change the cursor start to 1 month before `tripStart` and the end boundary to 1 month after `tripEnd`:

```ts
const tripMonths = useMemo(() => {
  const months: { month: number; year: number }[] = [];
  const cursor = new Date(tripStart.getFullYear(), tripStart.getMonth() - 1, 1); // 1 month before
  const endMonth = new Date(tripEnd.getFullYear(), tripEnd.getMonth() + 1, 1);   // 1 month after
  while (cursor <= endMonth) {
    months.push({ month: cursor.getMonth(), year: cursor.getFullYear() });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return months;
}, [startDate, duration]);
```

**Line 126**: Remove the fixed height constraint from `ScrollArea` — change `h-[1100px]` to `max-h-[1200px]` so it can size naturally but still scrolls for very long trips.

