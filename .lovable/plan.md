

## Itinerary Event Completion Tracking + Scrollable Schedule + Notifications

### Overview
Three interconnected features: (1) scrollable daily schedule with max height, (2) per-event completion tracking stored in the database for user insights and future gamification, and (3) automatic check-in/reminder notifications.

---

### 1. Database: `itinerary_event_completions` table

New table to track completion status for each event within an itinerary.

```sql
CREATE TABLE public.itinerary_event_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_id bigint NOT NULL,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  event_type text NOT NULL,        -- 'flight', 'hotel-checkin', 'hotel-checkout', 'activity', 'reservation'
  event_index integer NOT NULL,     -- index in the itinerary array
  event_date date,                  -- the date of the event
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

RLS policies: users can SELECT/INSERT/UPDATE/DELETE their own rows (matched on `user_id = auth.uid()`).

A unique constraint on `(itinerary_id, user_id, event_type, event_index)` prevents duplicates.

This table supports:
- Tracking which events were completed per user
- Future analytics on completion rates per event type
- Travel agent visibility into guest engagement
- Gamification (points/rewards based on completions)
- Booking confirmation tracking when direct booking is added

### 2. Scrollable Daily Schedule

**File: `src/components/itinerary/DailyScheduleSection.tsx`**

- Wrap the day list inside a `ScrollArea` with `max-h-[1220px]` (from `@radix-ui/react-scroll-area`, already installed)
- The card itself stays within the layout; the inner content scrolls

### 3. Completion Check Icon on Each Event Row

**File: `src/components/itinerary/DailyScheduleSection.tsx`**

Replace the empty circle button at the end of each event row with a clickable check icon:
- Uncompleted: outlined circle (current look)
- Completed: filled check circle in primary color
- Clicking toggles the completion status in the database
- Shows a small toast confirmation on toggle

New hook: `src/hooks/useEventCompletions.ts`
- Fetches completions for a given itinerary
- Provides `toggleCompletion(eventType, eventIndex, eventDate)` function
- Optimistic UI updates with database sync
- Returns a map of `{eventType-eventIndex: boolean}` for quick lookups

### 4. Completion Summary Per Day

In the collapsed row, show a small fraction like "2/4" next to the event count, indicating how many events that day have been completed. This gives at-a-glance progress.

### 5. Automatic Reminder Notifications

**New edge function: `supabase/functions/generate-reminders/index.ts`**

This function can be called (or scheduled via cron later) to generate reminder notifications:
- Scans itineraries with events happening in the next 24 hours
- Creates notification rows for each upcoming event:
  - "Remember to check in at Zedwell Hotel at 3:00 PM (05/19)"
  - "Flight AA123 departs at 6:00 AM tomorrow"
  - "Dinner reservation at Nobu at 7:30 PM today"
- Skips events that already have a notification or are already completed
- Uses the `notifications` table (already exists with realtime subscription)

For now, this function will be callable manually or from the frontend when a user opens their itinerary. A future enhancement can add a Supabase cron job for automatic daily generation.

**Integration in `src/components/itinerary/ItineraryContent.tsx`:**
- Call the edge function on itinerary load for upcoming itineraries to generate any pending reminders

---

### Technical Summary

| Change | File |
|--------|------|
| New completions table | DB migration |
| Scrollable schedule | `DailyScheduleSection.tsx` |
| Completion toggle UI | `DailyScheduleSection.tsx` |
| Completion hook | `src/hooks/useEventCompletions.ts` (new) |
| Reminder edge function | `supabase/functions/generate-reminders/index.ts` (new) |
| Trigger reminders on load | `ItineraryContent.tsx` |
| Props update | `ItineraryContent.tsx` passes itinerary ID to schedule |

