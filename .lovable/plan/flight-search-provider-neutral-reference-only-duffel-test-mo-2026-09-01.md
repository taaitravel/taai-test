# Flight Search: Provider-Neutral, Reference-Only (Duffel Test Mode)

Scope is local implementation only. No deploy, no publish, no secret creation, no applied migration, no Travelpayouts script, no booking/payment/cart behaviour.

## Confirmed current state

- The flight branch calls `amadeus-flights` directly through `useAmadeusFlights` (`src/hooks/useAmadeusFlights.ts`) wired into `useSearchOrchestrator`.
- `supabase/functions/amadeus-flights/index.ts` collapses every failure (missing credentials, provider auth, provider 5xx) into one generic HTTP 500 `"Unable to process flight search"`, and emits `bookingUrl: '#'`.
- Field-shape mismatch confirmed: the adapter emits `departure`/`arrival` as timestamp strings and `price` as a number, while `FlightResultCard.tsx` reads `flight.departure?.iataCode`, `flight.departure?.at` (lines 91-97, 245-246) and `flight.price?.total` (lines 86, 206).

## What gets built

**1. Canonical contract**
`src/types/flight-offer.ts` — `CanonicalFlightOffer`, `FlightCommerceCapability`, `EvidenceGrade` exactly as specified, plus a `normalizeDuffelOffer` unit-testable mapper. Duffel test results are locked to `mode: 'test'`, `evidenceGrade: 'provider_test'`, `commerceCapability: 'reference_only'`, `outboundUrl: null`.

**2. Edge function `flight-search`**
`supabase/functions/flight-search/index.ts` with a Duffel adapter in the same folder. Authenticated taai user required; strict validation (IATA uppercased, date format, passenger caps); Duffel v2 headers; bounded timeout; one retry limited to timeout/429/5xx; correlation ID on every response. Reads `DUFFEL_TEST_ACCESS_TOKEN` from server secrets only — never logged, never returned, no raw payload echo. Response envelope `{ requestId, status, mode, providersAttempted, offers, errors }`. Full failure taxonomy: `VALIDATION_ERROR` 400, `AUTH_REQUIRED` 401, `PROVIDER_NOT_CONFIGURED` 503, `PROVIDER_AUTH_FAILED` 502, `PROVIDER_RATE_LIMITED` 429 guidance, `PROVIDER_UNAVAILABLE` 503, `NO_RESULTS` 200, `RESPONSE_MAPPING_ERROR` 502 with diagnostic ID only. Offer-request endpoints only — no offers/orders/payments calls.

**3. Frontend hook swap**
New `src/hooks/useFlightSearch.ts` invoking `flight-search`. `useSearchOrchestrator` flight branch switches to it. `useAmadeusFlights.ts` and the Amadeus function stay on disk, disconnected.

**4. Result card**
`FlightResultCard.tsx` consumes only `CanonicalFlightOffer`; the timestamp/airport/flight-number/price mismatches disappear with the contract. Adds a prominent "Test result — reference only" badge and "Price observed in test mode; not live availability." Removes Book/Checkout/available/taxes-included/guaranteed-price language. Existing visual style preserved.

**5. Save path**
Action becomes "Add flight reference," writing a planning/reference record (route, segments, airports, carrier, flight number, timestamps, observed price/currency, provider, provider offer ID, observedAt, expiresAt, mode, evidence grade) via the existing itinerary chooser. No cart item, no booking, no total. If the existing itinerary schema cannot hold these fields, a migration is written to `supabase/migrations` **unapplied** and the work stops for approval.

**6. States**
Distinct, actionable UI for each taxonomy member plus no-results and success — traveler-facing guidance only, no internals.

**7. Minerva events**
Synthetic/test-tagged `flight_search_submitted`, `flight_search_completed`, `flight_offer_viewed`, `flight_reference_saved` with canonical event IDs, request ID, provider, mode, attribution context. No purchase/booking events.

**8. Travelpayouts**
Typed, disabled interface only (`src/lib/affiliate/redirect-contract.ts`) describing `/r/travelpayouts/:program/:linkId`. No script, no credentials, no program connection, no outbound URLs. Expedia Partnerize and Viator links untouched.

**9. Tests**
Unit tests for validation, Duffel normalization, error classification, test-mode labelling, reference-only save; a JFK–MIA round-trip fixture proving normalized synthetic results; a bundle/log check asserting no token string appears.

## Deliverable

An evidence packet: files changed, unapplied migration (if any), test output, build output, desktop and mobile screenshots of success and each failure state, and the list of items still needing approval (Duffel secret, migration apply, function deploy, frontend deploy, domain/DNS, Travelpayouts redirect, live search, orders/payments, publish).

## Open item

Without `DUFFEL_TEST_ACCESS_TOKEN` present, live Duffel calls will return `PROVIDER_NOT_CONFIGURED` — acceptance items 2 and 4 will be demonstrated against the synthetic fixture, and the real-token pass is deferred to Marco's approved credential action.
