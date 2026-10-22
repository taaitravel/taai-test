/**
 * Travel booking checkout lets a traveler pay TAAI for flights, hotels,
 * activities, or other travel (the create-booking-checkout function).
 *
 * Lighthouse Commerce Group LLC d/b/a TAAI Travel is not registered as a
 * Florida Seller of Travel, so this stays off unless both flags are exactly
 * "true":
 * - VITE_TRAVEL_BOOKING_CHECKOUT — hides the UI and blocks client invokes
 * - TRAVEL_BOOKING_CHECKOUT_ENABLED — blocks the edge function itself
 *
 * Subscription checkout (create-checkout / customer-portal) is separate and
 * is not gated here.
 */
export const travelBookingCheckoutEnabled =
  import.meta.env.VITE_TRAVEL_BOOKING_CHECKOUT === "true";
