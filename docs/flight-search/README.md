# Flight Search — Provider-Neutral, Reference-Only (Duffel Test Mode)

Status: implemented locally. Not deployed, no secret created, no migration applied.

## Contract

`supabase/functions/flight-search/contract.ts` is the source of truth for the
canonical shape; `src/types/flight-offer.ts` is the type-identical frontend copy
(edge functions cannot import from `src/`).

Duffel test results are locked to:

- `mode: 'test'`
- `evidenceGrade: 'provider_test'`
- `commerceCapability: 'reference_only'`
- `outboundUrl: null`

## Edge function

`supabase/functions/flight-search/index.ts`

- Requires an authenticated taai user (validated in code; `verify_jwt = false`).
- Strict validation: uppercased IATA codes, `YYYY-MM-DD` dates, return not before
  departure, max 9 passengers, allowed cabin classes only.
- Duffel v2 `POST /air/offer_requests?return_offers=true` **only**. No offers,
  orders, or payments endpoints are called.
- 15s timeout, one retry limited to timeout / 429 / 5xx.
- Reads `DUFFEL_TEST_ACCESS_TOKEN` from server secrets. Never logged, never
  returned, provider payloads are never echoed.
- Every response carries `requestId`.

Envelope: `{ requestId, status, mode, providersAttempted, offers, errors }`.

Failure taxonomy → HTTP: `VALIDATION_ERROR` 400, `AUTH_REQUIRED` 401,
`PROVIDER_NOT_CONFIGURED` 503, `PROVIDER_AUTH_FAILED` 502,
`PROVIDER_RATE_LIMITED` 429, `PROVIDER_UNAVAILABLE` 503, `NO_RESULTS` 200
(`status: 'no_results'`), `RESPONSE_MAPPING_ERROR` 502 (diagnostic id only).

## Frontend

- `src/hooks/useFlightSearch.ts` invokes `flight-search` and returns
  `{ status, requestId, offers, error }`.
- `src/hooks/useSearchOrchestrator.ts` flight branch uses it and renders a
  distinct, actionable message for each taxonomy member plus no-results.
- `src/hooks/useAmadeusFlights.ts` and `supabase/functions/amadeus-flights`
  remain on disk but are no longer wired to search.
- `src/components/search/cards/FlightResultCard.tsx` consumes only
  `CanonicalFlightOffer`, shows "Test result — reference only" and
  "Price observed in test mode; not live availability.", and exposes
  "Add flight reference" — no Book/Checkout language, no guarantee language.

## Reference-only save

`src/lib/flights/flight-reference-row.ts` (pure) + `flight-reference.ts` (I/O).
`FLIGHT_REFERENCE_TABLE_READY` is `false`: `cart_items` is a commerce cart
(price, `booking_status`, reprice fields) and cannot hold a reference-only
observation, so saving is blocked until `docs/flight-search/proposed-migration.sql`
is approved and applied. No cart item, no booking, no total is ever written.

## Minerva

`src/lib/taai/minerva/flight-events.ts` emits synthetic/test-tagged
`flight_search_submitted`, `flight_search_completed`, `flight_offer_viewed`,
`flight_reference_saved` with canonical event ids, request id, provider, mode and
attribution context. No purchase or booking events.

## Travelpayouts

`src/lib/affiliate/redirect-contract.ts` is a typed, disabled interface only:
route pattern `/r/travelpayouts/:program/:linkId`, `AFFILIATE_REDIRECT_ENABLED = false`,
`resolveAffiliateRedirect` always returns `program_not_connected`. No script, no
credentials, no outbound URLs. Expedia Partnerize and Viator links untouched.

## Tests

`bun run test` → `src/lib/flights/__tests__/flight-search.test.ts` (10 tests):
validation, round-trip payload building, Duffel normalization against the
JFK–MIA synthetic fixture, reference-only lock, malformed-offer rejection, error
classification, reference-row shape (no commerce fields), formatting helpers.

## Still requires approval

1. Create the `DUFFEL_TEST_ACCESS_TOKEN` secret.
2. Apply `docs/flight-search/proposed-migration.sql`.
3. Deploy the `flight-search` function.
4. Deploy the frontend / publish.
5. Domain / DNS changes.
6. Travelpayouts redirect route and program connection.
7. Live (non-test) provider search.
8. Any Duffel offers/orders/payments usage.
