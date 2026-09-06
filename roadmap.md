# TAAI recovery roadmap

## Blocked (needs Marco / platform action, not code)
- [ ] Repoint the app's live backend from the empty project (`lmfipcgkqclvejmcknvm`) back to the authoritative one (`dhbvweazpqnviqwgpurv`). Cannot be done from code; the platform connection rewrites `.env` and the generated types.
- [ ] Restore/confirm `info@taai.travel` and `marco.brugo2015@gmail.com` plus DEMO CALIFORNIA — only possible once the authoritative backend is reconnected. No accounts or trips have been touched.
- [ ] Configure Google sign-in redirect URLs and the map token in the authoritative backend.

## Done locally (nothing deployed, published or migrated)
- [x] Restored the full generated database types (the empty backend had overwritten them with stubs).
- [x] Lazy, session-cached map key loader with a contained "Map unavailable" fallback, no retry loop, single sanitized log line.
- [x] Browse sections rebuilt as dashboard-style boxes: "taai Featured" then "taai Creators", 3/2/1 columns, arrows in a reserved gutter with 44x44 targets and boundary disabling.

## Open (local, next)
- [ ] Public itinerary publication proposal (unapplied SQL/RLS/storage + frontend contract), readiness flags stay false.
- [ ] Profile-loading tolerance for a missing profile row without dropping a valid session.
