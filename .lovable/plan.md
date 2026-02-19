

# Fix Search Form Theming: Clean Dark Mode + Gradient Active Tab

## Problem
The dark mode CSS variables (`--secondary`, `--accent`, `--muted`, `--border`) are all mapped to white/light values (intentionally for dashboard metric cards), but this causes the search form to look broken in dark mode -- white backgrounds clashing with the dark card, unreadable labels, inconsistent borders. The light theme is nearly there but the active tab needs a touch of the brand gradient color.

## Root Cause
The global dark mode variables set `--secondary: white`, `--accent: white`, `--border: 80% gray`, `--muted-foreground: dark navy`. These work for dashboard surfaces but destroy the search form's readability when semantic classes like `bg-secondary`, `bg-accent`, and `border-border` are used.

## Approach
Use Tailwind `dark:` prefix overrides on search components to get proper dark styling without changing global CSS variables (which would break the dashboard). This keeps both themes completely independent.

## Changes

### 1. `src/components/search/AdaptiveSearchForm.tsx` -- Tabs + Active Tab Gradient

**TabsList**: Override dark mode background
```
bg-secondary border border-border
```
becomes:
```
bg-secondary dark:bg-white/5 border border-border dark:border-white/10
```

**TabsTrigger (all 6)**: Add brand gradient for active state in light mode, proper dark styling
```
text-foreground/60 hover:text-foreground hover:bg-accent
data-[state=active]:text-foreground data-[state=active]:bg-accent
```
becomes:
```
text-foreground/60 dark:text-white/50
hover:text-foreground dark:hover:text-white hover:bg-accent dark:hover:bg-white/5
data-[state=active]:text-foreground dark:data-[state=active]:text-white
data-[state=active]:bg-primary/10 data-[state=active]:text-primary
dark:data-[state=active]:bg-white/10 dark:data-[state=active]:text-primary
```

This gives:
- **Light mode**: Active tab gets a subtle rose/primary tint (the brand gradient color)
- **Dark mode**: Active tab gets a subtle white glow with rose text, inactive tabs are muted white

### 2. `src/components/search/DateRangePicker.tsx` -- Dark overrides

- Date container: add `dark:bg-white/5 dark:border-white/10`
- Date buttons: add `dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10`
- Labels: add `dark:text-white/60`
- Text spans: add `dark:text-white`
- Muted text: add `dark:text-white/40`
- Arrow: add `dark:text-white/20`

### 3. `src/components/search/fields/HotelSearchFields.tsx` -- Dark overrides

- Labels (`text-foreground/60`): add `dark:text-white/60`
- SelectTriggers (`bg-background/50 border-border text-foreground`): add `dark:bg-white/5 dark:border-white/10 dark:text-white`

### 4. `src/components/search/fields/FlightSearchFields.tsx` -- Dark overrides

- Labels: add `dark:text-white/60`
- Input fields: add `dark:bg-white/5 dark:border-white/10 dark:text-white dark:placeholder:text-white/30`
- Hint text: add `dark:text-white/30`
- SelectTriggers: add `dark:bg-white/5 dark:border-white/10 dark:text-white`
- Radio labels: add `dark:text-white`
- Swap button: add `dark:hover:bg-white/10 dark:text-white/50`

### 5. `src/components/search/fields/ActivitySearchFields.tsx` -- Dark overrides

- Labels: add `dark:text-white/60`
- Date button: add `dark:bg-white/5 dark:border-white/10`
- SelectTriggers: add `dark:bg-white/5 dark:border-white/10 dark:text-white`

### 6. `src/components/search/fields/CarSearchFields.tsx` -- Dark overrides (same pattern)

### 7. `src/components/search/fields/DiningSearchFields.tsx` -- Dark overrides (same pattern)

### 8. `src/components/search/fields/PackageSearchFields.tsx` -- Dark overrides (same pattern)

### 9. `src/components/inputs/PlaceSearch.tsx` -- Dark overrides

- Input: add `dark:bg-white/5 dark:border-white/10 dark:text-white dark:placeholder:text-white/30`
- Label: add `dark:text-white/60`
- Dropdown: add `dark:bg-[#1a1c2e] dark:border-white/10`
- Dropdown items: add `dark:text-white dark:hover:bg-white/5`

### 10. `src/pages/Search.tsx` -- Dark card override

- Main container: add `dark:bg-[#171820] dark:border-white/10`

## Visual Result

**Light Mode**:
- Warm off-white card with subtle warm-gray inputs
- Active tab gets a soft rose/coral tint from the brand gradient (primary/10 background + primary text)
- Clean, readable, elegant

**Dark Mode**:
- Dark navy card (#171820) with subtle white/5 input surfaces
- Soft white/10 borders throughout -- consistent and minimal
- Active tab glows with rose accent text on white/10 background
- All text is white at various opacities for hierarchy (100%, 60%, 40%, 30%)
- No clashing colors, no white blocks, sleek and unified

## Files to modify
1. `src/pages/Search.tsx`
2. `src/components/search/AdaptiveSearchForm.tsx`
3. `src/components/search/DateRangePicker.tsx`
4. `src/components/search/fields/HotelSearchFields.tsx`
5. `src/components/search/fields/FlightSearchFields.tsx`
6. `src/components/search/fields/ActivitySearchFields.tsx`
7. `src/components/search/fields/CarSearchFields.tsx`
8. `src/components/search/fields/DiningSearchFields.tsx`
9. `src/components/search/fields/PackageSearchFields.tsx`
10. `src/components/inputs/PlaceSearch.tsx`
