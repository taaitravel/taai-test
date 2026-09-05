# Adversarial security & concurrency audit — social cloning contract

Local-only. **Nothing was applied, deployed, published or migrated.** No production data
was written, no provider was called, and `CLONE_RPC_READY`, `INVITATION_CONTRACT_READY`
and `SLOT_RPC_READY` all remain `false`.

Reviewed: `supabase/schema-proposals/social-clone-transaction.sql`,
`src/lib/social/lifecycle.ts`, `src/lib/social/clone-transaction.ts`,
`src/lib/social/invitation-contract.ts`, `docs/social/clone-contract.md`.

## Findings by severity (v0.1 → corrected in v0.2)

### HIGH

**H-1 — Slot limit bypass by state escalation.** v0.1 enforced the limit only on
`BEFORE INSERT`. A caller could insert rows in a non-counting state (`archived`, `past`,
`deleted`, or `saved_inspiration`) and then `UPDATE` them to `active`, exceeding three
owned active slots without ever passing the check.
*Correction:* added `reserve_active_itinerary_slot_on_update()` + `BEFORE UPDATE` trigger,
taking the same lock, counting `id <> new.id` so the updated row is never double counted,
and only when the transition starts consuming a slot.

**H-2 — Owner column mutable.** v0.1 had no guard against `user_id` being changed on
update, and the proposal added no base-table RLS, so a spoofed or reassigned owner was
possible depending on pre-existing policies.
*Correction:* explicit `with check (user_id = auth.uid())` insert/update policies plus an
`OWNER_IMMUTABLE` exception in the update trigger. `clone_public_itinerary()` still takes
no owner parameter, so the RPC has no injection surface at all.

**H-3 — Expired active trips never freed their slot.** The database counted every
`active` row forever, while the frontend documented "end date passed → past → slot freed".
Travelers would permanently lose slots to finished trips, and the two layers disagreed.
*Correction:* one authoritative rule — `lifecycle_consumes_slot(state, end_date)` counts
`draft` always and `active` only while `end_date >= current_date`;
`itinerary_effective_state()` reports `past` for expired active rows. The frontend now
mirrors it exactly (`effectiveLifecycleState`, `isSlotConsuming`, `countConsumedSlots`,
`evaluateSlots`). No background job or row rewrite is required.

**H-4 — Base-table RLS unspecified (partially UNVERIFIED).** v0.1 asserted "owner-only
RLS" on `public.itinerary` without stating the policies. The current Cloud backend for
this project has an empty schema, so the *live* policies on the existing production table
could not be read during this audit; that reconciliation stays **UNVERIFIED**.
*Correction:* the proposal now states the intended contract explicitly — RLS enabled and
forced, all privileges revoked from `anon`, and four `authenticated` policies scoped to
`user_id = auth.uid()`. These must be diffed against the existing policies before apply.

**H-5 — Unlisted sharing was unreachable / unenforced.** v0.1 stored token hashes but had
no resolution path and no listing distinction, so a valid share link could not read its
card while any published card was fully public.
*Correction:* `listing_status in ('listed','unlisted')`; direct RLS reads require
`listed`; unlisted access goes only through `resolve_share_token()` (SECURITY DEFINER),
which checks `revoked_at is null`, `expires_at > now()` and card moderation, and returns
the slug only — never the hash, token id, itinerary id or owner. No raw token is logged.

### MEDIUM

**M-1 — `search_path` shadowing.** `lifecycle_consumes_slot` had no pinned `search_path`,
and the others used `set search_path = public`, which still resolves an attacker-created
schema earlier if it precedes `public`.
*Correction:* every function is now `set search_path = ''` with fully qualified relation
and built-in names (`pg_catalog.now()`, `pg_catalog.hashtextextended`, …).

**M-2 — Divergent lock keys.** The clone RPC and the trigger each computed
`hashtextextended(user::text, 0)` independently; any future drift would silently stop
serialising the two paths.
*Correction:* one immutable helper, `itinerary_slot_lock_key(uuid)`, used by all three
slot paths. A test asserts three call sites and no raw `hashtext` lock.

**M-3 — Stale public records.** v0.1 defined no create/refresh/unpublish path, so a trip
turned private could keep a readable public card.
*Correction:* `publish_itinerary_projection()` (owner-checked, moderation cannot be
self-granted, refresh in place — no duplicate slug), `unpublish_itinerary_projection()`
(sets `unpublished_at`, flips to `unpublished`, revokes every live token), a
`visibility → private` trigger doing the same automatically, and FK `on delete cascade`
from itinerary → card → days → tokens.

**M-4 — Sequence write reachable.** `itinerary_public_day` is a `bigserial`; default
sequence privileges could allow `nextval` from client roles.
*Correction:* explicit `revoke all on sequence … from anon, authenticated`, plus explicit
`revoke insert, update, delete` on both projection tables.

### LOW / INFORMATIONAL

- **L-1** `count_active_slots()` was executable by `PUBLIC`; now revoked and granted to
  `authenticated` and `service_role` only.
- **L-2** The insert path assumes base columns `summary`, `destinations`, `visibility`,
  `lifecycle_state`, `source_public_slug`, `requires_fresh_pricing` that only exist after
  `social-itinerary-foundation.sql` is applied. Apply order is a gate, not a defect.
- **L-3** Clone returns `bigint` only — no source owner, moderation or token fields.

## Answers to the audit questions

1. **Same lock everywhere:** yes, after M-2. The clone RPC, the insert trigger and the new
   update trigger all call `pg_advisory_xact_lock(public.itinerary_slot_lock_key(user))`,
   transaction-level, so the lock is held until commit or rollback.
2. **No double counting, no over-allocation:** `BEFORE INSERT` runs before the row is
   visible, so `count_active_slots >= 3` means "3 already committed"; two used still
   admits one insert. The update trigger excludes `new.id`. Because the lock is taken
   before counting and released only at commit, concurrent transactions serialise and the
   second one re-counts the committed result — it cannot pass.
3. **Expired active trips:** one database rule (H-3), frontend matched.
4. **Base-table RLS:** owner-scoped `authenticated` policies only, `anon` revoked, cross-
   user reads impossible. Reconciliation with existing live policies remains UNVERIFIED.
5. **Public projections:** `SELECT` only for `anon`/`authenticated`; insert/update/delete
   revoked, no write policies, sequence revoked.
6. **`clone_public_itinerary()`:** authenticated-only (`auth.uid()` check +
   `revoke from public, anon` + `grant to authenticated`), `search_path = ''`, fully
   qualified names, no caller-supplied owner, sources restricted to listed + moderated +
   published + not unpublished, returns only the new id.
7. **Share tokens:** hash only, expiry mandatory and bounded, revocation supported and
   enforced, hashes unreachable from clients, no raw-token logging.
8. **Projection lifecycle:** see M-3.
9. **Tests:** `supabase/schema-proposals/social-clone-transaction.test.sql` (12 proposal
   blocks: concurrent creates, create vs clone race, escalation bypass, expiry, owner
   injection, cross-user read, projection writes, unavailable sources, revoked/expired
   tokens, `search_path` shadowing, execute privileges) and
   `src/lib/social/__tests__/clone-contract-audit.test.ts` (local simulation + SQL
   contract assertions).

## Changed files

- `supabase/schema-proposals/social-clone-transaction.sql` (v0.2, still unapplied)
- `supabase/schema-proposals/social-clone-transaction.test.sql` (new, never run)
- `src/lib/social/lifecycle.ts` (effective-state rule)
- `src/lib/social/active-slots.ts` (end-date aware slot evaluation)
- `src/lib/social/clone-transaction.ts` (direct-create path on the same lock)
- `src/lib/social/__tests__/clone-contract-audit.test.ts` (new)
- `docs/social/clone-contract-audit.md` (this report)

## Remaining approval gates

Unchanged from `docs/social/release-inventory.md`, plus: reconcile the proposed base-table
RLS with the live policies (H-4) and define the moderation workflow that may set
`moderation_status = 'ok'`.
