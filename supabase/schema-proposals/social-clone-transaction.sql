-- ============================================================================
-- PROPOSAL ONLY — NOT APPLIED, NOT A MIGRATION.
-- social clone transaction + sanitized public projections, v0.2
--
-- v0.2 applies the corrections from the adversarial audit in
-- docs/social/clone-contract-audit.md:
--   * slot lock also covers UPDATE (state escalation bypass closed)
--   * one authoritative "expired active" rule in the database
--   * explicit owner-scoped RLS on the base table, anon fully denied
--   * search_path pinned to '' and every relation fully qualified
--   * unlisted cards + share-token resolution through SECURITY DEFINER only
--   * defined publish / refresh / unpublish / delete path for projections
--
-- Do not move this file into supabase/migrations until the approval gates in
-- docs/social/release-inventory.md are signed off. Nothing here has been run.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Lifecycle contract (mirrors src/lib/social/lifecycle.ts)
-- ---------------------------------------------------------------------------
create type public.itinerary_lifecycle_state as enum (
  'draft', 'active', 'past', 'archived', 'deleted', 'saved_inspiration'
);

-- A trip consumes one of the three free slots ONLY when it is owned by the
-- requesting user, its state is 'draft' or 'active', AND (for 'active') its end
-- date has not passed. This function is the ONE authoritative rule; the client
-- mirror lives in src/lib/social/lifecycle.ts (effectiveLifecycleState).
create or replace function public.lifecycle_consumes_slot(
  _state    public.itinerary_lifecycle_state,
  _end_date date default null
)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select case
    when _state = 'draft'  then true
    when _state = 'active' then (_end_date is null or _end_date >= current_date)
    else false
  end
$$;

-- Effective state for display: an 'active' row whose end date has passed is
-- 'past' everywhere, without a background job rewriting rows.
create or replace function public.itinerary_effective_state(
  _state    public.itinerary_lifecycle_state,
  _end_date date
)
returns public.itinerary_lifecycle_state
language sql
immutable
set search_path = ''
as $$
  select case
    when _state = 'active' and _end_date is not null and _end_date < current_date
      then 'past'::public.itinerary_lifecycle_state
    else _state
  end
$$;

create or replace function public.count_active_slots(_user_id uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::int
  from public.itinerary i
  where i.user_id = _user_id
    and public.lifecycle_consumes_slot(i.lifecycle_state, i.end_date)
$$;

revoke all on function public.count_active_slots(uuid) from public;
grant execute on function public.count_active_slots(uuid) to authenticated, service_role;

-- Single shared lock key so EVERY slot-consuming path serialises identically.
create or replace function public.itinerary_slot_lock_key(_user_id uuid)
returns bigint
language sql
immutable
set search_path = ''
as $$ select pg_catalog.hashtextextended(_user_id::text, 8675309) $$;

-- ---------------------------------------------------------------------------
-- 2. Base-table RLS — owner-scoped private access, anon fully denied
-- ---------------------------------------------------------------------------
-- NOTE: audit finding H-4. These policies must be reconciled with the policies
-- already present on public.itinerary before this file is applied; the intent is
-- "owner only, authenticated only, no anon, no cross-user read".
alter table public.itinerary enable row level security;
alter table public.itinerary force row level security;

revoke all on public.itinerary from anon;
grant select, insert, update, delete on public.itinerary to authenticated;
grant all on public.itinerary to service_role;

drop policy if exists "itinerary owner reads"   on public.itinerary;
drop policy if exists "itinerary owner writes"  on public.itinerary;
drop policy if exists "itinerary owner updates" on public.itinerary;
drop policy if exists "itinerary owner deletes" on public.itinerary;

create policy "itinerary owner reads"
on public.itinerary for select to authenticated
using (user_id = auth.uid());

-- user_id can never be spoofed: the WITH CHECK pins it to the caller.
create policy "itinerary owner writes"
on public.itinerary for insert to authenticated
with check (user_id = auth.uid());

create policy "itinerary owner updates"
on public.itinerary for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "itinerary owner deletes"
on public.itinerary for delete to authenticated
using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 3. Sanitized public projections (deny-by-default; base table NEVER exposed)
-- ---------------------------------------------------------------------------
create table public.itinerary_public_card (
  public_slug        text primary key,
  itinerary_id       bigint not null references public.itinerary(id) on delete cascade,
  title              text not null,
  summary            text not null,
  destinations       text[] not null default '{}',
  day_count          integer not null check (day_count > 0),
  region_group       text not null check (region_group in ('A','B','C','D','F')),
  cover_reference    text not null,
  clone_count        integer not null default 0,
  budget_band        text not null check (budget_band in ('value','mid','premium')),
  author_slug        text not null,
  author_display_name text not null,
  curated_by         text not null check (curated_by in ('taai','community')),
  -- 'listed'   → discoverable in Discover / public profiles
  -- 'unlisted' → reachable ONLY through a valid share token
  listing_status     text not null default 'unlisted'
                       check (listing_status in ('listed','unlisted')),
  moderation_status  text not null default 'under_review'
                       check (moderation_status in ('ok','flagged','under_review','unpublished','removed')),
  published_at       timestamptz,
  refreshed_at       timestamptz not null default now(),
  unpublished_at     timestamptz
);

create index itinerary_public_card_itinerary_id_idx
  on public.itinerary_public_card (itinerary_id);

-- Detail rows carry descriptive planning content only. No prices, no
-- availability, no provider payloads, no identities beyond the author slug.
create table public.itinerary_public_day (
  id           bigserial primary key,
  public_slug  text not null references public.itinerary_public_card(public_slug) on delete cascade,
  day_number   integer not null check (day_number > 0),
  day_offset   integer not null check (day_offset >= 0),
  city         text not null,
  places       jsonb not null default '[]'::jsonb,   -- {name, kind, note, time, area} only
  unique (public_slug, day_number)
);

-- Read-only for clients: SELECT only, never INSERT/UPDATE/DELETE (audit item 5).
grant select on public.itinerary_public_card to anon, authenticated;
grant select on public.itinerary_public_day  to anon, authenticated;
grant all    on public.itinerary_public_card to service_role;
grant all    on public.itinerary_public_day  to service_role;
revoke insert, update, delete on public.itinerary_public_card from anon, authenticated;
revoke insert, update, delete on public.itinerary_public_day  from anon, authenticated;
revoke all on sequence public.itinerary_public_day_id_seq from anon, authenticated;

alter table public.itinerary_public_card enable row level security;
alter table public.itinerary_public_day  enable row level security;
alter table public.itinerary_public_card force row level security;
alter table public.itinerary_public_day  force row level security;

-- Deny by default: only moderated, published, LISTED rows are directly readable.
create policy "public cards readable when listed and moderated"
on public.itinerary_public_card for select to anon, authenticated
using (
  listing_status = 'listed'
  and moderation_status = 'ok'
  and published_at is not null
  and unpublished_at is null
);

create policy "public days follow their card"
on public.itinerary_public_day for select to anon, authenticated
using (exists (
  select 1 from public.itinerary_public_card c
  where c.public_slug = itinerary_public_day.public_slug
    and c.listing_status = 'listed'
    and c.moderation_status = 'ok'
    and c.published_at is not null
    and c.unpublished_at is null
));

-- No write policies exist for anon/authenticated on either table, by design.

-- ---------------------------------------------------------------------------
-- 4. Share tokens — hashes only, expiry + revocation mandatory
-- ---------------------------------------------------------------------------
create table public.itinerary_share_token (
  id            uuid primary key default gen_random_uuid(),
  public_slug   text not null references public.itinerary_public_card(public_slug) on delete cascade,
  token_hash    text not null unique,   -- sha256 of the raw token; raw never stored
  expires_at    timestamptz not null,
  revoked_at    timestamptz,
  created_at    timestamptz not null default now(),
  constraint share_token_expiry_bounded check (expires_at > created_at)
);
grant all on public.itinerary_share_token to service_role;
revoke all on public.itinerary_share_token from anon, authenticated;
alter table public.itinerary_share_token enable row level security;
alter table public.itinerary_share_token force row level security;
-- intentionally no anon/authenticated policy: reachable only via SECURITY DEFINER.

-- Resolves a raw token to a slug. Returns the slug only — never the hash, the
-- token id, the itinerary id or the owner. The raw token is never logged.
create or replace function public.resolve_share_token(_raw_token text)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_slug text;
begin
  if _raw_token is null or pg_catalog.length(_raw_token) < 24 then
    return null;
  end if;

  select t.public_slug into v_slug
  from public.itinerary_share_token t
  join public.itinerary_public_card c on c.public_slug = t.public_slug
  where t.token_hash = public.encode(
          public.digest(_raw_token, 'sha256'), 'hex')
    and t.revoked_at is null
    and t.expires_at > pg_catalog.now()
    and c.moderation_status = 'ok'
    and c.published_at is not null
    and c.unpublished_at is null;

  return v_slug;  -- null for expired, revoked, unknown or unpublished
end;
$$;

revoke all on function public.resolve_share_token(text) from public, anon;
grant execute on function public.resolve_share_token(text) to authenticated;

-- ---------------------------------------------------------------------------
-- 5. Projection lifecycle — create / refresh / unpublish / delete
-- ---------------------------------------------------------------------------
-- Owner-driven publish. Rows always start 'under_review'; only moderation
-- (service_role) may set 'ok'. Republishing refreshes in place, so no stale
-- duplicate slug can survive.
create or replace function public.publish_itinerary_projection(
  _itinerary_id bigint,
  _listing      text default 'unlisted'
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_slug text;
begin
  if v_user is null then
    raise exception 'AUTH_REQUIRED' using errcode = '28000';
  end if;
  if _listing not in ('listed','unlisted') then
    raise exception 'INVALID_LISTING' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.itinerary i
    where i.id = _itinerary_id and i.user_id = v_user
  ) then
    raise exception 'NOT_OWNER' using errcode = '42501';
  end if;

  -- Projection content is built server-side from the owner's row; the caller
  -- supplies no descriptive fields and no owner.
  select c.public_slug into v_slug
  from public.itinerary_public_card c
  where c.itinerary_id = _itinerary_id;

  if v_slug is null then
    raise exception 'PROJECTION_BUILD_REQUIRED' using errcode = 'P0002';
  end if;

  update public.itinerary_public_card
     set listing_status = _listing,
         moderation_status = case when moderation_status = 'ok' then 'ok' else 'under_review' end,
         refreshed_at = pg_catalog.now(),
         unpublished_at = null
   where public_slug = v_slug;

  return v_slug;
end;
$$;

-- Unpublishing hides the card and its days immediately (RLS reads
-- unpublished_at) and revokes every live share token, so no stale public record
-- or working link remains.
create or replace function public.unpublish_itinerary_projection(_itinerary_id bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_slug text;
begin
  if v_user is null then
    raise exception 'AUTH_REQUIRED' using errcode = '28000';
  end if;

  select c.public_slug into v_slug
  from public.itinerary_public_card c
  join public.itinerary i on i.id = c.itinerary_id
  where c.itinerary_id = _itinerary_id and i.user_id = v_user;

  if v_slug is null then
    raise exception 'NOT_OWNER' using errcode = '42501';
  end if;

  update public.itinerary_public_card
     set listing_status = 'unlisted',
         moderation_status = 'unpublished',
         unpublished_at = pg_catalog.now()
   where public_slug = v_slug;

  update public.itinerary_share_token
     set revoked_at = pg_catalog.now()
   where public_slug = v_slug and revoked_at is null;
end;
$$;

revoke all on function public.publish_itinerary_projection(bigint, text) from public, anon;
revoke all on function public.unpublish_itinerary_projection(bigint) from public, anon;
grant execute on function public.publish_itinerary_projection(bigint, text) to authenticated;
grant execute on function public.unpublish_itinerary_projection(bigint) to authenticated;

-- Deleting the base itinerary cascades to card → days → tokens (FK cascade), so
-- a deleted trip can never leave a readable public record behind.
create or replace function public.sync_projection_on_visibility_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.visibility = 'private' and coalesce(old.visibility, 'private') <> 'private' then
    update public.itinerary_public_card
       set listing_status = 'unlisted',
           moderation_status = 'unpublished',
           unpublished_at = pg_catalog.now()
     where itinerary_id = new.id;
    update public.itinerary_share_token t
       set revoked_at = pg_catalog.now()
     where t.revoked_at is null
       and t.public_slug in (
         select c.public_slug from public.itinerary_public_card c
         where c.itinerary_id = new.id
       );
  end if;
  return new;
end;
$$;

create trigger trg_sync_projection_on_visibility_change
after update of visibility on public.itinerary
for each row execute function public.sync_projection_on_visibility_change();

-- ---------------------------------------------------------------------------
-- 6. Transactional clone — authenticate, lock, check, insert, or roll back
-- ---------------------------------------------------------------------------
create or replace function public.clone_public_itinerary(
  _public_slug text,
  _start_date  date
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user   uuid := auth.uid();
  v_card   public.itinerary_public_card;
  v_used   int;
  v_limit  int := 3;
  v_new_id bigint;
begin
  if v_user is null then
    raise exception 'AUTH_REQUIRED' using errcode = '28000';
  end if;
  if _start_date is null then
    raise exception 'START_DATE_REQUIRED' using errcode = '22004';
  end if;

  -- Serialise every clone/create request for this user for the whole
  -- transaction so two concurrent requests cannot both pass the check.
  -- Identical key to the insert/update trigger.
  perform pg_catalog.pg_advisory_xact_lock(public.itinerary_slot_lock_key(v_user));

  -- Only listed OR token-resolved cards are cloneable, and only when moderated,
  -- published and not unpublished. Private, unlisted-without-token, revoked,
  -- expired and nonexistent sources all fall through to SOURCE_NOT_AVAILABLE.
  select * into v_card
  from public.itinerary_public_card
  where public_slug = _public_slug
    and listing_status = 'listed'
    and moderation_status = 'ok'
    and published_at is not null
    and unpublished_at is null;
  if not found then
    raise exception 'SOURCE_NOT_AVAILABLE' using errcode = 'P0002';
  end if;

  v_used := public.count_active_slots(v_user);
  if v_used >= v_limit then
    raise exception 'ACTIVE_LIMIT_REACHED' using errcode = 'P0001';
  end if;

  -- Approved descriptive fields only. Owner is the REQUESTING user (there is no
  -- caller-supplied owner parameter); the copy is private. Excluded by
  -- construction: source owner/collaborator identities, attendees, invitations,
  -- private notes, bookings, provider confirmations, payment/checkout data,
  -- prices, availability and source-user attribution or tracking identifiers.
  insert into public.itinerary (
    user_id, title, summary, destinations,
    start_date, end_date, visibility, lifecycle_state,
    source_public_slug, requires_fresh_pricing
  )
  values (
    v_user, v_card.title, v_card.summary, v_card.destinations,
    _start_date, _start_date + (v_card.day_count - 1),
    'private', 'active',
    v_card.public_slug, true
  )
  returning id into v_new_id;

  -- Relative day offsets are preserved exactly; gaps survive the shift.
  insert into public.itinerary_day (itinerary_id, day_number, day_date, city, places)
  select v_new_id, d.day_number, _start_date + d.day_offset, d.city,
         (
           select coalesce(jsonb_agg(jsonb_build_object(
             'name', p->>'name', 'kind', p->>'kind', 'note', p->>'note',
             'time', p->>'time', 'area', p->>'area'
           )), '[]'::jsonb)
           from jsonb_array_elements(d.places) p
         )
  from public.itinerary_public_day d
  where d.public_slug = v_card.public_slug
  order by d.day_number;

  update public.itinerary_public_card
     set clone_count = clone_count + 1
   where public_slug = v_card.public_slug;

  -- Returns only the new private itinerary id: no source owner, no source
  -- itinerary id, no moderation or token fields.
  return v_new_id;
  -- Any exception above aborts the function's transaction: no itinerary row,
  -- no day rows, no clone_count increment survive. Rollback is complete.
end;
$$;

revoke all on function public.clone_public_itinerary(text, date) from public, anon;
grant execute on function public.clone_public_itinerary(text, date) to authenticated;

-- ---------------------------------------------------------------------------
-- 7. Slot reservation triggers — server-authoritative limit for ALL paths
-- ---------------------------------------------------------------------------
-- BEFORE INSERT: the proposed row is not yet visible to count_active_slots, so
-- the existing count is compared against limit - 1 semantics via '>= 3'
-- (2 existing + this row = 3 allowed; 3 existing = rejected). No double count.
create or replace function public.reserve_active_itinerary_slot()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if public.lifecycle_consumes_slot(new.lifecycle_state, new.end_date) then
    perform pg_catalog.pg_advisory_xact_lock(public.itinerary_slot_lock_key(new.user_id));
    if public.count_active_slots(new.user_id) >= 3 then
      raise exception 'ACTIVE_LIMIT_REACHED' using errcode = 'P0001';
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_reserve_active_itinerary_slot
before insert on public.itinerary
for each row execute function public.reserve_active_itinerary_slot();

-- BEFORE UPDATE closes the escalation bypass: creating rows in a non-counting
-- state (archived/past/deleted) and then flipping them to draft/active would
-- otherwise exceed the limit without ever passing the insert check. The row
-- being updated is excluded from the count so it is never double counted.
create or replace function public.reserve_active_itinerary_slot_on_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_used int;
begin
  if new.user_id <> old.user_id then
    raise exception 'OWNER_IMMUTABLE' using errcode = '42501';
  end if;

  if public.lifecycle_consumes_slot(new.lifecycle_state, new.end_date)
     and not public.lifecycle_consumes_slot(old.lifecycle_state, old.end_date) then
    perform pg_catalog.pg_advisory_xact_lock(public.itinerary_slot_lock_key(new.user_id));
    select count(*)::int into v_used
    from public.itinerary i
    where i.user_id = new.user_id
      and i.id <> new.id
      and public.lifecycle_consumes_slot(i.lifecycle_state, i.end_date);
    if v_used >= 3 then
      raise exception 'ACTIVE_LIMIT_REACHED' using errcode = 'P0001';
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_reserve_active_itinerary_slot_on_update
before update on public.itinerary
for each row execute function public.reserve_active_itinerary_slot_on_update();

-- ---------------------------------------------------------------------------
-- 8. Invitation contract — DEFINITION ONLY, no writes, no notifications.
-- Approval gate: authorization/data contract for invitations on a clone.
-- Planned shape: (id, itinerary_id -> clone, invited_by = owner only,
-- recipient_handle_hash, role in ('viewer','collaborator'), state, expires_at,
-- revoked_at). Never inherits source membership; notifications are queued
-- server-side only. Not created by this proposal.
-- ---------------------------------------------------------------------------
