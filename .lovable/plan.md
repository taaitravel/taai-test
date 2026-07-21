# Gate 8 Slice 2D — New Itinerary Mobile Planning Shell (final, ready to build)

Frontend-only. Two files. Single mounted Bob instance via `useIsMobile()` conditional. Opt-in composer assistance defaults off to preserve every existing caller.

## Files (exactly 2)

### 1. `src/components/chat/ChatInterface.tsx`

Add optional props with safe defaults:

```ts
assistantName?: string;         // default "TAAI Assistant"
assistantSubtitle?: string;     // default undefined (rendered only in floating header)
greeting?: string;              // default: current empty-state copy
mobileComposerAssist?: boolean; // default false
```

Apply in both `embedded` and floating branches:
- Empty-state paragraph text ← `greeting`.
- Floating header title ← `assistantName`; render `assistantSubtitle` as a small line below when provided.
- Both typing indicators ← `${assistantName} is thinking...` (replacing "Thinking...").

Composer behavior gated on `mobileComposerAssist === true`:
- Composer container class conditionally appends `pb-[calc(1rem+env(safe-area-inset-bottom))]`.
- `Input` receives an `onFocus` handler only when enabled:
  ```ts
  const el = e.currentTarget;
  requestAnimationFrame(() => {
    const r = el.getBoundingClientRect();
    if (r.bottom > window.innerHeight || r.top < 0) {
      el.scrollIntoView({ block: 'nearest' });
    }
  });
  ```
- When `false` (default): composer markup and behavior are identical to today for every existing caller. No new `onFocus`, no extra padding.

No prompt, payload, edge-function, results, persistence, or internal render-branch changes beyond the above.

### 2. `src/pages/CreateItinerary.tsx`

- `import { useIsMobile } from "@/hooks/use-mobile";` and call `const isMobile = useIsMobile();`.
- Inner container: `pb-28 md:pb-6` → `pb-4 md:pb-6` (mobile bottom nav is hidden on this route).
- Replace the body with `{isMobile ? <MobileBobShell /> : <DesktopComparisonShell />}` so exactly one `ChatInterface` mounts. No `md:hidden` / `hidden md:*` duplication.

**Mobile shell**
- `<h1>Plan with Bob</h1>`, subtitle "Your taai planning specialist" (semantic tokens only).
- `flex-1 min-h-0 flex flex-col` panel containing only:
  ```tsx
  <ChatInterface
    context={`User is creating an itinerary. Current itinerary data: ${JSON.stringify(itineraryData)}`}
    placeholder="Ask Bob about planning your perfect trip..."
    embedded
    itineraryId={savedItineraryId || undefined}
    assistantName="Bob"
    assistantSubtitle="Planning specialist"
    greeting="Hi, I'm Bob — your taai planning specialist. Where should we begin?"
    mobileComposerAssist
  />
  ```
- No Classic panel, no Save/View CTA, no `QuickAddToCart`, no `BookingCart`, no placeholder Save, no synthetic saved state.

**Desktop shell**
- Current heading, two-column grid with `AIReservationChat` (left) and `ChatInterface` (right) preserved. The right-column `ChatInterface` receives `assistantName="Bob"`, `assistantSubtitle="Planning specialist"`, and the same Bob `greeting`. **Does not** receive `mobileComposerAssist`.
- `savedItineraryId`-gated Booking Section (`QuickAddToCart` + `BookingCart`) preserved.
- Save/View CTA block preserved.
- All existing state, effects, `saveItinerary`, `updateItineraryData` remain.

## Viewport-resize / remount

Crossing the `md` breakpoint unmounts one shell and mounts the other; the corresponding `ChatInterface` instance is remounted and its transient in-memory message state resets. Accepted for this bounded slice; Bob→itinerary bridge and cross-viewport chat persistence remain deferred.

## Explicitly untouched

`AIReservationChat.tsx`, `MobileNavigation.tsx`, `MobileBottomNav.tsx`, `route-config.ts`, `ChromeStateContext.tsx`, `MobileActionCluster.tsx`, `AgentChip.tsx`, `brand-identity.ts`, `App.tsx`, `UserProfileDropdown.tsx`, drawer, desktop navigation, itinerary chat modal, booking widget internals, `useBookingCheckout`, `Checkout.tsx`, `BookingSuccess.tsx`, Supabase client/types, all `supabase/functions/**` and `supabase/migrations/**`, `.env*`, `package.json`, lockfile, Gate 7. No Miles work, no `MilesMobileEntry.tsx`, no global assistant mount, no `milesVisible`. No Bob→`itineraryData` bridge. No result-selection wiring. No prompt or edge-function changes. No deploy or publish.

## Validation

- Typecheck `bunx tsgo --noEmit` clean.
- 390px `/new-itinerary`: only Bob rendered; no Classic, Save CTA, `QuickAddToCart`, or `BookingCart` in DOM; safe-area padding present on mobile Bob composer; keyboard-focus scroll behaves; single scroll region; Slice 2A/2B chrome intact; bottom nav hidden; no Miles entry.
- ≥ md: both panels render; Save flow works; post-save cart widgets render; right-column `ChatInterface` empty-state and typing indicator identify as "Bob"; desktop Bob composer has no safe-area padding and no focus hook.
- Grep confirms other `ChatInterface` callers unchanged and render with pre-slice identity and composer behavior.
- DOM check: exactly one Bob composer input at each viewport.

## Completion report will document

Exact files changed; single Bob instance mounted; `useIsMobile()` ternary mechanism; no hidden duplicate; `mobileComposerAssist` defaults to `false`; safe-area + focus handler affect only the mobile Bob instance; all other callers preserved; viewport-remount behavior accepted; Bob→itinerary bridge deferred; protected files untouched; no deploy or publish; Slice 2E not begun.
