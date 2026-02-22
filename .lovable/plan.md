

# Fix Donut Chart Center Label Layout

## Problem
The center text is too spread out vertically -- "of" and "$150,000" fall below the donut hole. The user wants all text consolidated inside the inner circle with this layout:

```text
$79,859.98
TOTAL SPENT OF
$150,000
```

## Changes

### `src/components/itinerary/BudgetPieChart.tsx` (lines 518-523)

Replace the current center label with:

- Line 1: `$totalSpent` value -- bold, pink/coral color (`text-[hsl(351,85%,75%)]`), larger font (~`text-xl`)
- Line 2: "TOTAL SPENT OF" -- small uppercase muted text (`text-[9px] tracking-wider`)
- Line 3: `$totalBudget` value -- bold foreground, medium font (~`text-base`)

The container div keeps `absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center` but uses tighter spacing (`leading-tight`) so everything fits within the ~104px inner radius of the donut.

### No other files affected

