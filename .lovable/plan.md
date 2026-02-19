

# Light Theme for Search Box

## Problem
The entire search form area uses hardcoded dark-mode colors (`bg-[#0f1221]`, `bg-[#1a1c2e]`, `bg-white/5`, `border-white/10`, `text-white`, `text-white/70`, etc.), making it unreadable and visually jarring in light mode. All colors need to be converted to semantic CSS variables.

## Files to Modify (9 files)

### 1. `src/pages/Search.tsx` (line 54)
- `bg-[#0f1221]` to `bg-card`
- `border-white/10` to `border-border`

### 2. `src/components/search/AdaptiveSearchForm.tsx`
- TabsList: `bg-[#1a1c2e]` to `bg-secondary`; `border-white/10` to `border-border`
- All 6 TabsTriggers: `text-white/60` to `text-muted-foreground`; `hover:text-white` to `hover:text-foreground`; `hover:bg-white/5` to `hover:bg-accent`; `data-[state=active]:text-white` to `data-[state=active]:text-foreground`; `data-[state=active]:bg-white/10` to `data-[state=active]:bg-accent`

### 3. `src/components/search/DateRangePicker.tsx`
- Label: `text-white/70` to `text-foreground/60`
- Date container: `bg-[#1a1c2e]` to `bg-secondary`; `border-white/10` to `border-border`
- Buttons: `bg-white/5` to `bg-background/50`; `border-white/10` to `border-border`; `hover:bg-white/10` to `hover:bg-accent`; `text-white/50` to `text-muted-foreground`
- Calendar icon and text spans: `text-white` to `text-foreground`
- Nights text: `text-white/50` to `text-foreground/50`

### 4. `src/components/search/fields/HotelSearchFields.tsx`
- Labels: `text-white/70` to `text-foreground/60`
- SelectTriggers: `bg-white/5` to `bg-background/50`; `border-white/10` to `border-border`; `text-white` to `text-foreground`

### 5. `src/components/search/fields/FlightSearchFields.tsx`
- Labels: `text-white/70` to `text-foreground/60`; `text-white` to `text-foreground`
- Input fields: `bg-white/5` to `bg-background/50`; `border-white/10` to `border-border`; `text-white` to `text-foreground`; `placeholder:text-white/40` to `placeholder:text-muted-foreground`
- Hint text: `text-white/40` to `text-foreground/40`
- SelectTriggers: same pattern as HotelSearchFields
- Swap button: `hover:bg-white/10` to `hover:bg-accent`; `text-white/60` to `text-foreground/60`

### 6. `src/components/search/fields/DiningSearchFields.tsx`
- Labels: `text-white` to `text-foreground`
- Date button: `bg-white/10` to `bg-background/50`; `border-white/20` to `border-border`; `text-white/60` to `text-muted-foreground`
- SelectTriggers: `bg-white/10` to `bg-background/50`; `border-white/20` to `border-border`; `text-white` to `text-foreground`

### 7. `src/components/search/fields/CarSearchFields.tsx`
- Same pattern as DiningSearchFields for labels, selects, date buttons
- Checkbox label: `text-white` to `text-foreground`

### 8. `src/components/search/fields/ActivitySearchFields.tsx`
- Same pattern as DiningSearchFields

### 9. `src/components/search/fields/PackageSearchFields.tsx`
- Package-includes box: `bg-white/5` to `bg-background/50`; `border-white/20` to `border-border`; `text-white/70` to `text-foreground/60`; `text-white` to `text-foreground`
- Labels, selects, swap button: same semantic replacements
- Checkbox label: `text-white` to `text-foreground`

### 10. `src/components/inputs/PlaceSearch.tsx`
- Input: `bg-white/5` to `bg-background/50`; `border-white/10` to `border-border`; `text-white` to `text-foreground`; `placeholder:text-white/40` to `placeholder:text-muted-foreground`
- Label: `text-white/70` to `text-foreground/60`
- Dropdown: `bg-[#1a1c2e]` to `bg-popover`; `border-white/10` to `border-border`
- Dropdown items: `text-white` to `text-popover-foreground`; `hover:bg-accent/30` to `hover:bg-accent`
- Loading/empty text: `text-white` to `text-popover-foreground`

## Result
The search box will use the warm off-white card background in light mode with charcoal text, and preserve the current dark look in dark mode -- all through semantic variables with zero hardcoded colors.

