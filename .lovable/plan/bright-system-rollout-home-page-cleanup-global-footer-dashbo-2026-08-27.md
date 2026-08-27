# Bright system rollout — home page cleanup, global footer, dashboard restyle

## What I verified first

- The design-system **appendix** section and the old landing **footer** are already gone from the landing source (`src/pages/landing/index-bright.html`) — only orphan `.spec` CSS rules remain. What you're seeing with "appendix" is the previously published build, not current source. So step 1 is: delete the dead CSS and confirm on a fresh publish.
- The current global public footer is `src/components/shared/PublicFooter.tsx` (logo + Privacy / Terms / Contact), used on What we do, Contact, Privacy Policy. A second, better-looking footer lives inside `BrightSections.tsx` (`.tbs-foot`).
- The closing CTA band is the night-dark section in `BrightSections.tsx` (`.tbs-cta`, `#0D0A08`, blurred gradient orb) — I'm treating that as the "Ready to transform your experience" section you want blended back into the page.

## 1. Home page cleanup

- Remove the leftover `.spec*` CSS block from the landing stylesheet (no markup references it).
- Remove the footer inside `BrightSections.tsx` so the page ends on the CTA, then the global footer sits below it as the true page bottom.

## 2. New global footer (public pages only)

Promote the bright footer design into `PublicFooter.tsx`:

- First line "TAAI TRAVEL" → the taai wordmark image (deep-gradient variant on cream, per spec §3.2), ~24px tall.
- Columns/links: Product, Workspace, What we do, Demo, Join, Contact, Privacy Policy, Terms.
- Bright styling: white ground on cream page, `--line-2` top hairline, `--ink-3` link ink, hover to `#F2536E`, mono tagline `taai.travel · travel agent · affiliate · intelligence`, 40px desktop / 24px mobile gutters, stacked on ≤900px.
- Mounted on `/` (below the CTA), What we do, Contact, Privacy Policy, Terms. Authenticated app keeps no footer (bottom nav owns that space).

## 3. Closing CTA background

Keep the motion, drop the hard black break: cream-to-`#F3EDE4` ground with two slow-drifting blurred `--grad` orbs at low opacity (the same drift language as the hero aurora), deep-gradient headline type, `--grad-deep` primary button. `prefers-reduced-motion` renders it static.

## 4. Authenticated dashboard (`/home`) restyle

Carry the bright system into the dashboard without touching data or logic:

- Ground: cream in light mode; existing dark tokens preserved for dark mode.
- Type: Sora display for headings, Inter for body/UI, IBM Plex Mono for labels and stat captions, Yellowtail only for section markers.
- Cards: white, `1px solid --line-2`, 12–18px radius, warm-brown long shadows (`--shadow-s` / `--shadow-m`) — no grey shadows, no heavy borders.
- Buttons/pills: `--grad-deep` primary with the pink glow shadow, secondary as hairline-on-white.
- Numbers and emphasis use `--grad-deep` (never `#FF849C` on light below 24px, per spec §7).
- Spacing on the 4px base, section rhythm matched to the landing (108px desktop / 76px mobile), mobile `pb-24` clearance kept.

Files touched: `HeroSection.tsx`, `sections/HeroWelcome.tsx`, `sections/TravelHub.tsx`, `sections/TravelMetrics.tsx`, `sections/UpcomingTravel.tsx`, `StatsSection.tsx`, `TripsFilter.tsx`, `TripsSection.tsx`, `DashboardContent.tsx`.

## Technical notes

- Bright tokens (`--cream`, `--ink`, `--grad-deep`, `--shadow-*`, font stacks, category colours) get promoted into `src/index.css` as semantic variables plus Tailwind theme entries, so components use tokens — no hardcoded hex in components.
- Fonts stay on the Google Fonts links for now; self-hosting (spec §2.3) is a separate follow-up.
- No backend, pricing, checkout, or search logic is touched in this slice.
- Not in this slice (spec §10 app bugs — `Invalid Date`, `Provider TBD`, `384.5%` donut, `1 items`, report items all tagged `DINING`). I'll queue those as the next slice.

## After merge

Publish, since the appendix/footer removal only shows on a fresh deploy.
