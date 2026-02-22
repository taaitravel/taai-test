
## Fix Center Button Symmetry

The center "Search" circle button needs to sit exactly half-in, half-out of the navigation bar for perfect visual symmetry.

**The math:**
- The nav bar height is 60px
- The center button is 48px tall (w-12 h-12)
- To split it exactly in half, we need a negative margin-top of 24px (`-mt-6`)
- Currently it uses `-mt-4` (16px), which only lifts it partially

**Change in `src/components/navigation/MobileBottomNav.tsx` (line 44):**
- Replace `-mt-4` with `-mt-6` on the center action button

This single tweak ensures the circle is perfectly bisected by the top edge of the nav bar, creating the symmetrical "floating action" look.
