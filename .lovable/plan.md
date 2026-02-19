

# Standardize Date Formatting and Styling Across All Search Fields

## Problem
Date fields are inconsistent across the search interface:
- **DateRangePicker** (Hotels, Flights, Cars, Packages): Uses `MMM dd` format (e.g., "Feb 20")
- **ActivitySearchFields**: Uses `PPP` format (e.g., "February 20th, 2026") -- much longer
- **DiningSearchFields**: Uses `PPP` format (e.g., "February 20th, 2026") -- much longer

Additionally, the selected date text should use the brand primary color to indicate an active/filled state, while unselected dates should show light grey/white in dark mode.

## Changes

### 1. `src/components/search/fields/ActivitySearchFields.tsx` -- Match date format
- Change `format(date, 'PPP')` to `format(date, 'MMM dd')` for consistency
- Add primary color when date is selected: `dark:text-primary` / `text-primary` for the filled state
- Keep `text-muted-foreground` / `dark:text-white/40` for placeholder ("Select date")

### 2. `src/components/search/fields/DiningSearchFields.tsx` -- Same treatment
- Change `format(date, 'PPP')` to `format(date, 'MMM dd')`
- Add primary color for selected date, light grey for unselected

### 3. `src/components/search/DateRangePicker.tsx` -- Active/inactive text colors
- When a date IS selected: the date value text gets `text-primary` (the rose brand color) in both themes
- When no date selected ("Select"): keep `dark:text-white/40` / `text-muted-foreground` (light grey)
- The label text (Depart, Return, etc.) stays `dark:text-white/60` / `text-foreground/60` -- neutral, not colored
- Calendar icon: when date selected, also tint with primary; when inactive, keep current muted color

## Detailed class changes

**DateRangePicker.tsx:**
- Date value spans (lines 63, 108): When date exists, add `text-primary` class; when no date, keep current muted styling
- Calendar icons (lines 60, 105): When date exists, use `text-primary`; otherwise `text-foreground/50 dark:text-white/40`
- Label spans (lines 62, 107): Keep as `text-foreground/60 dark:text-white/60` (no change)

**ActivitySearchFields.tsx (line 56):**
- Format: `'PPP'` becomes `'MMM dd'`
- Button class: when date selected, text becomes `text-primary`; when not, stays muted

**DiningSearchFields.tsx (line 61):**
- Format: `'PPP'` becomes `'MMM dd'`
- Button class: same active/inactive treatment

## Visual Result
- All date fields across Hotels, Flights, Cars, Activities, Dining, and Packages show dates as "Feb 20" format
- Selected dates glow with the brand rose/primary color in both light and dark mode
- Unselected dates show a subtle "Select date" in light grey (dark mode) or muted grey (light mode)
- Consistent, polished look across all tabs

## Files to modify
1. `src/components/search/DateRangePicker.tsx`
2. `src/components/search/fields/ActivitySearchFields.tsx`
3. `src/components/search/fields/DiningSearchFields.tsx`
