# Add Cart Icon to Top Navigation

## Goal
Add a cart icon to the top navigation bar with a live badge showing the number of items currently in the user's cart.

## Where it goes
In `src/components/shared/MobileNavigation.tsx`, place the cart icon in the right-side action cluster, next to `NotificationCenter`. It will render in both desktop and mobile layouts (mobile shows it in the right slot currently used as a spacer).

## What to build

1. **`useCartCount` hook** (`src/hooks/useCartCount.ts`)
   - Queries `cart_items` for the current user where `booking_status` is not `booked`
   - Subscribes to realtime `INSERT` / `UPDATE` / `DELETE` on `cart_items` so the badge updates instantly when items are added or removed anywhere in the app
   - Returns `{ count }`

2. **`CartIcon` component** (`src/components/shared/CartIcon.tsx`)
   - Button with `ShoppingCart` icon (lucide-react)
   - Small badge in the top-right corner showing the count (hidden when count is 0; shows `9+` when count > 9)
   - On click, navigates to `/cart`
   - Uses semantic design tokens (`bg-primary`, `text-primary-foreground`, etc.) — no hardcoded colors

3. **Wire into `MobileNavigation.tsx`**
   - Import and render `<CartIcon />` next to `<NotificationCenter />` on desktop
   - Render it in the mobile right-side area (replacing the empty `w-10` spacer) so mobile users can also access it

4. **`/cart` route**
   - Add a minimal `Cart` page (`src/pages/Cart.tsx`) that renders the existing `BookingCart` component (no `itineraryId` so it shows all cart items across trips)
   - Wrap with `MobileNavigation` for header consistency
   - Register the route in `src/App.tsx` under `ProtectedRoute`

## Out of scope
- No changes to checkout logic, Stripe flow, or backend
- No bottom-nav cart tab (can be added later if you want)
- No changes to "Add to Itinerary" buttons on search cards

Once approved I'll implement all four pieces in one pass.