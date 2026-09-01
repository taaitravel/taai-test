# taai roadmap

## In progress
- [x] Phase 1 — Supabase egress containment (useItineraryData, useDashboardData, useCountryData, dev read-guard, regression tests)
- [ ] Search recovery — canonical flight rendering, structured failures, real-data activity cards, Discover navigation
- [ ] Phase 2 — Social itinerary foundation (unapplied migration + synthetic Discover / public profile / clone / limit UI)

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
