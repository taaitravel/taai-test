# Social clone contract — local-only preparation (nothing applied or deployed)

## 1. Lifecycle states and the free-slot rule
Source of truth: `src/lib/social/lifecycle.ts`, mirrored by the unapplied SQL.

| State | Consumes 1 of 3 free slots | Notes |
| --- | --- | --- |
| `draft` | Yes | Created, not finalised, still editable |
| `active` | Yes | Upcoming/in-progress owned trip, including clones |
| `past` | No | End date passed; stays readable |
| `archived` | No | Frees the slot immediately, stays readable |
| `deleted` | No | Soft-deleted; frees the slot immediately |
| `saved_inspiration` | No | Bookmarked Discover content, never a trip |

Exact rule: a trip consumes a slot **only** when the requesting user owns it **and** its
lifecycle is `draft` or `active`. Trips where the user is only a collaborator never count.

## 2. Transactional clone (prepared, NOT applied)
`supabase/schema-proposals/social-clone-transaction.sql` →
`public.clone_public_itinerary(_public_slug text, _start_date date)`:
authenticates via `auth.uid()`, takes `pg_advisory_xact_lock` per user for the whole
transaction, counts slots, inserts a private clone owned by the caller, shifts dates by
stored relative `day_offset`, and aborts atomically on any failure. A BEFORE INSERT
trigger (`reserve_active_itinerary_slot`) enforces the same limit for every other insert
path. Client write path stays off: `CLONE_RPC_READY = false`, `SLOT_RPC_READY = false`.

## 3. Never copied
Source owner and collaborator identities, attendees, invitations, private notes,
bookings, provider confirmations, payment/checkout data, current prices and availability,
and any tracking/attribution identifiers belonging to the source user. The clone carries
only descriptive attribution text (title + author display name).

## 4. Public projections and RLS
`public.itinerary` gains **no** anon/authenticated SELECT policy. Public surfaces read
`itinerary_public_card` (slug, title, summary, destinations, day count, region group,
cover reference, clone count, budget band, author slug/display name, curated-by,
moderation status) and `itinerary_public_day` (day number, offset, city, places limited to
name/kind/note/time/area). Both are deny-by-default and only readable when
`moderation_status = 'ok'` and `published_at is not null`. Unlisted links store only a
token hash with expiry and revocation, reachable solely through SECURITY DEFINER.
Client allow-lists: `src/lib/social/projections.ts`.

## 5. Invitation contract (definition only)
`src/lib/social/invitation-contract.ts`: owner-only creation on the clone, hashed
recipient handle, roles `viewer` / `collaborator`, expiry and revocation, no inherited
source membership, notifications queued server-side. No writes, no notifications,
`INVITATION_CONTRACT_READY = false`.

## 6. Upgrade plan
Disabled everywhere and labelled "Upgrade plan — coming soon" (clone dialog and
Profile → Trips).

## 7. Tests
`src/lib/social/__tests__/social-contract.test.ts` covers simultaneous requests for the
final slot, complete rollback after clone failure, month/year/leap-year shifting with
preserved gaps, public/private field leakage, clone ownership/privacy, and
archived/past slot behaviour.

## 8. Remaining approval gates
1. Public projection SQL + moderation workflow.
2. Transactional clone function and slot trigger (apply, then flip the READY flags).
3. Clone write-path authorization contract in the app.
4. Invitation authorization/data contract and notification queue.
5. Paid-tier limits before enabling Upgrade plan.
6. Duffel Edge Function deployment and secret configuration (unrelated but still open).
