

# Add Spending to Center of Donut Chart

## Problem
The donut chart center currently shows only "Total" and the budget amount ($150,000), leaving a visual gap in the upper portion of the circle. The spending total should also be displayed there.

## Changes

### `src/components/itinerary/BudgetPieChart.tsx` (lines ~517-521)
Update the center label overlay to show both values stacked:

- "Spent" label (small muted text)
- `$totalSpent` value (bold, pink/coral color `hsl(351,85%,75%)`)
- A thin separator or small gap
- "of" or "Budget" label (small muted text)
- `$totalBudget` value (bold, foreground color)

This replaces the current content which only shows "Total" and budget.

### No other files affected
Both `totalSpent` and `totalBudget` are already computed in the component.

