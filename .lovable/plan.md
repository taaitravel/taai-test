

# Include Active Trips in Projected Spend

## Problem
Currently, "Projected Spend" only counts trips starting in the future (`itin_date_start > today`). Trips that have already started but haven't ended yet (e.g., started in January, ends in June) are excluded. These active trips should count as projected spend since they're still ongoing.

## Changes

### 1. `src/lib/dashboardUtils.ts` -- Update projected spend logic
- Change the `projectedSpend` filter from "start date in the future" to "end date in the future" (`itin_date_end >= today`)
- This captures both upcoming trips AND currently active trips
- Adjust `totalSpent` to only count fully completed trips (`itin_date_end < today`)

### 2. `src/components/dashboard/sections/TravelMetrics.tsx` -- Update ranked trips filter
- Change the ranked trips filter from `new Date(startDate) > today` to checking that the trip's end date hasn't passed yet
- This ensures active trips also appear in the projected spend ranked list

