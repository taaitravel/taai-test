# Original-backend recovery & schema-reconciliation audit (READ-ONLY)

Nothing was reconnected, applied, deployed, published or written. No environment variable was
changed, no key was read or displayed, no migration was created, no SQL was executed against
either backend. Evidence below comes only from repository files, git history and the
non-secret project configuration already present in this session.

## 1. Currently connected (empty) backend

| Item | Value |
| --- | --- |
| Project name | Lovable Cloud project for this app (auto-created) |
| Project reference | `lmfipcgkqclvejmcknvm` |
| Hostname | `lmfipcgkqclvejmcknvm.supabase.co` |
| Source of truth | `supabase/config.toml` (single line, commit `38889052`, 2026-09-05) |

State: empty. No database functions, no triggers, no application tables reported by the
session's backend configuration. Buckets present: `avatars` (public), `chat-attachments`
(public), `receipts` (private). No keys are reproduced in this document.

## 2. Evidence of the original taai backend

- `supabase/config.toml` carried `project_id = "dhbvweazpqnviqwgpurv"` continuously from
  commit `0886c247` through `830943b5` (2026-09-01), i.e. for the entire application build.
- Commit `38889052` ("Changes", 2026-09-05) replaced that file with a one-line
  `project_id = "lmfipcgkqclvejmcknvm"` and dropped the whole `[functions.*]`
  `verify_jwt` block — the signature of a newly provisioned Cloud project, not a migration.
- One older reference exists: `project_id = "yxlyiptrvfbtglueijkl"`, replaced by
  `dhbvweazpqnviqwgpurv` early in history (pre-application-schema).
- Generated types committed alongside `dhbvweazpqnviqwgpurv` describe 49 tables, 10 RPCs and
  the `app_role` enum, matching every table/RPC the frontend calls today.

## 3. Comparison

| | Reference | Notes |
| --- | --- | --- |
| Connected now | `lmfipcgkqclvejmcknvm` | empty schema, created 2026-09-05 |
| Expected original | `dhbvweazpqnviqwgpurv` | held the application schema and data |
| Superseded | `yxlyiptrvfbtglueijkl` | historical, pre-schema, do not reconnect |

Supporting evidence: continuous config history, generated types matching frontend usage,
`[functions.*]` map matching `supabase/functions/` directories.

Uncertainty / conflicts:
- Ownership/organisation of `dhbvweazpqnviqwgpurv` cannot be verified from the repository;
  only the reference string is evidenced.
- Whether that project is still active, paused or deleted is UNVERIFIED here.
- The generated types are a snapshot; drift after their last regeneration is unknown.
- `config.toml` is auto-generated on Lovable Cloud, so it cannot be edited to switch back.

## 4. Restored historical types — temporary and unverified

Working tree `src/integrations/supabase/types.ts` is currently the **empty** 155-line
generated file (0 tables). The rich snapshot exists in git at commits `1c57742f`
("Added share, public edit, etc.", 2026-09-05), `144bc3f9` and `720a701d` — 2477 lines,
59 entries (49 tables + 10 functions). Any working copy taken from those commits must be
treated as unverified until regenerated from a real backend.

Tables the frontend reads/writes (44): agent_task_approvals, agent_task_events,
agent_task_evidence, agent_tasks, attendee_balances, booking_attempts, booking_completions,
booking_intents, booking_quotes, booking_receipts, cart_item_splits, cart_items, chat_mutes,
collection_itineraries, contact_inquiries, country_coordinates, financial_ledger, itinerary,
itinerary_attendees, itinerary_budget_breakdown, itinerary_chat_messages,
itinerary_chat_participants, itinerary_chat_reactions, itinerary_collections,
itinerary_event_completions, itinerary_events, itinerary_invitations, master_admins,
notification_preferences, notifications, payments, quote_reprice_events, quote_travelers,
quotes, receipts, saved_travelers, search_history, subscribers, trip_external_bookings,
usage_tracking, user_booking_preferences, user_follows, user_roles, users, wishlist.

RPCs called by the frontend: `has_role`, `get_itinerary_participant_profiles`,
`recompute_balances_for_item`, `recompute_cart_item_splits`. Present in the snapshot but not
yet called: `get_chat_joined_at`, `get_itinerary_role`, `is_chat_participant`,
`is_itinerary_attendee`, `notify_user`.

Enums: `app_role: 'admin' | 'support'` only. No itinerary lifecycle enum exists.

## 5. Read-only reconciliation checklist for the original backend

Run each item as a read-only inspection after reconnection, before any migration.

1. **itinerary columns** — snapshot shows `id bigint`, `itin_id uuid`, `userid uuid`,
   `itin_name`, `itin_desc`, `itin_date_start`, `itin_date_end`, `budget`, `spending`,
   `budget_rate`, `b_efficiency_rate`, `user_type`, `itin_locations`, `itin_map_locations`,
   `attendees`, `flights`, `hotels`, `activities`, `reservations`, `expedia_data`, `images`,
   `planned_traveler_count`, `creation_key`, `created_at`. Confirm live parity.
2. **Lifecycle/status values** — confirm there is NO `lifecycle_state`, `visibility`,
   `title`, `summary`, `destinations`, `start_date`, `end_date`, `source_public_slug` or
   `requires_fresh_pricing` column, and no lifecycle enum type.
3. **Profile/auth dependencies** — `users` table shape, trigger on new auth users,
   `user_roles` + `has_role`, `master_admins`, email confirmation and provider settings.
4. **Membership/collaborator policies** — `itinerary_attendees`, `itinerary_invitations`,
   `itinerary_chat_participants`, plus `is_itinerary_attendee`, `get_itinerary_role`,
   `is_chat_participant` and any policy on `itinerary` that grants attendee reads.
5. **Existing RLS** — dump `pg_policies` for every table above before writing new policies.
6. **RPC names/signatures** — verify all 10 functions and their argument types unchanged.
7. **Storage buckets** — `avatars` (public read, restricted listing), `receipts` (private),
   `chat-attachments`; confirm object policies including the avatar-listing hardening.
8. **Edge Functions** — 38 directories exist locally; confirm deployment state and the
   `verify_jwt` map from the historical `config.toml`, plus secret presence by name only.
9. **Generated type compatibility** — regenerate types from the reconnected project and diff
   against `1c57742f`; treat any diff as required frontend work, not as a schema fix.

## 6. v0.2 social proposal audit vs. production RLS

Findings, all blocking:

- **B-1 Column contract mismatch.** The proposal addresses `public.itinerary.user_id`,
  `title`, `summary`, `destinations`, `start_date`, `end_date`, `lifecycle_state`,
  `visibility`. Production uses `userid`, `itin_name`, `itin_desc`, `itin_locations`,
  `itin_date_start`, `itin_date_end`, and has no lifecycle/visibility columns. Applied as
  written it fails or, worse, matches nothing.
- **B-2 Collaborator access destroyed.** Lines 100–121 `drop policy if exists` four names and
  create owner-only `select/insert/update/delete` policies, then
  `force row level security`. Production grants attendees and chat participants read (and
  scoped write) access via `is_itinerary_attendee` / `get_itinerary_role`. Because the
  proposal drops by *its own* policy names it will not remove the live attendee policies, but
  `force row level security` plus `revoke all ... from anon` still changes effective access,
  and the four new owner policies coexist with unknown live ones. **The base-table RLS block
  must be split out of the proposal and rewritten only after `pg_policies` is read.**
- **B-3 Owner column name.** `user_id = auth.uid()` must become `userid = auth.uid()`, and
  the OWNER_IMMUTABLE trigger check likewise.
- **B-4 Invitations already exist.** `itinerary_invitations` and the send/accept/manage Edge
  Functions are live; the proposal's invitation contract must extend them, not define a
  parallel system.
- **B-5 Recommendation.** Apply the proposal in three separately approved parts:
  (a) additive columns + lifecycle enum, (b) projections/share tokens/RPCs (fully additive,
  no base-table policy changes), (c) a base-table RLS diff authored against the live dump and
  explicitly preserving collaborator reads.

## 7. Date semantics for the past-trip slot rule

| Case | Proposal behaviour | Assessment |
| --- | --- | --- |
| `end_date is null` | `lifecycle_consumes_slot` returns true (line 40) | Correct fail-closed; frontend `effectiveLifecycleState` also keeps `active` when end date is null — consistent. |
| DB `current_date` timezone | Evaluated in the database session timezone, normally UTC | A trip ending "today" in New York (UTC−4/5) is already `past` in UTC for the first hours of the day; frees a slot up to ~5 h early. |
| Itinerary-local timezone | Not modelled at all | Trips have no timezone column; per-trip local evaluation is impossible today. Recommended interim rule: compare against `(now() at time zone 'America/New_York')::date` to match the product's stated US/NY default, and document it. |
| Boundary | `end_date >= current_date` counts, `<` is past | Inclusive last day, matches the schema contract (`itin_date_end` inclusive). |
| Draft with historical dates | `draft` always consumes a slot regardless of dates | Intentional but user-visible: an abandoned old draft holds one of three slots forever. Either keep and surface it in the limit UI, or extend the rule to expire stale drafts — a product decision, not a defect. |
| Frontend mirror | `effectiveLifecycleState` uses the browser's local date | Diverges from the DB by up to a day near midnight. Should use a single server-provided or fixed-zone date. |

## 8. Reconnect procedure (not executed)

1. Confirm `dhbvweazpqnviqwgpurv` still exists and is owned by the taai organisation.
2. In Lovable, connect that existing Supabase project instead of enabling a new Cloud
   backend — the connect flow must offer project selection; do not accept auto-provisioning.
3. Do not hand-edit `.env` or `supabase/config.toml`; both are generated by the connection.
4. Regenerate `src/integrations/supabase/types.ts` from the reconnected project.
5. Diff the regenerated types against `1c57742f` and fix only real frontend drift.
6. Run the section 5 checklist read-only; record `pg_policies`, RPC signatures, buckets,
   deployed functions and secret names (names only).
7. Keep `CLONE_RPC_READY`, `INVITATION_CONTRACT_READY`, `SLOT_RPC_READY` false.
8. Only then propose the split social migration from section 6.

## 9. Rollback procedure

- Code rollback point: current HEAD `3d869952` ("Work in progress"); last known-good types
  snapshot `1c57742f`; last known-good backend config `830943b5`.
- If reconnection produces the wrong project, disconnect before any migration — no schema was
  applied by this audit, so rollback is a code revert only.
- If a migration is later applied to the wrong backend, stop, do not retry, and restore from
  the project's own point-in-time backup; never replay this repo's proposals against a
  populated database without the section 5 dump.

## 10. Approvals required

1. Confirmation that `dhbvweazpqnviqwgpurv` is the correct original project and reconnecting
   is authorised.
2. Approval to regenerate types after reconnection.
3. Approval of the split social migration (additive columns / additive projections / RLS diff).
4. Decision on the slot-rule timezone (US-NY date vs UTC) and on stale drafts.
5. Separate approval for Edge Function deployment and provider secrets.

## 11. Confirmation

No backend was reconnected or disconnected, no environment variable or key was changed,
read or displayed, no SQL was applied, no migration file was created, nothing was deployed
or published, and no data was written to either backend. All findings are derived from local
files and git history.
