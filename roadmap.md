# taai roadmap

## In progress
- [x] Phase 1 — Supabase egress containment (useItineraryData, useDashboardData, useCountryData, dev read-guard, regression tests)
- [x] Local search recovery — canonical flight rendering, structured failures, real-data activity cards, Discover navigation
- [ ] Phase 2 — Social itinerary foundation (unapplied migration + synthetic Discover / public profile / clone / limit UI)
- [x] Discover UX — menu + dashboard entry, search-styled public itinerary cards, 6 fully authored trips with schedule + calendar interiors

## Duffel sync corrections (requested 2026-09-01)
- [x] Rename secret reference to existing `DUFFEL_TEST_KEY` (never `DUFFEL_TEST_ACCESS_TOKEN`)
- [ ] Prove browser bundle contains no Duffel secret name or credential value
- [x] Move unapplied schema proposal to `supabase/schema-proposals/flight-references.sql`
- [x] Keep `FLIGHT_REFERENCE_TABLE_READY = false`; saving fail-closed, outside `cart_items`
- [x] Document rollback to the Amadeus adapter
- [ ] Report branch + changed-file list (commit SHA is created by the platform's git sync, not by the agent)

## Blocked / needs Marco
- [ ] Applying any migration (flight_references, social itinerary foundation)
- [ ] Deploying `flight-search` edge function + setting Duffel secret
- [ ] Deploying updated `amadeus-activities` edge function and verifying existing Amadeus/Mapbox secrets

- [x] Footer/header logo: use long taai.travel wordmark, ~50% bigger, no stretching, mobile responsive
- [x] Replace landing closing CTA with a Contact us section
- [x] Landing CTA heading: dark two-line "Where travel / meets technology."
- [x] Swap wordmark to transparent tight PNG

## Dashboard Discover placement (requested 2026-09-05)
- [ ] Move "Trips you can make your own" below Your Trips, two-panel stacked-card format (taai + featured) with same scroll controls
