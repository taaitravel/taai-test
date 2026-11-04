-- Security advisor follow-up. FILE ONLY. Do not apply from CI or against production
-- until this migration has been reviewed.
--
-- Covers:
--   1. Revoke EXECUTE from anon and PUBLIC on the 33 SECURITY DEFINER functions
--      the advisor reports as callable by signed-out users.
--   2. Lock search_path on those functions.
--   3. Drop duplicate permissive policies and merge the remaining same-role overlaps.
--   4. Wrap raw auth.uid() calls as (select auth.uid()) so the planner can initplan them.
--   5. Index foreign keys the advisor reports as unindexed.
--
-- pg_net is NOT moved. See the note at the bottom.
--
-- Public-page exceptions: none.
-- Discover (src/pages/Discover.tsx), the landing page (src/pages/Index.tsx),
-- public itineraries, and public profiles render local fixtures. They do not
-- call these functions. Signed-in app code and RLS still need them, so
-- EXECUTE stays with authenticated and service_role. Trigger functions keep
-- those grants too: the role that runs the triggering statement must be able
-- to execute the function.
--
-- Side effect: a signed-out query against a table whose policy calls one of
-- these functions will fail with a permission error instead of returning no
-- rows. That is limited to the anon role. The public pages above do not issue
-- those queries.

-- ---------------------------------------------------------------------------
-- 1. and 2. Grants and search_path
-- ---------------------------------------------------------------------------

revoke execute on function public.auto_add_chat_participant() from public, anon;
revoke execute on function public.create_itinerary_owner() from public, anon;
revoke execute on function public.create_notification_preferences() from public, anon;
revoke execute on function public.enforce_itinerary_limit() from public, anon;
revoke execute on function public.enforce_share_limit() from public, anon;
revoke execute on function public.get_chat_joined_at(bigint, uuid) from public, anon;
revoke execute on function public.get_itinerary_participant_profiles(bigint) from public, anon;
revoke execute on function public.get_itinerary_role(bigint, uuid) from public, anon;
revoke execute on function public.handle_new_user() from public, anon;
revoke execute on function public.handle_new_user_to_users() from public, anon;
revoke execute on function public.has_role(uuid, public.app_role) from public, anon;
revoke execute on function public.initialize_budget_breakdown() from public, anon;
revoke execute on function public.initialize_user_subscription() from public, anon;
revoke execute on function public.is_chat_participant(bigint, uuid) from public, anon;
revoke execute on function public.is_itinerary_attendee(bigint, uuid) from public, anon;
revoke execute on function public.notify_chat_message() from public, anon;
revoke execute on function public.notify_follow_change() from public, anon;
revoke execute on function public.notify_user(uuid, text, text, text, text, text, text, bigint) from public, anon;
revoke execute on function public.recompute_balances_for_item(uuid) from public, anon;
revoke execute on function public.recompute_cart_item_splits(uuid) from public, anon;
revoke execute on function public.record_trip_created() from public, anon;
revoke execute on function public.release_storage_upload(text, text) from public, anon;
revoke execute on function public.reserve_storage_upload(text, text) from public, anon;
revoke execute on function public.respond_to_itinerary_invitation(uuid, boolean) from public, anon;
revoke execute on function public.sync_itinerary_to_budget_breakdown() from public, anon;
revoke execute on function public.update_bookings_updated_at() from public, anon;
revoke execute on function public.update_cart_items_updated_at() from public, anon;
revoke execute on function public.update_contact_inquiries_updated_at() from public, anon;
revoke execute on function public.update_country_coordinates_updated_at() from public, anon;
revoke execute on function public.update_itinerary_budget_breakdown_updated_at() from public, anon;
revoke execute on function public.update_itinerary_collections_updated_at() from public, anon;
revoke execute on function public.update_quotes_updated_at() from public, anon;
revoke execute on function public.validate_cart_item_splits() from public, anon;

grant execute on function public.auto_add_chat_participant() to authenticated, service_role;
grant execute on function public.create_itinerary_owner() to authenticated, service_role;
grant execute on function public.create_notification_preferences() to authenticated, service_role;
grant execute on function public.enforce_itinerary_limit() to authenticated, service_role;
grant execute on function public.enforce_share_limit() to authenticated, service_role;
grant execute on function public.get_chat_joined_at(bigint, uuid) to authenticated, service_role;
grant execute on function public.get_itinerary_participant_profiles(bigint) to authenticated, service_role;
grant execute on function public.get_itinerary_role(bigint, uuid) to authenticated, service_role;
grant execute on function public.handle_new_user() to authenticated, service_role;
grant execute on function public.handle_new_user_to_users() to authenticated, service_role;
grant execute on function public.has_role(uuid, public.app_role) to authenticated, service_role;
grant execute on function public.initialize_budget_breakdown() to authenticated, service_role;
grant execute on function public.initialize_user_subscription() to authenticated, service_role;
grant execute on function public.is_chat_participant(bigint, uuid) to authenticated, service_role;
grant execute on function public.is_itinerary_attendee(bigint, uuid) to authenticated, service_role;
grant execute on function public.notify_chat_message() to authenticated, service_role;
grant execute on function public.notify_follow_change() to authenticated, service_role;
grant execute on function public.notify_user(uuid, text, text, text, text, text, text, bigint) to authenticated, service_role;
grant execute on function public.recompute_balances_for_item(uuid) to authenticated, service_role;
grant execute on function public.recompute_cart_item_splits(uuid) to authenticated, service_role;
grant execute on function public.record_trip_created() to authenticated, service_role;
grant execute on function public.release_storage_upload(text, text) to authenticated, service_role;
grant execute on function public.reserve_storage_upload(text, text) to authenticated, service_role;
grant execute on function public.respond_to_itinerary_invitation(uuid, boolean) to authenticated, service_role;
grant execute on function public.sync_itinerary_to_budget_breakdown() to authenticated, service_role;
grant execute on function public.update_bookings_updated_at() to authenticated, service_role;
grant execute on function public.update_cart_items_updated_at() to authenticated, service_role;
grant execute on function public.update_contact_inquiries_updated_at() to authenticated, service_role;
grant execute on function public.update_country_coordinates_updated_at() to authenticated, service_role;
grant execute on function public.update_itinerary_budget_breakdown_updated_at() to authenticated, service_role;
grant execute on function public.update_itinerary_collections_updated_at() to authenticated, service_role;
grant execute on function public.update_quotes_updated_at() to authenticated, service_role;
grant execute on function public.validate_cart_item_splits() to authenticated, service_role;

alter function public.auto_add_chat_participant() set search_path = pg_catalog, public, pg_temp;
alter function public.create_itinerary_owner() set search_path = pg_catalog, public, pg_temp;
alter function public.create_notification_preferences() set search_path = pg_catalog, public, pg_temp;
alter function public.enforce_itinerary_limit() set search_path = pg_catalog, public, pg_temp;
alter function public.enforce_share_limit() set search_path = pg_catalog, public, pg_temp;
alter function public.get_chat_joined_at(bigint, uuid) set search_path = pg_catalog, public, pg_temp;
alter function public.get_itinerary_participant_profiles(bigint) set search_path = pg_catalog, public, pg_temp;
alter function public.get_itinerary_role(bigint, uuid) set search_path = pg_catalog, public, pg_temp;
alter function public.handle_new_user() set search_path = pg_catalog, public, pg_temp;
alter function public.handle_new_user_to_users() set search_path = pg_catalog, public, pg_temp;
alter function public.has_role(uuid, public.app_role) set search_path = pg_catalog, public, pg_temp;
alter function public.initialize_budget_breakdown() set search_path = pg_catalog, public, pg_temp;
alter function public.initialize_user_subscription() set search_path = pg_catalog, public, pg_temp;
alter function public.is_chat_participant(bigint, uuid) set search_path = pg_catalog, public, pg_temp;
alter function public.is_itinerary_attendee(bigint, uuid) set search_path = pg_catalog, public, pg_temp;
alter function public.notify_chat_message() set search_path = pg_catalog, public, pg_temp;
alter function public.notify_follow_change() set search_path = pg_catalog, public, pg_temp;
alter function public.notify_user(uuid, text, text, text, text, text, text, bigint) set search_path = pg_catalog, public, pg_temp;
alter function public.recompute_balances_for_item(uuid) set search_path = pg_catalog, public, pg_temp;
alter function public.recompute_cart_item_splits(uuid) set search_path = pg_catalog, public, pg_temp;
alter function public.record_trip_created() set search_path = pg_catalog, public, pg_temp;
-- These two already reach storage/private. Keep those schemas and append pg_temp.
alter function public.release_storage_upload(text, text) set search_path = pg_catalog, public, private, pg_temp;
alter function public.reserve_storage_upload(text, text) set search_path = pg_catalog, storage, public, private, pg_temp;
alter function public.respond_to_itinerary_invitation(uuid, boolean) set search_path = pg_catalog, public, pg_temp;
alter function public.sync_itinerary_to_budget_breakdown() set search_path = pg_catalog, public, pg_temp;
alter function public.update_bookings_updated_at() set search_path = pg_catalog, public, pg_temp;
alter function public.update_cart_items_updated_at() set search_path = pg_catalog, public, pg_temp;
alter function public.update_contact_inquiries_updated_at() set search_path = pg_catalog, public, pg_temp;
alter function public.update_country_coordinates_updated_at() set search_path = pg_catalog, public, pg_temp;
alter function public.update_itinerary_budget_breakdown_updated_at() set search_path = pg_catalog, public, pg_temp;
alter function public.update_itinerary_collections_updated_at() set search_path = pg_catalog, public, pg_temp;
alter function public.update_quotes_updated_at() set search_path = pg_catalog, public, pg_temp;
alter function public.validate_cart_item_splits() set search_path = pg_catalog, public, pg_temp;

-- ---------------------------------------------------------------------------
-- 3. Overlapping permissive policies
-- Identical duplicates: the PUBLIC policy already covers authenticated.
-- Different policies for the same role and command are OR-ed into one policy,
-- which is the same access with one expression for the planner.
-- ---------------------------------------------------------------------------

drop policy if exists "Users can view their own profile" on public.users;
drop policy if exists "Users can insert their own profile" on public.users;
drop policy if exists "Users can update their own profile" on public.users;
drop policy if exists "users read own usage" on public.usage_tracking;

drop policy if exists "Admins can view all booking completions" on public.booking_completions;
drop policy if exists "Users can view their own booking completions" on public.booking_completions;
create policy "Users and admins can view booking completions"
  on public.booking_completions
  as permissive
  for select
  using (
    (select auth.uid()) = user_id
    or public.has_role((select auth.uid()), 'admin'::public.app_role)
  );

drop policy if exists "Admins can view all booking intents" on public.booking_intents;
drop policy if exists "Users can view their own booking intents" on public.booking_intents;
create policy "Users and admins can view booking intents"
  on public.booking_intents
  as permissive
  for select
  using (
    (select auth.uid()) = user_id
    or public.has_role((select auth.uid()), 'admin'::public.app_role)
  );

drop policy if exists "Collaborators can update their own manual external bookings" on public.trip_external_bookings;
drop policy if exists "Owners can update manual external bookings on their trip" on public.trip_external_bookings;
create policy "Owners and collaborators can update manual external bookings"
  on public.trip_external_bookings
  as permissive
  for update
  to authenticated
  using (
    (
      (select auth.uid()) is not null
      and created_by = (select auth.uid())
      and public.get_itinerary_role(itinerary_id, (select auth.uid())) = 'collaborator'
    )
    or (
      (select auth.uid()) is not null
      and (
        public.get_itinerary_role(itinerary_id, (select auth.uid())) = 'owner'
        or exists (
          select 1
          from public.itinerary i
          where i.id = trip_external_bookings.itinerary_id
            and i.userid = (select auth.uid())
        )
      )
    )
  )
  with check (
    (
      (select auth.uid()) is not null
      and created_by = (select auth.uid())
      and updated_by = (select auth.uid())
      and source = 'external_manual'
      and evidence_type = 'user_reported'
      and evidence_quality = 'unverified'
      and manually_reported is true
      and public.get_itinerary_role(itinerary_id, (select auth.uid())) = 'collaborator'
    )
    or (
      (select auth.uid()) is not null
      and updated_by = (select auth.uid())
      and source = 'external_manual'
      and evidence_type = 'user_reported'
      and evidence_quality = 'unverified'
      and manually_reported is true
      and (
        public.get_itinerary_role(itinerary_id, (select auth.uid())) = 'owner'
        or exists (
          select 1
          from public.itinerary i
          where i.id = trip_external_bookings.itinerary_id
            and i.userid = (select auth.uid())
        )
      )
    )
  );

-- ---------------------------------------------------------------------------
-- 4. Wrap remaining raw auth.uid() calls. Already-wrapped calls are left as-is.
-- Restrictive policies (closed_account_blocked) are rewritten in place, not merged.
-- ---------------------------------------------------------------------------

do $wrap$
declare
  pol record;
  using_expr text;
  check_expr text;
  cmd text;
  role_list text;
  permissive text;
  ddl text;
begin
  for pol in
    select
      n.nspname as schema_name,
      c.relname as table_name,
      p.polname as policy_name,
      p.polcmd,
      p.polpermissive,
      p.polroles,
      pg_get_expr(p.polqual, p.polrelid) as qual,
      pg_get_expr(p.polwithcheck, p.polrelid) as with_check
    from pg_policy p
    join pg_class c on c.oid = p.polrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and (
        coalesce(pg_get_expr(p.polqual, p.polrelid), '') ~ 'auth\.uid\(\)'
        or coalesce(pg_get_expr(p.polwithcheck, p.polrelid), '') ~ 'auth\.uid\(\)'
      )
  loop
    using_expr := case
      when pol.qual is null then null
      else replace(
        replace(
          replace(pol.qual, '(select auth.uid())', '___AUTH_UID_WRAPPED___'),
          'auth.uid()',
          '(select auth.uid())'
        ),
        '___AUTH_UID_WRAPPED___',
        '(select auth.uid())'
      )
    end;
    check_expr := case
      when pol.with_check is null then null
      else replace(
        replace(
          replace(pol.with_check, '(select auth.uid())', '___AUTH_UID_WRAPPED___'),
          'auth.uid()',
          '(select auth.uid())'
        ),
        '___AUTH_UID_WRAPPED___',
        '(select auth.uid())'
      )
    end;

    if using_expr is not distinct from pol.qual and check_expr is not distinct from pol.with_check then
      continue;
    end if;

    cmd := case pol.polcmd
      when 'r' then 'select'
      when 'a' then 'insert'
      when 'w' then 'update'
      when 'd' then 'delete'
      else 'all'
    end;
    permissive := case when pol.polpermissive then 'permissive' else 'restrictive' end;

    select string_agg(format('%I', r.rolname), ', ' order by r.rolname)
      into role_list
    from pg_roles r
    where r.oid = any (pol.polroles);

    execute format('drop policy %I on %I.%I', pol.policy_name, pol.schema_name, pol.table_name);

    ddl := format(
      'create policy %I on %I.%I as %s for %s',
      pol.policy_name, pol.schema_name, pol.table_name, permissive, cmd
    );
    if role_list is not null then
      ddl := ddl || ' to ' || role_list;
    end if;
    if using_expr is not null then
      ddl := ddl || ' using (' || using_expr || ')';
    end if;
    if check_expr is not null then
      ddl := ddl || ' with check (' || check_expr || ')';
    end if;
    execute ddl;
  end loop;
end
$wrap$;

-- ---------------------------------------------------------------------------
-- 5. Foreign keys with no leading index
-- ---------------------------------------------------------------------------

create index if not exists agent_commissions_booking_id_idx on public.agent_commissions (booking_id);
create index if not exists agent_task_approvals_decided_by_idx on public.agent_task_approvals (decided_by);
create index if not exists agent_task_approvals_requested_by_idx on public.agent_task_approvals (requested_by);
create index if not exists agent_task_events_actor_user_id_idx on public.agent_task_events (actor_user_id);
create index if not exists agent_task_evidence_recorded_by_idx on public.agent_task_evidence (recorded_by);
create index if not exists agent_tasks_updated_by_idx on public.agent_tasks (updated_by);
create index if not exists booking_audit_log_booking_id_idx on public.booking_audit_log (booking_id);
create index if not exists booking_completions_booking_intent_id_idx on public.booking_completions (booking_intent_id);
create index if not exists booking_intents_cart_item_id_idx on public.booking_intents (cart_item_id);
create index if not exists booking_intents_itinerary_id_idx on public.booking_intents (itinerary_id);
create index if not exists booking_payments_booking_id_idx on public.booking_payments (booking_id);
create index if not exists bookings_quote_id_idx on public.bookings (quote_id);
create index if not exists collection_itineraries_itinerary_id_idx on public.collection_itineraries (itinerary_id);
create index if not exists itinerary_chat_messages_reply_to_id_idx on public.itinerary_chat_messages (reply_to_id);
create index if not exists itinerary_collections_user_id_idx on public.itinerary_collections (user_id);
create index if not exists miles_memory_user_id_idx on public.miles_memory (user_id);
create index if not exists payments_subscriber_id_idx on public.payments (subscriber_id);
create index if not exists payments_user_id_idx on public.payments (user_id);
create index if not exists stripe_price_tiers_tier_idx on public.stripe_price_tiers (tier);
create index if not exists trip_external_bookings_updated_by_idx on public.trip_external_bookings (updated_by);

-- ---------------------------------------------------------------------------
-- pg_net
-- Skipped. The extension is not relocatable (extrelocatable = false) and its
-- functions live in schema net, which the daily purge job calls as
-- net.http_post. ALTER EXTENSION pg_net SET SCHEMA extensions would fail, and
-- recreating the extension would break that job. PostgREST does not expose
-- the net schema. Leave the extension where it is.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- Rollback (run manually; do not append this to a later migration by accident)
--
-- grant execute on function public.auto_add_chat_participant() to public, anon;
-- ... repeat GRANT EXECUTE TO public, anon for each function revoked above.
-- alter function public.auto_add_chat_participant() set search_path = public;
-- Restore each search_path to the value recorded before this migration:
--   most functions: public, or public, pg_temp
--   handle_new_user, handle_new_user_to_users, has_role, initialize_*,
--     notify_user, recompute_*, sync_itinerary_to_budget_breakdown,
--     update_*_updated_at, validate_cart_item_splits: public, pg_temp
--   release_storage_upload: pg_catalog, public, private
--   reserve_storage_upload: pg_catalog, storage, public, private
--   the remaining trigger and helper functions that were search_path=public only:
--     auto_add_chat_participant, create_itinerary_owner, create_notification_preferences,
--     enforce_itinerary_limit, enforce_share_limit, get_chat_joined_at,
--     get_itinerary_participant_profiles, get_itinerary_role, is_chat_participant,
--     is_itinerary_attendee, notify_chat_message, notify_follow_change,
--     record_trip_created, respond_to_itinerary_invitation
--
-- drop policy "Users and admins can view booking completions" on public.booking_completions;
-- create policy "Admins can view all booking completions" on public.booking_completions
--   for select using (has_role(auth.uid(), 'admin'::public.app_role));
-- create policy "Users can view their own booking completions" on public.booking_completions
--   for select using (auth.uid() = user_id);
-- drop policy "Users and admins can view booking intents" on public.booking_intents;
-- create policy "Admins can view all booking intents" on public.booking_intents
--   for select using (has_role(auth.uid(), 'admin'::public.app_role));
-- create policy "Users can view their own booking intents" on public.booking_intents
--   for select using (auth.uid() = user_id);
-- Recreate the dropped users/profile and "users read own usage" policies from
-- the previous migration history, and split the merged trip_external_bookings
-- update policy back into the collaborator policy and the owner policy.
-- The auth.uid() rewrite is behavior-preserving; rolling it back means
-- recreating each policy with auth.uid() instead of (select auth.uid()).
--
-- drop index if exists public.agent_commissions_booking_id_idx;
-- ... drop each index created above.
-- ---------------------------------------------------------------------------
