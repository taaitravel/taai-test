# Glass Orb Bottom Nav

After 4.5s of no interaction, the mobile bottom tab bar smoothly morphs into a single floating glass orb. Any tap, scroll, or touch on the page expands it back to the full pill nav. Tapping the orb itself also expands it. Desktop is unaffected.

## Visual direction (sleek + clean)

- **Orb size:** 56px circle, centered at the same bottom position as the current pill (respects `safe-area-inset-bottom`).
- **Glass material:** `backdrop-blur-2xl` over a near-transparent card surface, 1px hairline border at `border/40`, soft elevated shadow.
- **Iridescence:** subtle conic-gradient sheen using the app's brand hues (rose → coral → amber → primary), rotating very slowly (~12s loop) at low opacity so it reads as a living glass marble, not a busy animation. Matches the homepage gradient palette.
- **Center mark:** small `Sparkles` icon at 60% opacity — no text, no badge.
- **Active route hint:** a 2px gradient ring around the orb indicates the current tab's accent color, so the user still gets a sense of place.

## Motion

- **Collapse (pill → orb):** 420ms cubic-bezier(0.22, 1, 0.36, 1). Width shrinks from full pill to 56px, labels fade out first (120ms), icons cross-fade into the central sparkle, border-radius interpolates to full.
- **Expand (orb → pill):** 320ms same easing, reverse — width grows, icons fade in staggered (30ms each), labels fade last.
- **Idle iridescence:** continuous, GPU-only (transform/opacity), pauses when `prefers-reduced-motion` is set.

## Behavior

- **Idle timer:** 4500ms. Resets on any of: `pointerdown`, `touchstart`, `scroll`, `keydown`, route change.
- **Initial state:** expanded on every route change, then collapses after 4.5s if no activity.
- **Tap target:** the orb is a single button — first tap expands (does NOT navigate), subsequent taps within the expanded pill behave normally.
- **Reduced motion:** skip the morph; cross-fade between pill and orb in 150ms; iridescence frozen.
- **Accessibility:** orb has `aria-label="Open navigation"` and `aria-expanded`. Pill buttons keep their existing labels. Focus moves to the first nav item when expanded via keyboard.

## Files touched

- `src/components/navigation/MobileBottomNav.tsx` — add `collapsed` state, idle timer, listeners, conditional render of orb vs pill, motion via Tailwind transitions.
- `src/index.css` — add `@keyframes orbShimmer` for the slow conic-gradient rotation and a `.glass-orb-sheen` utility.
- No changes to page padding (the orb sits in the same bottom slot as the pill, so existing `pb-28` clearance still works).

## Out of scope

- Top header collapse, radial menu, or replacing the bottom nav entirely (already declined).
- Persisting collapsed preference across sessions.

## Technical notes

- Use a single `useEffect` that attaches passive `pointerdown` / `scroll` / `keydown` listeners on `window` and a `setTimeout` that's cleared/restarted on each event.
- Use `useLocation` to reset on route change (already imported).
- Width animation uses `w-14` ↔ `w-full max-w-md` with `transition-[width,border-radius,padding] duration-[420ms]`.
- Iridescent sheen is a pseudo-element with `background: conic-gradient(from 0deg, hsl(var(--primary)/0.35), hsl(var(--accent)/0.25), hsl(340 90% 70% / 0.3), hsl(30 90% 70% / 0.3), hsl(var(--primary)/0.35))` and `animation: orbShimmer 12s linear infinite`. Masked behind the glass blur for a soft glow.
