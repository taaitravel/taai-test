

## Daily Schedule Redesign: Compact Rows + Collapsible Events + Calendar View

### Overview
Redesign the Daily Schedule section to be compact single-line rows per day that expand/collapse to show events. Add a day number circle, abbreviated weekday, holiday badges, and a user date-format preference stored in the database. Also add a toggleable calendar view of the itinerary.

---

### 1. Database: Add `date_format` column to `users` table

Add a new column `date_format` to the `users` table with a default of `'MM/DD/YY'`.

```sql
ALTER TABLE public.users 
ADD COLUMN date_format text DEFAULT 'MM/DD/YY';
```

### 2. Profile Setup: Add Date Format Picker

**File: `src/pages/ProfileSetup.tsx`**

Add a simple toggle/select in the profile settings allowing the user to choose between:
- `MM/DD/YY` (US format)
- `DD/MM/YY` (International format)

Save the selection to the `users.date_format` column.

### 3. Expose `date_format` in AuthContext

**File: `src/contexts/AuthContext.tsx`**

Ensure `userProfile` already includes the `date_format` field from the users table query. Since we read the full user row, this should come through automatically once the column exists.

### 4. Redesign DailyScheduleSection

**File: `src/components/itinerary/DailyScheduleSection.tsx`**

Complete rewrite of the day rendering:

**Each day row becomes a single thin line containing:**
1. A small circle with the day number (e.g., `16`) -- same font/color as current text, subtle bordered circle
2. Abbreviated weekday: `M`, `T`, `W`, `Th`, `F`, `S`, `Su`
3. Formatted date using user's preference (`MM/DD/YY` or `DD/MM/YY`)
4. Holiday badge (if applicable) -- small pill showing holiday name
5. Event count indicator (small dot or number if events exist that day)
6. Destination badge (kept, but smaller)

**Collapsible behavior:**
- Use Radix Collapsible (already installed) to wrap the events section
- Clicking the row toggles open/closed
- A small chevron icon indicates expandability
- Days with no events still show as a row but have no chevron/expand

**Holiday detection:**
- Build a static utility function `getHoliday(date: Date): string | null` covering major holidays:
  - New Year's Day (Jan 1)
  - Valentine's Day (Feb 14)
  - Easter (calculated dynamically)
  - Memorial Day (last Mon in May)
  - Independence Day (Jul 4)
  - Labor Day (first Mon in Sep)
  - Halloween (Oct 31)
  - Thanksgiving (4th Thu in Nov)
  - Christmas Eve (Dec 24)
  - Christmas Day (Dec 25)
  - New Year's Eve (Dec 31)

**New file: `src/lib/holidays.ts`**

### 5. Calendar View Toggle

**New file: `src/components/itinerary/ItineraryCalendarView.tsx`**

A month-grid calendar view showing:
- Each day cell with the day number
- Color-coded dots/pills for events (flights, hotels, activities, reservations)
- Clicking a day opens a small popover or expands to show that day's events
- Multi-month support for trips spanning months

**Integration in `src/components/itinerary/ItineraryContent.tsx`:**
- Add a toggle button group (List view | Calendar view) above the Daily Schedule card
- State toggles between `<DailyScheduleSection>` and `<ItineraryCalendarView>`
- Both components receive the same props

---

### Technical Summary

| Change | File |
|--------|------|
| Add `date_format` column | DB migration |
| Holiday utility | `src/lib/holidays.ts` (new) |
| Compact collapsible rows | `src/components/itinerary/DailyScheduleSection.tsx` |
| Calendar view | `src/components/itinerary/ItineraryCalendarView.tsx` (new) |
| View toggle | `src/components/itinerary/ItineraryContent.tsx` |
| Date format setting | `src/pages/ProfileSetup.tsx` |
| Read date_format from profile | `src/contexts/AuthContext.tsx` (verify) |

