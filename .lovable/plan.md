## Glass Orb Refinement

Scope: only the collapsed orb in `src/components/navigation/MobileBottomNav.tsx` and supporting styles in `src/index.css`. Expanded pill stays unchanged.

### 1. Background contrast with the "t" logo

The TAAI "t" mark reads as a warm rose/coral dark glyph. To make it pop in both themes:

- **Light mode orb base**: near-white with a whisper of the dark theme navy — `hsl(240 16% 11% / 0.06)` over `hsl(0 0% 100% / 0.85)`. Logo stays its natural dark rose → strong contrast.
- **Dark mode orb base**: near-black warmed with a hint of rose — `hsl(351 85% 70% / 0.08)` over `hsl(240 16% 11% / 0.7)`. Logo's warm tones lift off the deep base.

Applied via a new `.glass-orb-base` utility that swaps under `.dark`.

### 2. Transparent border

Replace `border border-border/40` on the collapsed state with `border border-transparent`. Definition comes from the bezel highlight/shadow instead of a hard stroke. Expanded pill keeps its current border.

### 3. 3D bezel / glass ball

Layered, restrained — no skeuomorphism. Three stacked effects only when `collapsed`:

1. **Top inner highlight** — `::before` pseudo: small radial gradient at ~30% 25%, white at 35% opacity fading to transparent by 55%. Reads as a single soft specular.
2. **Bottom inner shadow** — `inset 0 -6px 12px -6px rgba(0,0,0,0.25)` (dark) / `rgba(0,0,0,0.12)` (light). Gives the lower hemisphere weight.
3. **Outer rim** — `box-shadow: 0 1px 0 rgba(255,255,255,0.4) inset, 0 0 0 1px rgba(255,255,255,0.08) inset, 0 8px 24px -8px rgba(0,0,0,0.35)`. The two inset shadows create the bezel rim; the outer drop shadow lifts the orb off the page.

Existing iridescent `.glass-orb-sheen` stays but drops to ~60% opacity and moves behind the bezel so it reads as refracted color inside the glass, not a halo.

`backdrop-blur-2xl` stays for the frosted-glass refraction of content behind.

### Files to change

- `src/index.css` — add `.glass-orb-base` (theme-aware), `.glass-orb-bezel` (pseudo-element highlight + inset shadows), tone down `.glass-orb-sheen` opacity.
- `src/components/navigation/MobileBottomNav.tsx` — swap collapsed-state classes: remove `bg-card/80 border-border/40`, add `glass-orb-base glass-orb-bezel border-transparent`. Wrap sheen + logo so bezel highlight sits on top.

### Out of scope

Expanded pill styling, idle timer, logo asset, light/dark token definitions in `:root`/`.dark`.
