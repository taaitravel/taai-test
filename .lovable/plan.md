

# Lifetime Total Spent -- Layout + Data Changes

## Changes

### 1. `src/components/dashboard/HeroSection.tsx` -- Redesign the center stat
- Remove the `DollarSign` icon entirely
- Make the dollar amount the hero element (large, prominent)
- Move "Lifetime Total Spent" label below the amount
- Show trip count in parentheses next to "Lifetime Total Spent", e.g. `Lifetime Total Spent (14 trips)`
- Combine `totalSpent + projectedSpend` into one total so it reflects all spending across the user's lifetime (past + active + future)
- Remove `DollarSign` from imports

### 2. `src/lib/dashboardUtils.ts` -- Add combined lifetime total
- Add a new `lifetimeTotal` field to the return object: `totalSpent + projectedSpend`
- This gives a single realistic number covering all trips ever

### 3. `src/hooks/useDashboard.ts` -- Pass `lifetimeTotal` through
- Include `lifetimeTotal` in `fullUserStats`

### 4. `src/components/dashboard/HeroSection.tsx` -- Update interface
- Add `lifetimeTotal` to the `fullUserStats` type

### Result
```
$64,481.76
Lifetime Total Spent (14 trips)
```

No icon, amount is the headline, label + trip count below in parentheses, and the number includes all spending (completed + active + future).

