

# Remove Hardcoded Recent Activity Row from TravelHub

## What's Happening
The "recent activities" row at the bottom of TravelHub is entirely static placeholder data with no connection to any real user activity or database. It serves no functional purpose.

## Change

### `src/components/dashboard/sections/TravelHub.tsx`
1. Delete the `recentActivities` array (lines 67-71)
2. Delete the entire "Inline Recent Activity" JSX block (lines 100-109) — the div containing the clock icon and the activity text spans
3. Remove the `Clock` import from lucide-react since it's only used there

Everything else (quick actions grid, browse button, header) stays exactly as-is.
