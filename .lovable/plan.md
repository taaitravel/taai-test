
## Fix: Center Search Button Symmetry

The problem is that `-mt-6` on the button pushes it UP and away from the nav bar, making it float above. The fix is the opposite approach: make the nav container position itself relative, and use **absolute positioning** on the center button so it straddles the top edge of the nav bar exactly at its midpoint.

**Change in `src/components/navigation/MobileBottomNav.tsx`:**

1. Add `relative overflow-visible` to the `<nav>` element (line 33) so the center button can escape the container bounds
2. Replace the center button's `-mt-6` with absolute positioning: `absolute left-1/2 -translate-x-1/2 -top-6` which places the button so its center aligns with the top edge of the nav bar (button is 48px, so `-top-6` = -24px puts the midpoint right on the edge)
3. Add a spacer `div` (w-12) in the center button's place to keep the other 4 items evenly spaced
