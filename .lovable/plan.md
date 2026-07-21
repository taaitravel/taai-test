# Gate 8 Slice 2C — Authenticated Mobile Drawer Cleanup (Ready to Build)

Ready to implement. Manual Itinerary mobile-reachability audit complete: reachable via `src/components/dashboard/sections/TravelHub.tsx` line 22 ("New Itinerary" action → `/new-manual-itinerary`) which renders on the mobile Home dashboard. Removing it from the drawer leaves no access gap.

## Files (2)

### 1. `src/lib/constants.ts` — append (no edits to existing exports)

```ts
export type DrawerItem = { label: string; path: string };
export type DrawerSection = { id: string; title: string; items: DrawerItem[] };

export const AUTHENTICATED_DRAWER_SECTIONS: DrawerSection[] = [
  { id: "account", title: "Account", items: [
    { label: "Profile & Settings", path: "/profile" },
    { label: "Traveler Preferences", path: "/profile?tab=preferences" },
    { label: "Traveler Setup", path: "/profile-setup" },
  ]},
  { id: "plan", title: "Plan", items: [
    { label: "Subscription", path: "/subscription" },
  ]},
  { id: "support", title: "Support", items: [
    { label: "Contact Support", path: "/contact" },
  ]},
  { id: "info-legal", title: "Info & Legal", items: [
    { label: "What We Do", path: "/what-we-do" },
    { label: "Privacy Policy", path: "/privacy-policy" },
    { label: "Terms of Service", path: "/terms" },
  ]},
];
```

`AUTHENTICATED_MENU_ITEMS` untouched → `src/pages/Index.tsx` diff empty.

### 2. `src/components/shared/MobileNavigation.tsx`

- Swap import: add `AUTHENTICATED_DRAWER_SECTIONS` (drop unused `AUTHENTICATED_MENU_ITEMS` import).
- Remove `const menuItems = [...AUTHENTICATED_MENU_ITEMS];`.
- Sign Out handler (drawer close is synchronous — state setter — so no `await`):

```ts
const handleSignOut = async () => {
  handleDrawerChange(false);
  try {
    await signOut();
    navigate("/");
  } catch (error) {
    console.error("Error signing out:", error);
  }
};
```

- Add `DrawerTitle` + `DrawerDescription` imports from `@/components/ui/drawer` and render a visually hidden title ("Account menu") inside `DrawerContent` (using `sr-only`) so Radix a11y is satisfied.
- Replace the flat `menuItems.map` block with grouped sections:

```tsx
<div className="flex-1 flex flex-col gap-6 px-6 py-6 overflow-y-auto">
  {AUTHENTICATED_DRAWER_SECTIONS.map((section) => (
    <div key={section.id} className="flex flex-col">
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-2">
        {section.title}
      </h3>
      <div className="flex flex-col">
        {section.items.map((item) => (
          <button
            key={item.path}
            onClick={() => handleMenuItemClick(item.path)}
            className="text-foreground text-lg font-medium tracking-tight text-left hover:text-primary transition-colors duration-200 py-2.5 border-b border-border/30 last:border-b-0"
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  ))}
</div>
```

- Left zone (Menu/Back/Home variants), centered logo, right-zone `MobileActionCluster`, desktop branch, traveler-level Badge, Sign Out button, `handleDrawerChange` → `setDrawerOpen` (bottom-nav suppression) all preserved.

## Manual Itinerary reachability
- `TravelHub.tsx:22` — mobile Home dashboard action → `/new-manual-itinerary` ✓
- Desktop-only header dropdown at `MobileNavigation.tsx:219` (inside `!isMobile` branch).
- Conclusion: safely removable from drawer; no `planning` section needed.

## Validation
`tsgo --noEmit` clean; route-by-route 390px check on `/home`, `/search`, `/itineraries`, `/profile`, `/itinerary`, `/cart`, `/new-itinerary`; drawer close on item tap / Sign Out (synchronous close then await) / Escape; `Index.tsx` git-diff empty; grep confirms `AUTHENTICATED_MENU_ITEMS` still present and used only by `Index.tsx`.

## Protected — untouched
Supabase files, edge functions, migrations, `.env*`, `package.json`, lockfile, checkout/payment/provider code, Gate 7, `route-config.ts`, `MobileBottomNav.tsx`, `ChromeStateContext.tsx`, `MobileActionCluster.tsx`, desktop navigation, `UserProfileDropdown.tsx`. No deploy or publish.

## Out of scope
Slice 2D orb; new support surfaces; Miles/Bob/Ajax/Hermes additions; route config edits.
