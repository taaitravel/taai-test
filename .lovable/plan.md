

# Add Spending to Center of Donut Chart

## Problem
The donut chart center currently shows only "Total" and the budget amount, leaving a visual gap above it. The spending amount should also be displayed in the center to make better use of the space.

## Changes

### `src/components/itinerary/BudgetPieChart.tsx` (lines 517-521)
Update the center label overlay to show both the spending and budget:

- Line 1: "Spent" label in small muted text
- Line 2: The `totalSpent` value in a bold, color-coded style (using the existing pink/coral color `hsl(351,85%,75%)`)
- Line 3: A small separator or "of" text
- Line 4: "Budget" label in small muted text  
- Line 5: The `totalBudget` value in bold foreground text

This replaces the current center content which only shows "Total" and the budget number.

### No other files affected
The `totalSpent` and `totalBudget` variables are already computed in the component (lines 340-341), so no data changes are needed.

