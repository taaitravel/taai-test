
# Reorder Event Row: Checklist First, Then View, Then Time + Title

## What Changes
Restructure each event row so elements appear in this order from left to right:

1. **Checklist toggle button** (CheckCircle2 / Circle) -- far left, always visible
2. **View details button** (ExternalLink) -- next
3. **Time** -- next
4. **Title + Subtitle** -- fills remaining space, truncates if needed

## Technical Details

### File: `src/components/itinerary/DailyScheduleSection.tsx`

**Lines 224-274** -- Restructure the event row layout:

- Move the checklist `<button>` (currently lines 259-272) out of the right-side div and make it the **first child** of the row
- Move the view-details `<button>` (currently lines 248-257) to be the **second child**
- Move the time `<span>` (currently lines 243-245) to be the **third child**
- Keep the title + subtitle div as the **last child**, filling remaining space with `flex-1 min-w-0`

New row structure:
```
[Checkbox] [View Button] [Time] [Title + Subtitle (truncated)]
```

No new imports or logic changes -- purely reordering existing elements within the row flex container and removing the nested right-side wrapper div.
