-- ============================================================================
-- PROPOSAL ONLY — NOT APPLIED, NOT A MIGRATION.
-- social clone transaction + sanitized public projections, v0.1
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
-- requesting user and is 'draft' or 'active'.
create or replace function public.lifecycle_consumes_slot(_state public.itinerary_lifecycle_state)
returns boolean
language sql
immutable
as $$ select _state in ('draft', 'active') $$;

create or replace function public.count_active_slots(_user_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::int
  from public.itinerary i
  where i.user_id = _user_id
    and public.lifecycle_consumes_slot(i.lifecycle_state)
$$;

-- ---------------------------------------------------------------------------
-- 2. Sanitized public projections (deny-by-default; base table NEVER exposed)
-- ---------------------------------------------------------------------------
-- The base table public.itinerary keeps owner-only RLS. No anon/authenticated
-- SELECT policy is added to it by this proposal.

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
  moderation_status  text not null default 'under_review'
                       check (moderation_status in ('ok','flagged','under_review','unpublished','removed')),
  published_at       timestamptz
);

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

grant select on public.itinerary_public_card to anon, authenticated;
grant select on public.itinerary_public_day  to anon, authenticated;
grant all    on public.itinerary_public_card to service_role;
grant all    on public.itinerary_public_day  to service_role;

alter table public.itinerary_public_card enable row level security;
alter table public.itinerary_public_day  enable row level security;

-- Deny by default: only moderated, published rows are ever readable.
create policy "public cards readable when moderated"
on public.itinerary_public_card for select to anon, authenticated
using (moderation_status = 'ok' and published_at is not null);

create policy "public days follow their card"
on public.itinerary_public_day for select to anon, authenticated
using (exists (
  select 1 from public.itinerary_public_card c
  where c.public_slug = itinerary_public_day.public_slug
    and c.moderation_status = 'ok'
    and c.published_at is not null
));

-- Unlisted links: only a hash is stored; comparison and revocation are server-side.
create table public.itinerary_share_token (
  id            uuid primary key default gen_random_uuid(),
  public_slug   text not null references public.itinerary_public_card(public_slug) on delete cascade,
  token_hash    text not null unique,
  expires_at    timestamptz not null,
  revoked_at    timestamptz
);
grant all on public.itinerary_share_token to service_role;
alter table public.itinerary_share_token enable row level security;
-- intentionally no anon/authenticated policy: reachable only via SECURITY DEFINER.

-- ---------------------------------------------------------------------------
-- 3. Transactional clone — authenticate, lock, check, insert, or roll back
-- ---------------------------------------------------------------------------
create or replace function public.clone_public_itinerary(
  _public_slug text,
  _start_date  date
)
returns bigint
language plpgsql
security definer
set search_path = public
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
  perform pg_advisory_xact_lock(hashtextextended(v_user::text, 0));

  select * into v_card
  from public.itinerary_public_card
  where public_slug = _public_slug
    and moderation_status = 'ok'
    and published_at is not null;
  if not found then
    raise exception 'SOURCE_NOT_AVAILABLE' using errcode = 'P0002';
  end if;

  v_used := public.count_active_slots(v_user);
  if v_used >= v_limit then
    raise exception 'ACTIVE_LIMIT_REACHED' using errcode = 'P0001';
  end if;

  -- Approved descriptive fields only. Owner is the REQUESTING user; the copy is
  -- private. Excluded by construction: source owner/collaborator identities,
  -- attendees, invitations, private notes, bookings, provider confirmations,
  -- payment/checkout data, prices, availability and source-user attribution
  -- or tracking identifiers.
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

  return v_new_id;
  -- Any exception above aborts the function's transaction: no itinerary row,
  -- no day rows, no clone_count increment survive. Rollback is complete.
end;
$$;

revoke all on function public.clone_public_itinerary(text, date) from public, anon;
grant execute on function public.clone_public_itinerary(text, date) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Slot reservation trigger — server-authoritative limit for all inserts
-- ---------------------------------------------------------------------------
create or replace function public.reserve_active_itinerary_slot()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.lifecycle_consumes_slot(new.lifecycle_state) then
    perform pg_advisory_xact_lock(hashtextextended(new.user_id::text, 0));
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

-- ---------------------------------------------------------------------------
-- 5. Invitation contract — DEFINITION ONLY, no writes, no notifications.
-- Approval gate: authorization/data contract for invitations on a clone.
-- Planned shape: (id, itinerary_id -> clone, invited_by = owner only,
-- recipient_handle_hash, role in ('viewer','collaborator'), state, expires_at,
-- revoked_at). Never inherits source membership; notifications are queued
-- server-side only. Not created by this proposal.
-- ---------------------------------------------------------------------------
