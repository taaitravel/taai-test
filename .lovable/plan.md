## Problem

On the My Itineraries page (mobile viewport ~509px), the trip card inside the stack renders at the base responsive size (165×243) while its parent `MobileItineraryStack` container is fixed at 255×375. That leaves a big empty area around the card and makes the itinerary-page stack look much smaller than the home-page stack.

Root cause: `ItineraryCard` uses responsive sizing (`w-[165px] sm:w-[191px] lg:w-[255px]` etc.), but `MobileItineraryStack` always reserves 255×375. The two never agree except at `lg`.

## Fix

Make the card always match the stack's 255×375 footprint everywhere the stack is used (home + itineraries), so sizing is identical.

### 1. `src/components/my-itineraries/ItineraryCard.tsx`
- Add an optional `size` prop: `'responsive' | 'stack'` (default `'responsive'` to preserve grid/list views).
- When `size='stack'`, force `w-[255px] h-[255px]... actually w-[255px] h-[375px]` and use the `lg:` typography/padding values unconditionally (`p-4`, `text-2xl` emoji, `text-base` title, etc.).
- Leave grid/list usages untouched.

### 2. `src/components/my-itineraries/MobileItineraryStack.tsx`
- Pass `size="stack"` to every `<ItineraryCard>` it renders.
- Container stays 255×375.

### 3. No other call sites change
- `StackSection`, `TripsSection`, `MobileStacksView` already render through `MobileItineraryStack`, so they inherit the fix automatically.
- `ItineraryGrid` / `ItineraryList` keep the current responsive sizing.

## Out of scope
- No gesture / data / layout changes.
- No desktop view changes.
- No new components.
