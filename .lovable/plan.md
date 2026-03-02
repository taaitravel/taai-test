
# Fix Dark Mode Readability Across All Pages

## Root Cause
The dark mode CSS variables in `src/index.css` have critically broken values that make text invisible on dark backgrounds:

- `--muted-foreground: 240 16% 11%` (dark navy) -- used for descriptions/subtitles, **invisible** on dark background
- `--secondary: 0 0% 100%` (pure white) -- makes secondary backgrounds blindingly white
- `--accent: 0 0% 100%` (pure white) -- same issue for accent surfaces
- `--muted: 0 0% 100%` (pure white) -- same
- `--input: 0 0% 100%` (pure white) -- input fields are solid white in dark mode
- `--border: 0 0% 80%` (light gray) -- borders are too bright/visible

These variables were seemingly designed for a "white surface with dark text" pattern, but when components use `text-muted-foreground` directly on the dark background (which is extremely common), the text is dark navy on dark navy = invisible.

Additionally, several pages still use hardcoded dark colors (`bg-[#171821]`, `text-white`, `border-white/20`) instead of semantic variables, breaking light mode.

## Fix Strategy

### 1. Fix Dark Mode CSS Variables (`src/index.css`)

Update the `.dark` block to use proper readable values:

| Variable | Current (broken) | New (fixed) |
|---|---|---|
| `--muted-foreground` | `240 16% 11%` (dark navy) | `240 5% 65%` (light gray) |
| `--secondary` | `0 0% 100%` (white) | `240 14% 16%` (dark surface) |
| `--secondary-foreground` | `240 16% 11%` | `0 0% 90%` (light text) |
| `--muted` | `0 0% 100%` (white) | `240 10% 20%` (dark muted surface) |
| `--accent` | `0 0% 100%` (white) | `240 10% 18%` (dark accent surface) |
| `--accent-foreground` | `240 16% 11%` | `0 0% 90%` (light text) |
| `--input` | `0 0% 100%` (white) | `240 10% 18%` (dark input bg) |
| `--border` | `0 0% 80%` | `240 10% 22%` (subtle dark border) |
| `--popover-foreground` | `351 85% 75%` | `0 0% 90%` (neutral light) |

### 2. Fix Hardcoded Pages (convert to semantic variables)

**`src/pages/WhatWeDo.tsx`**:
- `bg-[#171821]` to `bg-background`
- `text-white` to `text-foreground`
- `text-white/80` to `text-foreground/80` or `text-muted-foreground`
- `border-white/20` to `border-border`
- `bg-[#171821]/60` to `bg-card/60`
- `bg-white/5` to `bg-accent/50`

**`src/pages/Contact.tsx`**:
- Same pattern: replace all `bg-[#171821]`, `text-white`, `border-white/X` with semantic equivalents

**`src/components/shared/PublicNavigation.tsx`**:
- `bg-[#171821]/95` to `bg-background/95`
- `text-white` to `text-foreground`
- `border-white/20` to `border-border`

**`src/components/subscription/SubscriptionCard.tsx`**:
- `bg-[#171821]/80` to `bg-card/80`
- `text-white` to `text-card-foreground`
- `text-white/70` to `text-muted-foreground`
- `border-white/30` to `border-border`

**`src/pages/Subscription.tsx`** (line 129):
- `text-[#171822]` on tab triggers to `text-secondary-foreground`

**`src/components/itinerary/ItineraryLoadingState.tsx`**:
- `bg-[#171821]` to `bg-background`
- `text-white` to `text-foreground`
- `text-white/70` to `text-muted-foreground`

**`src/pages/NotFound.tsx`**:
- `bg-gray-100` to `bg-background`
- Hardcoded gray text to semantic variables

**`src/pages/AdminDashboard.tsx`**:
- `text-white` to `text-foreground`
- `text-white/70` to `text-muted-foreground`

### 3. Sidebar Dark Mode Variables (also in `src/index.css`)

Update sidebar dark variables to match the new pattern:
- `--sidebar-accent` from `0 0% 100%` to `240 10% 18%`
- `--sidebar-accent-foreground` from `240 16% 11%` to `0 0% 90%`

## Files Changed (9 files)

1. `src/index.css` -- fix dark mode CSS variables
2. `src/pages/WhatWeDo.tsx` -- semantic variables
3. `src/pages/Contact.tsx` -- semantic variables
4. `src/pages/NotFound.tsx` -- semantic variables
5. `src/pages/AdminDashboard.tsx` -- semantic variables
6. `src/components/shared/PublicNavigation.tsx` -- semantic variables
7. `src/components/subscription/SubscriptionCard.tsx` -- semantic variables
8. `src/pages/Subscription.tsx` -- fix tab text color
9. `src/components/itinerary/ItineraryLoadingState.tsx` -- semantic variables
