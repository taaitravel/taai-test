# Contrast & Color Balance Pass

## Problem

1. **Landing page feature icons are invisible.** In `src/pages/Index.tsx` the six feature icons (Plane, Map, Calendar, Users, BarChart3, MessageCircle) are hard-coded `text-white` and rendered directly on a white/off-white card with no colored container behind them. In light mode they vanish; in dark mode they're a lone white glyph floating on a dark card.

2. **Dark mode is "magenta on magenta."** In `src/index.css` the dark theme sets `--foreground`, `--card-foreground`, `--popover-foreground`, `--primary`, `--sidebar-foreground` all to the same rose `351 85% 75%`. Almost all body text, headings, and card text render in rose, and rose-tinted surfaces (gold-gradient buttons, primary chips, toasts) then place dark text back on rose — producing the repeating magenta wash the user is seeing with low contrast.

3. **No systematic use of the logo's second color (gold) or white** for dark-mode text/highlights, so nothing breaks up the rose dominance.

## Fix — Landing page icons (immediate)

In `src/pages/Index.tsx`:
- Wrap each `feature.icon` in a fixed circular badge: `h-14 w-14 rounded-2xl gold-gradient flex items-center justify-center shadow-md`.
- Drop the inline `text-white` from the icon JSX and let the icon inherit `text-primary-foreground` from the badge (white in both themes since `--primary-foreground` is white in light and dark backgrounds in dark mode — we'll force `text-white` on the badge wrapper instead so it's deterministic).
- Keep the existing hover scale on the wrapper.

Result: gold/rose gradient circle with a white icon, readable on both themes and on-brand.

## Fix — Dark mode token rebalance (`src/index.css`, `.dark` block only)

Goal: white as the default reading color, rose as accent, gold as secondary accent — matching the logo.

Token changes:

| Token | Before | After |
|---|---|---|
| `--foreground` | `351 85% 75%` (rose) | `0 0% 98%` (near-white) |
| `--card-foreground` | `351 85% 75%` | `0 0% 98%` |
| `--popover-foreground` | `351 85% 75%` | `0 0% 98%` |
| `--sidebar-foreground` | `351 85% 75%` | `0 0% 95%` |
| `--muted-foreground` | `240 5% 65%` | `240 5% 72%` (slightly lighter for AA) |
| `--primary` | `351 85% 75%` | keep — used as accent surface |
| `--primary-foreground` | `23 24% 11%` | keep dark text on rose buttons (still high contrast) |
| `--accent` | `240 10% 18%` | keep |
| `--ring` | `351 85% 75%` | keep |

Add a gold accent token already implied by `--rental` so components can opt-in:
- Introduce `--accent-gold: 36 100% 76%` and `--accent-gold-foreground: 30 50% 15%` in both themes (light: `36 100% 60%`).

Light mode is left untouched — it already reads well.

## Fix — Sitewide audit (mechanical, low-risk)

After the token swap, the rose-on-rose problem disappears for any component using semantic tokens. Remaining hotspots to scan and correct:

1. **Hard-coded `text-white` / `text-black` / `text-[#…]`** in components — replace with `text-foreground`, `text-primary-foreground`, or `text-white` only when the parent guarantees a dark/gradient background. Scope: `src/pages/Index.tsx`, `src/components/shared/*`, `src/components/booking/*`, dashboard hero, trip cards.
2. **Rose text on rose/gold gradient surfaces** — anywhere a `gold-gradient*`, `luxury-text-gradient`, `trip-card-past`, `toast-success` parent contains text using `text-primary` or `text-foreground`, switch to `text-white` (these surfaces are intentionally dark/saturated in both themes).
3. **Icon-only buttons inside primary-tinted backgrounds** — ensure `text-primary-foreground` (not `text-primary`).
4. **Cards with rose borders + rose text** — pages currently inheriting `text-card-foreground` automatically become white after the token change; verify nothing breaks visually.

I'll do this pass by ripgrep across `src/` for `text-white`, `text-black`, `text-primary"`, and `text-foreground` inside elements with `gold-gradient`/`bg-primary`, and adjust only the conflicting ones. Estimated 15–30 small edits, no logic changes.

## Out of scope

- No changes to light mode beyond the new gold accent token.
- No restructuring of components, no new dependencies, no copy changes.
- Toast gradients, trip-card gradients, and hero gradients keep their current look — only the text on top is verified for contrast.

## Validation

- Reload `/` in dark and light mode, confirm the six feature icons are visible and readable.
- Spot-check Dashboard, Itineraries, Booking Cart, and Profile pages in dark mode for any newly-broken contrast (e.g., a previously-rose label that now sits on a rose chip).
- No build/test commands required beyond the standard Lovable build that runs automatically.
