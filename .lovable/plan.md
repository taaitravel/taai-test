

# Fix Invisible Icons and Elements on Profile/Preferences Page (Dark Mode)

## Problem
The Sun icon in the ThemeToggle (and the inactive Moon icon) use `text-muted-foreground`, which in dark mode resolves to dark navy (`hsl(240, 16%, 11%)`) -- essentially invisible against the dark background. Several other elements on the Preferences page also have visibility issues in dark mode for the same reason.

## Root Cause
The global dark mode `--muted-foreground` variable is set to a very dark value (for use on white dashboard cards). Any component sitting on the main dark background that uses `text-muted-foreground` becomes invisible.

## Changes

### 1. `src/components/shared/ThemeToggle.tsx` -- Fix icon visibility
- Replace `text-muted-foreground` with `text-foreground/40` for the inactive icon state
- This resolves to a visible muted white in dark mode and a muted dark in light mode
- Apply to both the Sun and Moon icons (inactive states) and the loading state icons

### 2. `src/components/profile/PreferencesSection.tsx` -- Dark mode overrides for cards
- Cards use `bg-card` which in dark mode is white -- but the page background is dark. Add `dark:bg-white/5 dark:border-white/10` to cards so they blend into the dark background instead of being bright white boxes
- Labels: add `dark:text-white/60` for visibility
- Select trigger: add `dark:bg-white/5 dark:border-white/10 dark:text-white`
- The "DD/MM/YY" outline button: add `dark:border-white/20 dark:text-white/70` so it's visible

### 3. `src/components/profile/EditProfileSection.tsx` -- Same dark card overrides
- Cards: add `dark:bg-white/5 dark:border-white/10`
- Input fields: add `dark:bg-white/5 dark:border-white/10 dark:text-white`
- Labels: add `dark:text-white/60`
- Hint text (muted-foreground): add `dark:text-white/40`

### 4. `src/pages/Profile.tsx` -- Fix profile tabs
- TabsList (`bg-muted`): add `dark:bg-white/5` so the tab bar isn't a white block
- TabsTrigger: add `dark:text-white/60` for inactive and `dark:data-[state=active]:text-white dark:data-[state=active]:bg-white/10` for active state

## Files to modify
1. `src/components/shared/ThemeToggle.tsx`
2. `src/components/profile/PreferencesSection.tsx`
3. `src/components/profile/EditProfileSection.tsx`
4. `src/pages/Profile.tsx`
