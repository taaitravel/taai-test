

## Theme-Wide Dark Mode Fixes

Two changes applied at the CSS variable / component level so they propagate everywhere automatically.

### Change 1: Remove Secondary Opacity

Replace all `bg-secondary/60` with `bg-secondary` (full opacity white) across:

- `src/pages/Subscription.tsx` (line 78) -- billing toggle container
- `src/components/dashboard/sections/TravelMetrics.tsx` (lines 47, 62, 80, 107) -- metric cards

### Change 2: Darken Muted Foreground in Dark Mode

**File: `src/index.css`** (line 79 in the `.dark` block)

Change:
```css
--muted-foreground: 0 0% 64%;    /* #a3a3a3 medium grey */
```
To:
```css
--muted-foreground: 240 16% 11%; /* #171821 dark navy */
```

This affects all 1,024 uses of `text-muted-foreground` across 65 files -- labels, descriptions, timestamps, icons, placeholders, etc.

**Important caveat**: This will make muted text nearly invisible on the dark navy background (`--background` is also `240 16% 11%`). It will only be legible on white/light surfaces (cards with `bg-secondary`, tabs, toggles, etc.). Elements sitting directly on the dark page background will need individual fixes in follow-up passes.

### Files to Modify
1. `src/index.css` -- `--muted-foreground` in `.dark` block
2. `src/pages/Subscription.tsx` -- `bg-secondary/60` to `bg-secondary`
3. `src/components/dashboard/sections/TravelMetrics.tsx` -- 4 instances of `bg-secondary/60` to `bg-secondary`

