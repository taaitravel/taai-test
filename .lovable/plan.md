

# Phase 1: Shared Components Refactoring

This phase tackles the building blocks that every page depends on. We'll standardize styling patterns, extract duplicated code into reusable components, and eliminate all hardcoded `dark:` overrides in favor of semantic CSS variables.

## Problem Summary

1. **Duplicated footer** -- identical footer markup copy-pasted in Index, WhatWeDo, Contact (3 places)
2. **Duplicated navigation menu items** -- Index page and MobileNavigation both define the same menu arrays independently
3. **Mixed styling approaches** -- 18 component files use `dark:text-white/60`, `dark:bg-white/5`, `dark:border-white/10` instead of semantic variables, creating an inconsistent dual system
4. **Profile components** use hardcoded dark overrides while the rest of the app uses semantic variables
5. **Search field components** (6 files) all use `dark:` overrides instead of semantic variables
6. **No shared constants** for routes, menu items, or brand assets

---

## Changes

### 1. Extract `PublicFooter` component
**New file: `src/components/shared/PublicFooter.tsx`**

A single reusable footer with the TAAI logo, tagline, and configurable nav links. Replace the duplicated footer blocks in Index.tsx, WhatWeDo.tsx, and Contact.tsx with `<PublicFooter />`.

### 2. Create shared route/menu constants
**New file: `src/lib/constants.ts`**

Centralize:
- `LOGO_URL` (the uploaded logo path used in 10+ files)
- `AUTHENTICATED_MENU_ITEMS` (used by Index.tsx and MobileNavigation.tsx)
- `PUBLIC_MENU_ITEMS` (used by Index.tsx)

Update Index.tsx and MobileNavigation.tsx to import from constants instead of defining inline.

### 3. Fix Profile components -- remove all `dark:` overrides
**Files: `src/components/profile/EditProfileSection.tsx`, `src/components/profile/PreferencesSection.tsx`**

Replace pattern:
- `dark:bg-white/5` → `bg-input` (already maps to `240 10% 18%` in dark mode)
- `dark:border-white/10` → `border-border`
- `dark:text-white` → `text-foreground`
- `dark:text-white/60` → `text-muted-foreground`
- `dark:text-white/40` → `text-muted-foreground`
- `dark:text-white/70` → `text-foreground/70`

### 4. Fix Profile page tab triggers
**File: `src/pages/Profile.tsx`**

Remove `dark:text-white/60 dark:data-[state=active]:text-white dark:data-[state=active]:bg-white/10` from TabsTriggers. Replace with semantic equivalents using the existing tab styling patterns.

### 5. Fix Search field components -- remove all `dark:` overrides
**Files (6):**
- `src/components/search/DateRangePicker.tsx`
- `src/components/search/fields/FlightSearchFields.tsx`
- `src/components/search/fields/HotelSearchFields.tsx`
- `src/components/search/fields/CarSearchFields.tsx`
- `src/components/search/fields/ActivitySearchFields.tsx`
- `src/components/search/fields/PackageSearchFields.tsx`

Same replacement pattern as profile components. Also update `src/components/inputs/PlaceSearch.tsx` and `src/components/search/fields/DiningSearchFields.tsx`.

### 6. Fix Search page hardcoded dark wrapper
**File: `src/pages/Search.tsx`** (line 54)

Replace `dark:bg-[#171820] dark:border-white/10` with semantic `bg-card border-border`.

### 7. Fix AdaptiveSearchForm tab triggers
**File: `src/components/search/AdaptiveSearchForm.tsx`**

Remove any `dark:` overrides on tab triggers, use semantic variables.

---

## File Count: ~15 files modified, 2 new files created

## Implementation Order
1. Create `constants.ts` and `PublicFooter.tsx` (foundations)
2. Update 3 pages to use `PublicFooter`
3. Fix profile components (2 files)
4. Fix Profile.tsx tab triggers
5. Fix search components (8 files)
6. Fix Search.tsx wrapper

