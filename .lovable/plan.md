# Fix cream-on-white tab contrast

## Root cause

`src/pages/Subscription.tsx` (lines 128–131) overrides shadcn `TabsTrigger` like this:

```tsx
<TabsList className="grid w-full grid-cols-2 mb-8 bg-secondary border-border">
  <TabsTrigger className="text-secondary-foreground data-[state=active]:gold-gradient data-[state=active]:text-primary-foreground">…</TabsTrigger>
```

Two problems:

1. The base `TabsTrigger` already sets `data-[state=active]:bg-background data-[state=active]:text-foreground`. Tailwind's `bg-background` wins over the `.gold-gradient` utility class (specificity tie → source order), so the active tab ends up with **cream `bg-background` + white `text-primary-foreground`** = unreadable.
2. The inactive trigger inherits the cream `bg-secondary` from the list, but `text-secondary-foreground` in dark mode is near-white, so when the page is shown in light mode but theme tokens are momentarily mismatched (e.g. before hydration), the inactive label also reads faint cream-on-cream.

## Fix

Update `src/pages/Subscription.tsx` tab block so the gold gradient reliably overrides the base `bg-background` and the inactive state has guaranteed contrast:

```tsx
<TabsList className="grid w-full grid-cols-2 mb-8 bg-secondary border border-border p-1">
  <TabsTrigger
    value="individual"
    className="text-foreground/70 hover:text-foreground
               data-[state=active]:!bg-transparent
               data-[state=active]:gold-gradient
               data-[state=active]:text-white
               data-[state=active]:shadow-md"
  >
    Individual Plans
  </TabsTrigger>
  <TabsTrigger value="corporate" className="…same…">Corporate Plans</TabsTrigger>
</TabsList>
```

Key changes:
- `!bg-transparent` on active neutralises the base `bg-background` so `.gold-gradient` actually paints.
- Inactive uses `text-foreground/70` (semantic, dark in light mode, light in dark mode) instead of `text-secondary-foreground`, which guarantees contrast against the cream `bg-secondary` in both themes.
- Active uses literal `text-white` because the gradient is always a saturated coral regardless of theme.

## Audit pass for similar issues

Sweep the other places that pair a cream/muted surface with potentially white text and fix any that fail contrast. Targeted scan, not a full rewrite:

1. `src/components/ui/tabs.tsx` — confirm we don't need to change the base component; we only override per-usage.
2. `src/pages/Subscription.tsx` — billing-cycle pill toggle, "Most Popular" badge, plan card headers (verify text on cream card backgrounds).
3. `src/pages/Profile.tsx`, `src/pages/ProfileSetup.tsx` — any `TabsList`/`Tabs` overrides using `text-primary-foreground` over non-primary backgrounds.
4. `src/pages/MyItineraries.tsx` + `src/components/my-itineraries/*` — view toggle, filter chips.
5. `src/pages/Search.tsx` + `src/components/search/SearchViewToggle.tsx`, `CategoryCarousel.tsx` — active tab/chip styling.
6. `src/components/navigation/MobileBottomNav.tsx` and `src/components/shared/MobileNavigation.tsx` — active pill colors.
7. `src/components/subscription/SubscriptionCard.tsx`, `UsageDashboard.tsx` — badge / status text on cream surfaces.

For each, the fix pattern is the same: when active state layers a gradient or light surface, force `text-foreground` or `text-white` explicitly and add `!bg-transparent` if a shadcn base `bg-background`/`bg-muted` is fighting the custom background.

## Out of scope

- No changes to the design tokens in `src/index.css` (would ripple too widely).
- No changes to functionality, routing, or pricing data.

## Files expected to change

- `src/pages/Subscription.tsx` (definite)
- 0–6 of the audit files above, only where a real contrast bug is confirmed by reading the JSX. Each fix is a className tweak.
