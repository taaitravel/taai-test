# Social readiness — frontend release inventory (local only)

Nothing here has been published, deployed or migrated.

## A. Already published — egress containment
- `src/lib/data/request-controller.ts`
- `src/lib/data/read-guard.ts`
- `src/hooks/useDashboardData.ts`
- `src/hooks/useItineraryData.ts`
- `src/types/dashboard-summary.ts`
- `src/hooks/__tests__/egress-stability.test.tsx`
- `src/hooks/__tests__/request-containment.test.tsx`
- `src/lib/data/__tests__/request-cache-bounds.test.ts`

## B. Unpublished — Discover / social (synthetic only)
- `src/lib/social/types.ts`
- `src/lib/social/mock-discover.ts` (adds the Trending row, same six fixtures)
- `src/lib/social/projections.ts` (new — privacy allow-lists)
- `src/lib/social/clone.ts` (relative day spacing, descriptive content)
- `src/lib/social/active-slots.ts` (free-tier policy + limit actions)
- `src/components/social/PublicItineraryCard.tsx`
- `src/components/social/PublicItineraryCalendar.tsx`
- `src/components/social/DiscoverRow.tsx`
- `src/components/social/CloneTripDialog.tsx` (limit actions, invite disabled)
- `src/components/dashboard/sections/DiscoverStrip.tsx`
- `src/components/profile/ProfileTripsSection.tsx` (new)
- `src/pages/Discover.tsx`, `src/pages/PublicItinerary.tsx`, `src/pages/PublicProfile.tsx`, `src/pages/Profile.tsx`
- `src/lib/social/__tests__/social-foundation.test.ts`
- `src/lib/social/__tests__/social-readiness.test.ts` (new)

## C. Duffel flight search (test mode, reference only)
- `src/hooks/useFlightSearch.ts`
- `src/components/search/fields/FlightSearchFields.tsx`
- `src/lib/flights/flight-reference.ts`, `src/lib/flights/flight-reference-row.ts`
- `src/lib/flights/__tests__/flight-search.test.ts`, `flight-cabin-timeout.test.ts`

## D. Migrations and Edge Functions — NOT in any release
- `supabase/schema-proposals/social-itinerary-foundation.sql` (unapplied)
- `supabase/schema-proposals/flight-references.sql` (unapplied)
- `supabase/functions/flight-search/*` (not deployed)
- Excluded from all three releases: `20260807231500_itinerary_membership_contract.sql`,
  `20260808190000_agent_operations_foundation.sql`, `20260808233000_protected_master_admin.sql`

## Free-tier policy (recommended v0.1)
- Limit: **3 active itineraries**.
- Counts: owned itineraries with lifecycle `active`, including cloned copies.
- Does not count: archived, past and deleted trips, plus saved inspiration.
- Archiving or deleting frees a slot immediately; archived/past trips stay readable.
- Limit reached message: "You currently have three active trips. Archive one to start another,
  or upgrade for additional active itineraries. Your saved inspiration and past trips will
  remain available." Actions: **Archive a trip** (`/my-itineraries`) and **Upgrade plan** (`/subscription`).

## Remaining approvals before anything ships
1. Public projection SQL (SECURITY DEFINER) + moderation workflow.
2. Transactional active-slot reservation function (`SLOT_RPC_READY` stays `false`).
3. Clone write path and its authorization contract.
4. Invite-friends authorization/data contract for cloned trips (UI stays disabled).
5. Duffel Edge Function deployment and secret configuration.

## E. Social contract preparation (local only, nothing applied)
- SQL proposal (unapplied): `supabase/schema-proposals/social-clone-transaction.sql`
- Frontend contracts: `src/lib/social/lifecycle.ts`, `src/lib/social/clone-transaction.ts`
  (`CLONE_RPC_READY = false`), `src/lib/social/invitation-contract.ts`
  (`INVITATION_CONTRACT_READY = false`), `src/lib/social/active-slots.ts`
- UI: `src/components/social/CloneTripDialog.tsx`, `src/components/profile/ProfileTripsSection.tsx`
  (Upgrade plan disabled, "coming soon")
- Tests: `src/lib/social/__tests__/social-contract.test.ts`
- Docs: `docs/social/clone-contract.md`
