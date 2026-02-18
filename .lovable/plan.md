

# Fix Trip Card Title Readability in Dark Mode

## Problem
The card title text on the dashboard trip cards is nearly invisible in dark mode because it blends with the gradient background. The user wants it to be dark (readable) by default and turn white on hover/click.

## Change

**File: `src/components/dashboard/TripsSection.tsx` (line 80)**

Update the `h4` class from:
```
text-foreground ... group-hover:text-white
```
To:
```
text-background dark:text-background ... group-hover:text-white dark:group-hover:text-white
```

This uses `text-background` which resolves to a dark color in dark mode (the navy background color), making the title readable against the peach/coral gradient card. On hover, it switches to white for contrast.

In light mode, `text-background` is the off-white color, which would not work -- so we scope this to dark mode only with a combined approach:
- Light mode: keep `text-foreground` (dark text on gradient -- already readable)
- Dark mode: use dark navy text via `dark:text-[#171820]` (matching the background)
- Hover (both): white text via `group-hover:text-white`

Final classes:
```
font-bold text-foreground dark:text-[#171820] text-sm sm:text-base mb-0.5 sm:mb-1 line-clamp-2 group-hover:text-white transition-colors
```

Single line change, no new files needed.
