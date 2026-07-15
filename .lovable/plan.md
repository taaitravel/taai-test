
# Gate 8 — Slice 2A: Global Mobile Chrome Contract (Build)

Tap **Implement plan** to switch to build mode. Exactly the 7 approved files change.

## New files

**1. `src/contexts/ChromeStateContext.tsx`**
`ChromeStateProvider` + `useChromeState()` exposing `{ drawerOpen, setDrawerOpen }`. Safe inert fallback if consumed outside provider.

**2. `src/lib/chrome/route-config.ts`**
Pure config. `getRouteChrome(pathname)` → `{ variant: 'menu'|'back'|'home', hideBottomNav, primary: 'cart'|'notifications'|'none', overflow: OverflowItem[] }`. Matches approved route matrix.

**3. `src/components/shared/PageContextHeader.tsx`**
Presentational wrapper (title/subtitle/right slot). Exported and typechecked in 2A; page adoption in 2B.

**4. `src/components/shared/MobileActionCluster.tsx`**
Real component. Renders one primary icon-button (reusing `CartIcon` or `NotificationCenter`) + a 40×40 More kebab opening a shadcn `DropdownMenu`. Enforces ≤ 2 controls by construction.

## Edited files

**5. `src/App.tsx`** — wrap router subtree with `<ChromeStateProvider>`. No route changes.

**6. `src/components/shared/MobileNavigation.tsx`** — mobile grid `grid-cols-[96px_1fr_96px]` (symmetric side zones, `h-14`). Right zone on mobile renders `<MobileActionCluster>` driven by `getRouteChrome(pathname)`. Desktop unchanged. Drawer state mirrored to `useChromeState().setDrawerOpen`.

**7. `src/components/navigation/MobileBottomNav.tsx`** — reads `drawerOpen`; when true applies `aria-hidden` + `opacity-0 pointer-events-none`. `HIDDEN_ROUTES` unchanged.

## Guarantees

- Right zone max 2 controls (1 primary + More). Never Cart + Notifications + More.
- Page-specific actions do not appear in the global mobile header.
- Orb stays nav-only.
- No traveler-facing Ajax/Hermes/Tom/Scott/Manny/Benny/Piper/Lester/Scout.
- Protected files untouched: `client.ts`, checkout/payment/Stripe, Gate 7, Supabase functions, migrations, env/secrets, `package.json`, `package-lock.json`. No deploy, no publish.
