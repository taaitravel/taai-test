# Search Recovery and Social Itinerary Continuation

## Objective
Restore Flights and Activities without weakening the provider-neutral architecture, make Featured/Discover itineraries reachable, and then continue the social itinerary foundation from synthetic review into an approval-ready real-data phase.

## Confirmed current state

- Flights call the provider-neutral `flight-search` Edge Function and require the existing server secret `DUFFEL_TEST_KEY`. The repository documentation still marks the function as not deployed, which is consistent with the published “Provider unavailable” result.
- Both active result layouts (`SearchResultsGrid` and `CategoryCarousel`) still render the legacy `FlightSearchCard`. They do not render the canonical `FlightResultCard` built for Duffel offers, so successful canonical results would be read through the wrong field contract.
- Activities perform two remote calls: `search-cities` for Mapbox coordinates, then `amadeus-activities`. A failure or empty response at either step becomes a generic destructive toast and an empty result screen.
- The Activities adapter currently invents fallback rating and price values when Amadeus omits them. This violates the project’s real-data-only rule.
- The activity card reads `searchParams.adults` although the form submits `participants`, so group totals currently default to one participant.
- Featured itineraries exist at `/discover`, with public detail routes at `/t/:slug` and creator routes at `/p/:slug`. The page currently uses synthetic fixtures, and it is not present in authenticated mobile navigation.
- The social database proposal remains unapplied at `supabase/schema-proposals/social-itinerary-foundation.sql`; therefore Discover must not be presented as production community data yet.

## Phase 1 — Flight recovery

1. **Correct the render path**
   - Replace legacy flight-card usage in grid and categorized/carousel results with `FlightResultCard` and its `CanonicalFlightOffer` contract.
   - Remove booking/cart language from the active flight result path; preserve reference-only/test-mode disclosures and fail-closed saving.
   - Keep `FLIGHT_REFERENCE_TABLE_READY = false`, with no writes to `cart_items`.

2. **Make function failures observable and actionable**
   - Update `useFlightSearch` to read structured non-2xx Edge Function bodies through `FunctionsHttpError.context`, preserving the server’s exact error code, request ID, and traveler-safe message.
   - Keep separate states for not configured, provider authentication, rate limiting, timeout/unavailable, validation, no results, and mapping failure.
   - Render the search status inline as well as a single toast; do not convert every failure to “No results found.”

3. **Validate the provider boundary**
   - Verify local synthetic JFK–MIA success and each error taxonomy state.
   - Verify the browser bundle contains neither Duffel secret name nor credential values.
   - Confirm the Amadeus rollback remains documented and mechanically limited to swapping the flight hook/renderer.
   - Do not deploy or create secrets during the code phase. The operator checklist will identify whether the already-approved `DUFFEL_TEST_KEY` exists and whether `flight-search` must be deployed before published-app acceptance.

## Phase 2 — Activities recovery

1. **Stabilize location resolution**
   - Normalize the selected destination shape before geocoding and accept coordinates already supplied by the location picker, avoiding an unnecessary second lookup when coordinates are present.
   - Return distinct traveler-facing states for location lookup failure, provider configuration/authentication failure, provider outage/rate limit, and valid zero results.
   - Ensure only one toast is emitted per failed search and keep the inline result state synchronized.

2. **Repair the real-data contract**
   - Update `amadeus-activities` to return structured status/error responses instead of one generic 500.
   - Remove invented fallback prices and ratings. Missing provider fields render as “Price unavailable” / no rating, never fabricated values.
   - Sanitize provider text and URLs before returning or rendering them.
   - Preserve provider booking links only when supplied and valid; do not imply availability or a held reservation.

3. **Fix result calculations and presentation**
   - Use `participants` from the Activities form for totals.
   - Treat provider price as unavailable when absent rather than defaulting to `$75`.
   - Pass the selected activity date consistently into itinerary matching and saved item metadata.
   - Use semantic bright-theme tokens and the existing responsive card system; remove hardcoded dark-card colors from the active Activities result card.

## Phase 3 — Featured itineraries discoverability

- Add a clear authenticated entry to `/discover` through the existing navigation/chrome system without displacing core Home, Search, Trips, or Profile actions.
- Label the page “Discover” with “Featured itineraries” as a section, avoiding a second itinerary system.
- Keep synthetic cards visibly identified as preview/sample content until the social migration and real read path are approved.
- Verify `/discover`, `/t/:slug`, and `/p/:slug` on mobile and desktop, including carousel swipe, card links, clone dialog, back navigation, and empty/not-found states.

## Phase 4 — Continue the social itinerary foundation

This phase remains approval-gated because its schema is currently only a proposal.

1. Audit the proposal against the existing `itinerary`, profile, invitation, collection, subscriber, and role systems; amend only conflicts or missing grants/RLS.
2. Add the real-data read hooks for public itinerary card projections and public profiles, using explicit projections, bounded pagination, deduplication, and the existing egress read guard.
3. Replace synthetic Discover data only after migration approval and application; until then retain the fixture adapter behind an explicit preview boundary.
4. Wire Save/Bookmark separately from Clone; cloning creates lineage and an editable itinerary, while saving never consumes the active-itinerary allowance.
5. Enforce the free active editable itinerary limit server-side and reuse the existing subscription source.
6. Complete invitation, moderation/reporting, privacy, and Minerva event paths using the existing systems rather than parallel implementations.

## Technical verification

- Targeted unit tests: flight normalization/error extraction/render selection; Activities response mapping, missing price/rating, participant totals, destination normalization; social preview/real adapter boundaries.
- Regression tests: egress stability, social foundation, existing flight suite, and relevant search orchestration tests.
- Type-check and production build summaries.
- Playwright checks at desktop and iPhone 16 Pro dimensions for Flights success/failures, Activities success/failures, `/discover`, public itinerary, and public profile.
- Network assertions: one submitted search produces one intentional request chain, no request loop, no duplicate toast, and no secret leakage.

## Delivery sequence and gates

1. Implement and validate local Flight and Activities recovery plus Discover navigation.
2. Return the exact changed-file list, raw test/type-check/build summaries, screenshots, and an operator checklist.
3. Do not deploy functions, frontend, secrets, or schema without explicit approval.
4. After search recovery is accepted, present any necessary amendment to the existing social schema proposal for approval before applying it or switching Discover to real data.

## Acceptance criteria

- A valid flight fixture renders canonical reference-only cards; published provider configuration errors identify the actual action needed instead of masquerading as no results.
- A valid activity response renders real provider values, the selected participant count/date, and no invented price or rating.
- Featured itineraries are reachable from authenticated navigation and all preview routes work on mobile.
- Hotels remain unchanged and regression-tested.
- The Supabase-egress work remains separately tracked and is not represented as completed by these search/social changes.
