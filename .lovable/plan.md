

# Center the Donut Chart Label Precisely

## Problem
The center label text appears shifted downward because `top-1/2` positions it at the center of the entire `ResponsiveContainer` (which includes the legend area below the pie). The pie itself sits higher, so the label doesn't align with the donut's visual center.

## Solution

### `src/components/itinerary/BudgetPieChart.tsx` (lines 517-522)

Adjust the center label positioning to account for the legend taking up space at the bottom. Instead of `top-1/2`, use a calculated offset that targets the actual center of the pie chart (not the full container).

Since the pie uses `cy="50%"` but the legend pushes it up, we need to shift the label upward. Replace:

```
top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
```

with a pixel-based approach that accounts for the legend:

```
top-[calc(50%-24px)] left-1/2 -translate-x-1/2 -translate-y-1/2
```

The `24px` offset compensates for roughly half the legend height, centering the label on the actual pie ring. This may need minor tweaking (~20-28px) after visual verification.

### No other files affected
