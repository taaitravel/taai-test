-- Account closure, deletion, and the foreign keys that block it.
--
-- The 30-day grace period and the 7-year billing retention window are NOT
-- hardcoded here. Edge functions compute purge_after and billing_retain_until
-- from ACCOUNT_CLOSURE_GRACE_DAYS and BILLING_RECORD_RETENTION_YEARS in
-- supabase/functions/_shared/account-policy.ts so counsel can change them in
-- one place. This migration does not edit Privacy Policy copy.

-- ---------------------------------------------------------------------------
-- Account state
-- ---------------------------------------------------------------------------

alter table public.users
  add column if not exists welcome_email_sent_at timestamptz;

alter table public.itinerary
  add column if not exists editing_locked boolean not null default false;

alter table public.subscribers
  add column if not exists payment_failed_at timestamptz,
  add column if not exists payment_retry_at timestamptz,
  add column if not exists payment_failure_summary text,
  add column if not exists cancel_at_period_end boolean not null default false,
  add column if not exists stripe_price_id text;

comment on column public.itinerary.editing_locked is
  'Set when a paid plan ends and this trip is beyond the free Traveler allowance. The trip stays readable.';

create table if not exists public.account_closures (
  user_id uuid primary key references auth.users(id) on delete cascade,
  status text not null default 'closed' check (status = 'closed'),
  closed_at timestamptz not null default now(),
  purge_after timestamptz not null,
  request_id uuid not null unique default gen_random_uuid(),
  email text not null,
  stripe_customer_id text,
  reopened_at timestamptz,
  check (purge_after > closed_at)
);

create index if not exists account_closures_due_idx
  on public.account_closures (purge_after)
  where reopened_at is null;

alter table public.account_closures enable row level security;
revoke all on table public.account_closures from public, anon, authenticated;
grant select, insert, update, delete on table public.account_closures to service_role;

comment on table public.account_closures is
  'A closed account cannot keep its old session. Signing in again during the grace period reopens it.';

-- Survives auth.users deletion. No user id and no email address.
create table if not exists public.account_deletion_audit (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique,
  purged_at timestamptz not null default now(),
  billing_retain_until timestamptz not null,
  stripe_customer_deleted boolean not null default false,
  storage_objects_removed integer not null default 0,
  shared_itineraries_transferred integer not null default 0,
  solo_itineraries_deleted integer not null default 0,
  miles_memory_deleted integer not null default 0,
  email_sent boolean not null default false,
  notes text
);

alter table public.account_deletion_audit enable row level security;
drop policy if exists "Admins can read deletion audits" on public.account_deletion_audit;
create policy "Admins can read deletion audits"
  on public.account_deletion_audit
  for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role));
revoke all on table public.account_deletion_audit from public, anon;
grant select on table public.account_deletion_audit to authenticated;
grant select, insert on table public.account_deletion_audit to service_role;

comment on table public.account_deletion_audit is
  'Proof that an account purge ran. Billing rows stay in payments, unlinked from the person.';

create table if not exists public.lifecycle_email_log (
  id uuid primary key default gen_random_uuid(),
  dedupe_key text not null unique,
  template_id text not null,
  to_email text not null,
  sent_at timestamptz not null default now()
);

alter table public.lifecycle_email_log enable row level security;
revoke all on table public.lifecycle_email_log from public, anon, authenticated;
grant select, insert on table public.lifecycle_email_log to service_role;

-- Durable Miles memory. Planning chat itself is not stored; this is the
-- per-person memory the purge deletes, along with booking preferences.
create table if not exists public.miles_memory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null check (char_length(btrim(content)) between 1 and 2000),
  created_at timestamptz not null default now()
);

alter table public.miles_memory enable row level security;
drop policy if exists "Users manage their own Miles memory" on public.miles_memory;
create policy "Users manage their own Miles memory"
  on public.miles_memory
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
grant select, insert, update, delete on table public.miles_memory to authenticated;
grant all on table public.miles_memory to service_role;

-- ---------------------------------------------------------------------------
-- Closed accounts cannot keep using leftover access tokens
-- ---------------------------------------------------------------------------

create or replace function public.account_is_closed(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null
    and auth.uid() = p_user_id
    and exists (
      select 1
      from public.account_closures closure
      where closure.user_id = p_user_id
        and closure.reopened_at is null
        and closure.status = 'closed'
    );
$$;

revoke all on function public.account_is_closed(uuid) from public, anon;
grant execute on function public.account_is_closed(uuid) to authenticated, service_role;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'users',
    'itinerary',
    'itinerary_attendees',
    'itinerary_invitations',
    'itinerary_chat_messages',
    'itinerary_chat_participants',
    'itinerary_chat_reactions',
    'subscribers',
    'miles_memory',
    'cart_items',
    'saved_travelers',
    'notification_preferences',
    'notifications',
    'user_booking_preferences',
    'search_history',
    'booking_receipts',
    'wishlist',
    'user_follows'
  ]
  loop
    execute format('drop policy if exists closed_account_blocked on public.%I', table_name);
    execute format(
      'create policy closed_account_blocked on public.%I as restrictive for all to authenticated using (not public.account_is_closed(auth.uid())) with check (not public.account_is_closed(auth.uid()))',
      table_name
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Read-only itineraries after a paid plan ends
-- ---------------------------------------------------------------------------

create or replace function public.prevent_locked_itinerary_edit()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'UPDATE'
     and old.editing_locked
     and coalesce(current_setting('taai.allow_itinerary_lock', true), '') is distinct from 'on' then
    raise exception 'ITINERARY_READ_ONLY'
      using errcode = 'P0001',
            hint = 'This itinerary is read-only on the free Traveler plan.';
  end if;
  return new;
end;
$$;

drop trigger if exists prevent_locked_itinerary_edit on public.itinerary;
create trigger prevent_locked_itinerary_edit
  before update on public.itinerary
  for each row execute function public.prevent_locked_itinerary_edit();

create or replace function public.apply_free_itinerary_locks(p_user_id uuid, p_keep integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  locked_count integer := 0;
begin
  perform set_config('taai.allow_itinerary_lock', 'on', true);
  if p_keep is null or p_keep < 0 then
    update public.itinerary
    set editing_locked = false
    where userid = p_user_id
      and editing_locked;
    return 0;
  end if;

  with ranked as (
    select id, row_number() over (order by created_at desc, id desc) as n
    from public.itinerary
    where userid = p_user_id
  )
  update public.itinerary itinerary
  set editing_locked = ranked.n > p_keep
  from ranked
  where itinerary.id = ranked.id
    and itinerary.editing_locked is distinct from (ranked.n > p_keep);

  select count(*) into locked_count
  from public.itinerary
  where userid = p_user_id
    and editing_locked;
  return locked_count;
end;
$$;

revoke all on function public.apply_free_itinerary_locks(uuid, integer) from public, anon, authenticated;
grant execute on function public.apply_free_itinerary_locks(uuid, integer) to service_role;

-- ---------------------------------------------------------------------------
-- Shared itinerary ownership
-- ---------------------------------------------------------------------------

create or replace function public.transfer_itinerary_owner(
  p_itinerary_id bigint,
  p_from uuid,
  p_to uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  moved_count integer := 0;
begin
  if p_from is null or p_to is null or p_from = p_to then
    return false;
  end if;
  if not exists (
    select 1
    from public.itinerary_attendees attendee
    where attendee.itinerary_id = p_itinerary_id
      and attendee.user_id = p_to
      and attendee.status = 'accepted'
      and attendee.role <> 'owner'
  ) then
    return false;
  end if;

  update public.itinerary
  set userid = p_to
  where id = p_itinerary_id
    and userid = p_from;
  get diagnostics moved_count = row_count;
  if moved_count = 0 then
    return false;
  end if;

  update public.itinerary_attendees
  set role = 'collaborator'
  where itinerary_id = p_itinerary_id
    and user_id = p_from
    and role = 'owner';

  update public.itinerary_attendees
  set role = 'owner'
  where itinerary_id = p_itinerary_id
    and user_id = p_to;

  return true;
end;
$$;

revoke all on function public.transfer_itinerary_owner(bigint, uuid, uuid) from public, anon, authenticated;
grant execute on function public.transfer_itinerary_owner(bigint, uuid, uuid) to service_role;

create or replace function public.revoke_user_sessions(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from auth.sessions where user_id = p_user_id;
  delete from auth.refresh_tokens where user_id::text = p_user_id::text;
end;
$$;

revoke all on function public.revoke_user_sessions(uuid) from public, anon, authenticated;
grant execute on function public.revoke_user_sessions(uuid) to service_role;

-- Database half of a purge. Storage files, the Stripe customer, the deletion
-- email, and auth.users are handled by the purge-closed-accounts function,
-- in that order, after this returns.
create or replace function public.prepare_account_purge(p_user_id uuid, p_request_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  itinerary_row record;
  successor uuid;
  transferred integer := 0;
  deleted_ids bigint[] := array[]::bigint[];
  miles_deleted integer := 0;
  analytics_anonymized integer := 0;
  row_count_now integer := 0;
  billing_unlinked integer := 0;
begin
  if exists (select 1 from public.master_admins master where master.user_id = p_user_id) then
    raise exception 'Protected master administrator identity cannot be deleted';
  end if;

  perform public.revoke_user_sessions(p_user_id);

  for itinerary_row in
    select id
    from public.itinerary
    where userid = p_user_id
    order by id
  loop
    select attendee.user_id into successor
    from public.itinerary_attendees attendee
    where attendee.itinerary_id = itinerary_row.id
      and attendee.user_id <> p_user_id
      and attendee.status = 'accepted'
      and attendee.role <> 'owner'
    order by attendee.joined_at asc nulls last, attendee.user_id asc
    limit 1;

    if successor is not null then
      if public.transfer_itinerary_owner(itinerary_row.id, p_user_id, successor) then
        transferred := transferred + 1;
      end if;
    else
      delete from public.trip_external_bookings where itinerary_id = itinerary_row.id;
      delete from public.itinerary where id = itinerary_row.id;
      deleted_ids := array_append(deleted_ids, itinerary_row.id);
    end if;
  end loop;

  update public.itinerary_chat_messages
  set deleted = true,
      content = null,
      attachment_type = null,
      attachment_data = null
  where sender_id = p_user_id
    and deleted = false;

  delete from public.itinerary_attendees where user_id = p_user_id;
  delete from public.itinerary_chat_participants where user_id = p_user_id;
  delete from public.itinerary_chat_reactions where user_id = p_user_id;
  delete from public.chat_mutes where user_id = p_user_id;

  delete from public.miles_memory where user_id = p_user_id;
  get diagnostics miles_deleted = row_count;
  delete from public.user_booking_preferences where user_id = p_user_id;
  delete from public.saved_travelers where user_id = p_user_id;
  delete from public.quote_travelers where user_id = p_user_id;
  delete from public.notifications where user_id = p_user_id;
  delete from public.notification_preferences where user_id = p_user_id;
  delete from public.user_follows where follower_id = p_user_id or following_id = p_user_id;
  delete from public.booking_receipts where user_id = p_user_id;

  update public.usage_tracking
  set user_id = null
  where user_id = p_user_id;
  get diagnostics analytics_anonymized = row_count;

  update public.search_history
  set user_id = null,
      search_params = '{"redacted":true}'::jsonb
  where user_id = p_user_id;
  get diagnostics row_count_now = row_count;
  analytics_anonymized := analytics_anonymized + row_count_now;

  update public.booking_audit_log
  set user_id = null,
      old_values = case when old_values is null then null else '{"redacted":true}'::jsonb end,
      new_values = case when new_values is null then null else '{"redacted":true}'::jsonb end
  where user_id = p_user_id;

  update public.financial_ledger
  set metadata = coalesce(metadata, '{}'::jsonb) - 'user_id' - 'email' - 'name'
  where metadata->>'user_id' = p_user_id::text;

  update public.trip_balances_ledger
  set payer_user_id = case when payer_user_id = p_user_id then null else payer_user_id end,
      debtor_user_id = case when debtor_user_id = p_user_id then null else debtor_user_id end
  where payer_user_id = p_user_id or debtor_user_id = p_user_id;

  update public.attendee_balances
  set creditor_user_id = case when creditor_user_id = p_user_id then null else creditor_user_id end,
      debtor_user_id = case when debtor_user_id = p_user_id then null else debtor_user_id end
  where creditor_user_id = p_user_id or debtor_user_id = p_user_id;

  update public.payments
  set user_id = null
  where user_id = p_user_id;
  get diagnostics billing_unlinked = row_count;

  update public.subscribers
  set user_id = null,
      email = 'deleted+' || id::text || '@ledger.taai.invalid',
      subscribed = false,
      cancel_at_period_end = false,
      payment_failure_summary = null
  where user_id = p_user_id;

  return jsonb_build_object(
    'transferred', transferred,
    'deleted_itinerary_ids', to_jsonb(deleted_ids),
    'miles_memory_deleted', miles_deleted,
    'analytics_anonymized', analytics_anonymized,
    'billing_unlinked', billing_unlinked
  );
end;
$$;

revoke all on function public.prepare_account_purge(uuid, uuid) from public, anon, authenticated;
grant execute on function public.prepare_account_purge(uuid, uuid) to service_role;

create or replace function public.list_user_storage_objects(
  p_user_id uuid,
  p_itinerary_ids bigint[]
)
returns table (bucket_id text, name text)
language sql
stable
security definer
set search_path = public, storage
as $$
  select objects.bucket_id, objects.name
  from storage.objects objects
  where objects.bucket_id in ('avatars', 'chat-attachments', 'receipts')
    and (
      objects.owner = p_user_id
      or objects.owner_id = p_user_id::text
      or objects.name like p_user_id::text || '/%'
      or (
        objects.bucket_id = 'chat-attachments'
        and exists (
          select 1
          from unnest(coalesce(p_itinerary_ids, array[]::bigint[])) itinerary_id
          where objects.name like itinerary_id::text || '/%'
        )
      )
    );
$$;

revoke all on function public.list_user_storage_objects(uuid, bigint[]) from public, anon, authenticated;
grant execute on function public.list_user_storage_objects(uuid, bigint[]) to service_role;

-- ---------------------------------------------------------------------------
-- Foreign keys that block deleting a person, or that destroy shared data
-- ---------------------------------------------------------------------------

-- Agent history stays. The person who did the work is unlinked.
alter table public.agent_tasks alter column created_by drop not null;
alter table public.agent_tasks alter column updated_by drop not null;
alter table public.agent_task_approvals alter column requested_by drop not null;
alter table public.agent_task_evidence alter column recorded_by drop not null;

alter table public.agent_tasks drop constraint if exists agent_tasks_created_by_fkey;
alter table public.agent_tasks drop constraint if exists agent_tasks_updated_by_fkey;
alter table public.agent_task_approvals drop constraint if exists agent_task_approvals_requested_by_fkey;
alter table public.agent_task_approvals drop constraint if exists agent_task_approvals_decided_by_fkey;
alter table public.agent_task_evidence drop constraint if exists agent_task_evidence_recorded_by_fkey;
alter table public.agent_task_events drop constraint if exists agent_task_events_actor_user_id_fkey;

alter table public.agent_tasks
  add constraint agent_tasks_created_by_fkey foreign key (created_by) references auth.users(id) on delete set null;
alter table public.agent_tasks
  add constraint agent_tasks_updated_by_fkey foreign key (updated_by) references auth.users(id) on delete set null;
alter table public.agent_task_approvals
  add constraint agent_task_approvals_requested_by_fkey foreign key (requested_by) references auth.users(id) on delete set null;
alter table public.agent_task_approvals
  add constraint agent_task_approvals_decided_by_fkey foreign key (decided_by) references auth.users(id) on delete set null;
alter table public.agent_task_evidence
  add constraint agent_task_evidence_recorded_by_fkey foreign key (recorded_by) references auth.users(id) on delete set null;
alter table public.agent_task_events
  add constraint agent_task_events_actor_user_id_fkey foreign key (actor_user_id) references auth.users(id) on delete set null;

-- A decided approval can outlive the person who decided it.
do $$
declare
  constraint_name name;
begin
  select conname into constraint_name
  from pg_constraint
  where conrelid = 'public.agent_task_approvals'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%decided_by%';
  if constraint_name is not null then
    execute format('alter table public.agent_task_approvals drop constraint %I', constraint_name);
  end if;
end $$;

alter table public.agent_task_approvals
  drop constraint if exists agent_task_approvals_decision_unlink_check;
alter table public.agent_task_approvals
  add constraint agent_task_approvals_decision_unlink_check check (
    (status = 'pending' and decided_by is null and decided_at is null)
    or (status <> 'pending' and decided_at is not null)
  );

-- Immutability triggers reject the UPDATE that ON DELETE SET NULL performs.
create or replace function public.guard_agent_task()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_has_approval boolean;
  v_has_evidence boolean;
begin
  if tg_op = 'INSERT' then
    if auth.uid() is null then
      raise exception 'Authenticated actor required';
    end if;

    new.created_by := auth.uid();
    new.updated_by := auth.uid();
    new.routed_by := 'hermes';
    new.approval_required := public.is_agent_state_changing_action(new.action_class);
    new.updated_at := now();

    if new.approval_required then
      new.status := 'awaiting_approval';
    elsif new.status in ('draft', 'awaiting_approval') then
      new.status := 'queued';
    end if;

    return new;
  end if;

  if new.title is not distinct from old.title
     and new.objective is not distinct from old.objective
     and new.assigned_agent is not distinct from old.assigned_agent
     and new.routed_by is not distinct from old.routed_by
     and new.status is not distinct from old.status
     and new.action_class is not distinct from old.action_class
     and new.risk_level is not distinct from old.risk_level
     and new.approval_required is not distinct from old.approval_required
     and new.success_criteria is not distinct from old.success_criteria
     and new.next_action is not distinct from old.next_action
     and new.source_context is not distinct from old.source_context
     and new.created_at is not distinct from old.created_at
     and new.updated_at is not distinct from old.updated_at
     and new.started_at is not distinct from old.started_at
     and new.completed_at is not distinct from old.completed_at
     and (new.created_by is null or new.created_by is not distinct from old.created_by)
     and (new.updated_by is null or new.updated_by is not distinct from old.updated_by)
     and (new.created_by is distinct from old.created_by or new.updated_by is distinct from old.updated_by)
  then
    return new;
  end if;

  if auth.uid() is null then
    raise exception 'Authenticated actor required';
  end if;

  if new.objective is distinct from old.objective
    or new.assigned_agent is distinct from old.assigned_agent
    or new.action_class is distinct from old.action_class
    or new.source_context is distinct from old.source_context then
    raise exception 'Task scope is immutable; create a new Hermes task for a changed scope';
  end if;

  new.created_by := old.created_by;
  new.created_at := old.created_at;
  new.routed_by := old.routed_by;
  new.approval_required := old.approval_required;
  new.updated_by := auth.uid();
  new.updated_at := now();

  if new.status in ('queued', 'in_progress', 'completed') and new.approval_required then
    select exists (
      select 1
      from public.agent_task_approvals approval
      where approval.task_id = old.id
        and approval.status = 'approved'
        and (approval.expires_at is null or approval.expires_at > now())
    ) into v_has_approval;

    if not v_has_approval then
      raise exception 'Security / Control approval required before consequential execution';
    end if;
  end if;

  if new.status = 'completed' and old.status <> 'completed' then
    select exists (
      select 1 from public.agent_task_evidence evidence where evidence.task_id = old.id
    ) into v_has_evidence;

    if not v_has_evidence then
      raise exception 'Evidence is required before a Hermes task can be completed';
    end if;
    new.completed_at := coalesce(new.completed_at, now());
  elsif new.status = 'in_progress' and old.status <> 'in_progress' then
    new.started_at := coalesce(new.started_at, now());
  end if;

  return new;
end;
$$;

create or replace function public.guard_agent_task_approval()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.task_id is not distinct from old.task_id
     and new.status is not distinct from old.status
     and new.action_class is not distinct from old.action_class
     and new.requested_scope is not distinct from old.requested_scope
     and new.requested_at is not distinct from old.requested_at
     and new.decided_at is not distinct from old.decided_at
     and new.decision_reason is not distinct from old.decision_reason
     and new.expires_at is not distinct from old.expires_at
     and (new.requested_by is null or new.requested_by is not distinct from old.requested_by)
     and (new.decided_by is null or new.decided_by is not distinct from old.decided_by)
     and (new.requested_by is distinct from old.requested_by or new.decided_by is distinct from old.decided_by)
  then
    return new;
  end if;

  if new.task_id is distinct from old.task_id
    or new.action_class is distinct from old.action_class
    or new.requested_scope is distinct from old.requested_scope
    or new.requested_by is distinct from old.requested_by
    or new.requested_at is distinct from old.requested_at then
    raise exception 'Approval request scope is immutable';
  end if;

  if old.status <> 'pending' then
    raise exception 'A decided approval is immutable';
  end if;

  if new.status not in ('approved', 'rejected') then
    raise exception 'Pending approvals may only be approved or rejected';
  end if;

  if auth.uid() is null then
    raise exception 'Authenticated human decision required';
  end if;

  new.decided_by := auth.uid();
  new.decided_at := now();
  return new;
end;
$$;

create or replace function public.guard_agent_task_evidence()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'UPDATE'
     and new.task_id is not distinct from old.task_id
     and new.evidence_type is not distinct from old.evidence_type
     and new.label is not distinct from old.label
     and new.summary is not distinct from old.summary
     and new.reference_url is not distinct from old.reference_url
     and new.metadata is not distinct from old.metadata
     and new.recorded_at is not distinct from old.recorded_at
     and old.recorded_by is not null
     and new.recorded_by is null
  then
    return new;
  end if;

  if tg_op <> 'INSERT' then
    raise exception 'Task evidence is immutable';
  end if;
  if auth.uid() is null then
    raise exception 'Authenticated actor required';
  end if;
  new.recorded_by := auth.uid();
  new.recorded_at := now();
  return new;
end;
$$;

create or replace function public.block_agent_task_event_mutation()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'UPDATE'
     and new.task_id is not distinct from old.task_id
     and new.event_type is not distinct from old.event_type
     and new.actor_kind is not distinct from old.actor_kind
     and new.actor_key is not distinct from old.actor_key
     and new.summary is not distinct from old.summary
     and new.metadata is not distinct from old.metadata
     and new.created_at is not distinct from old.created_at
     and old.actor_user_id is not null
     and new.actor_user_id is null
  then
    return new;
  end if;

  raise exception 'Agent task events are immutable';
end;
$$;

-- Wishlist had no ON DELETE action, so any saved item blocked account deletion.
alter table public.wishlist drop constraint if exists wishlist_user_id_fkey;
alter table public.wishlist
  add constraint wishlist_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade;

-- Software-subscription charges stay after the person is gone.
alter table public.payments alter column user_id drop not null;
alter table public.payments drop constraint if exists payments_user_id_fkey;
alter table public.payments
  add constraint payments_user_id_fkey foreign key (user_id) references auth.users(id) on delete set null;

alter table public.subscribers drop constraint if exists subscribers_user_id_fkey;
alter table public.subscribers
  add constraint subscribers_user_id_fkey foreign key (user_id) references auth.users(id) on delete set null;

-- Usage and search rows are analytics. Keep the row, drop the person.
alter table public.usage_tracking drop constraint if exists usage_tracking_user_id_fkey;
alter table public.usage_tracking
  add constraint usage_tracking_user_id_fkey foreign key (user_id) references auth.users(id) on delete set null;

alter table public.search_history alter column user_id drop not null;
alter table public.search_history drop constraint if exists search_history_user_id_fkey;
alter table public.search_history
  add constraint search_history_user_id_fkey foreign key (user_id) references auth.users(id) on delete set null;

alter table public.booking_audit_log alter column user_id drop not null;

-- A booking record on a shared trip must survive the person who typed it.
alter table public.trip_external_bookings alter column created_by drop not null;
alter table public.trip_external_bookings alter column updated_by drop not null;
alter table public.trip_external_bookings drop constraint if exists trip_external_bookings_created_by_fkey;
alter table public.trip_external_bookings drop constraint if exists trip_external_bookings_updated_by_fkey;
alter table public.trip_external_bookings
  add constraint trip_external_bookings_created_by_fkey foreign key (created_by) references auth.users(id) on delete set null;
alter table public.trip_external_bookings
  add constraint trip_external_bookings_updated_by_fkey foreign key (updated_by) references auth.users(id) on delete set null;

alter table public.trip_balances_ledger alter column payer_user_id drop not null;
alter table public.attendee_balances alter column creditor_user_id drop not null;
alter table public.attendee_balances alter column debtor_user_id drop not null;

-- The protected master administrator stays ON DELETE RESTRICT. Do not weaken that.

-- ---------------------------------------------------------------------------
-- Daily purge. The bearer lives in Vault, not in this file.
-- Insert both secrets before the job can call the function:
--   select vault.create_secret('https://<project-ref>.supabase.co', 'project_url');
--   select vault.create_secret('<LOVABLE_CRON_SECRET>', 'purge_cron_bearer');
-- ---------------------------------------------------------------------------

do $schedule$
begin
  begin
    create extension if not exists pg_cron;
  exception when others then
    raise notice 'pg_cron unavailable: %', sqlerrm;
  end;
  begin
    create extension if not exists pg_net;
  exception when others then
    raise notice 'pg_net unavailable: %', sqlerrm;
  end;

  if exists (select 1 from pg_namespace where nspname = 'cron')
     and exists (select 1 from pg_namespace where nspname = 'net')
     and exists (select 1 from pg_namespace where nspname = 'vault') then
    begin
      perform cron.unschedule(jobid)
      from cron.job
      where jobname = 'purge-closed-accounts-daily';
    exception when others then
      raise notice 'could not clear previous purge schedule: %', sqlerrm;
    end;

    perform cron.schedule(
      'purge-closed-accounts-daily',
      '15 8 * * *',
      $job$
      select net.http_post(
        url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/purge-closed-accounts',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'purge_cron_bearer')
        ),
        body := '{"source":"pg_cron"}'::jsonb,
        timeout_milliseconds := 20000
      )
      where coalesce((select decrypted_secret from vault.decrypted_secrets where name = 'project_url'), '') <> ''
        and coalesce((select decrypted_secret from vault.decrypted_secrets where name = 'purge_cron_bearer'), '') <> '';
      $job$
    );
  else
    raise notice 'Daily purge schedule skipped until pg_cron, pg_net, and vault are available';
  end if;
end
$schedule$;
