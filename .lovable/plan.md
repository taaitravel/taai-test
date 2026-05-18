## Liquid Glass Orb

Push the collapsed orb toward Apple's "Liquid Glass" look from the reference: a true refractive bubble — chunky inner rim, crisp top specular, soft bottom caustic, color living *inside* the sphere rather than as a halo around it.

### Visual targets (from reference)

1. **Spherical depth, not a flat disc.** Two layered inset rims + a thick top highlight to fake curvature.
2. **Refractive interior.** Color shimmer sits *inside* the orb behind a frosted layer, with edges that bend light.
3. **Crisp glass edge.** A bright 1px hairline + a soft outer halo — no hard border.
4. **Restraint.** The logo stays the hero. Effects sit behind/around it, never on top.

### Layer stack (collapsed state only)

Rendered inside `<nav>` in this order, all `pointer-events: none` except the click target:

```
┌─ outer halo shadow (soft drop + 1px crisp rim)
│  ┌─ backdrop-blur-2xl (refracts content behind)
│  │  ┌─ liquid base gradient (theme-aware, very low opacity)
│  │  │  ┌─ interior color blob (sheen, blurred, clipped inside)
│  │  │  │  ┌─ frosted veil (white/black 4% + saturate filter)
│  │  │  │  │  ┌─ bottom caustic (soft warm glow at 70% height)
│  │  │  │  │  │  ┌─ top specular highlight (crescent, brightest point)
│  │  │  │  │  │  │  ┌─ inner bezel rim (inset white 1px + inset shadow)
│  │  │  │  │  │  │  │  └─ logo (z-10, drop-shadow)
```

### Concrete changes

**`src/index.css` — replace orb utilities:**

- `.glass-orb-base`
  - Light: `linear-gradient(155deg, hsl(0 0% 100% / 0.55) 0%, hsl(240 16% 92% / 0.35) 100%)`
  - Dark: `linear-gradient(155deg, hsl(240 14% 22% / 0.55) 0%, hsl(240 16% 8% / 0.4) 100%)`
- `.glass-orb-sheen` — drop blur from 10px → 18px, opacity ceiling ~0.5, scale `inset: -10%` (kept inside), add `mix-blend-mode: screen` (light) / `plus-lighter` (dark) so color reads as refracted light, not paint.
- `.glass-orb-bezel` box-shadow becomes the full sphere illusion:
  ```
  inset 0  1.5px 0   hsl(0 0% 100% / 0.7),     /* top edge gleam */
  inset 0 -1px   0   hsl(0 0% 100% / 0.25),    /* bottom edge gleam */
  inset 0  8px  14px -8px hsl(0 0% 100% / 0.45),/* upper inner glow */
  inset 0 -10px 16px -10px hsl(240 16% 5% / 0.35), /* lower inner shadow */
  0 1px 0 hsl(0 0% 100% / 0.4),                /* crisp outer rim */
  0 10px 30px -10px hsl(240 16% 5% / 0.35),    /* main drop */
  0 2px 8px  -2px hsl(240 16% 5% / 0.2)        /* contact shadow */
  ```
  Dark variant swaps inner shadow to deeper black and reduces top white to 0.35.
- `.glass-orb-bezel::before` (top specular) — narrow it to an ellipse `45% × 28% at 32% 18%`, raise center white to 0.75 (light) / 0.4 (dark), fade harder (transparent by 45%) so it reads as a single sharp catch-light, not a wash.
- **New** `.glass-orb-bezel::after` (bottom caustic) — small radial at `50% 78%`, warm primary tint `hsl(var(--primary) / 0.18)` fading to transparent by 40%, gives the sphere a glowing underbelly.
- Add `backdrop-filter: blur(20px) saturate(140%)` to a new `.glass-orb-frost` utility for the refraction layer.

**`src/components/navigation/MobileBottomNav.tsx`:**

- Collapsed `<nav>` classes: `glass-orb-base glass-orb-frost glass-orb-bezel border-transparent` (drop the old `backdrop-blur-2xl` from collapsed branch; it's now in `glass-orb-frost` with saturation).
- Sheen `<span>`: change `inset` via class to stay clipped, add `mix-blend-mode-screen dark:mix-blend-plus-lighter` (use inline style — Tailwind has no util), keep `z-0`.
- Logo button stays `z-10`, no change.
- No structural/animation changes; idle timer and expanded pill untouched.

### Out of scope

Expanded pill, logo asset, idle/expand behavior, any other page. Performance: all effects are CSS-only on a single 56px element — no perf risk.

### QA after build

Take screenshots in both light and dark on `/home`, zoom into the orb, verify: visible crescent highlight top-left, faint warm glow bottom, crisp 1px rim, color shimmer reads as inside the sphere, logo legible.
