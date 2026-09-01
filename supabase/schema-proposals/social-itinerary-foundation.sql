-- ============================================================================
-- taai — Social Itinerary Foundation (Gate: Phase 2)
-- STATUS: PROPOSAL ONLY. NOT APPLIED. NOT DEPLOYED.
-- No DROP, no DELETE, no data mutation of existing user rows other than
-- backfilling the new visibility column to the safe default ('private').
-- Apply only after Marco's explicit approval.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- A. Visibility + publication metadata on the existing itinerary table
-- ----------------------------------------------------------------------------
do $$ begin
  create type public.itinerary_visibility as enum ('private', 'unlisted', 'public');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.moderation_state as enum ('ok', 'flagged', 'under_review', 'unpublished', 'removed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.itinerary_lifecycle as enum ('active', 'archived', 'past');
exception when duplicate_object then null; end $$;

alter table public.itinerary
  add column if not exists visibility public.itinerary_visibility not null default 'private',
  add column if not exists lifecycle public.itinerary_lifecycle not null default 'active',
  add column if not exists published_at timestamptz,
  add column if not exists public_slug text,
  add column if not exists cover_asset_id uuid,
  add column if not exists source_itinerary_id bigint references public.itinerary(id) on delete set null,
  add column if not exists source_author_id uuid references auth.users(id) on delete set null,
  add column if not exists clone_count integer not null default 0,
  add column if not exists moderation_status public.moderation_state not null default 'ok',
  add column if not exists share_token uuid,          -- revocable unlisted link
  add column if not exists share_token_revoked_at timestamptz;

-- Existing rows keep the safe default; explicitly assert it.
update public.itinerary set visibility = 'private' where visibility is null;

create unique index if not exists itinerary_public_slug_key
  on public.itinerary (public_slug) where public_slug is not null;
create index if not exists itinerary_visibility_idx on public.itinerary (visibility);
create index if not exists itinerary_source_idx on public.itinerary (source_itinerary_id);
create unique index if not exists itinerary_share_token_key
  on public.itinerary (share_token) where share_token is not null;

-- Trending scores are NEVER stored on the itinerary row.
create table if not exists public.itinerary_trending_scores (
  itinerary_id bigint primary key references public.itinerary(id) on delete cascade,
  window_start timestamptz not null,
  window_end   timestamptz not null,
  score numeric not null default 0,
  computed_at timestamptz not null default now()
);
grant select on public.itinerary_trending_scores to anon, authenticated;
grant all on public.itinerary_trending_scores to service_role;
alter table public.itinerary_trending_scores enable row level security;
create policy "trending readable by everyone"
  on public.itinerary_trending_scores for select to anon, authenticated using (true);

-- ----------------------------------------------------------------------------
-- B. Public profiles (no PII)
-- ----------------------------------------------------------------------------
create table if not exists public.public_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  slug text not null,
  display_name text not null,
  avatar_url text,
  short_bio text check (short_bio is null or char_length(short_bio) <= 200),
  discoverable boolean not null default false,     -- opt-in; user can disable
  moderation_status public.moderation_state not null default 'ok',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists public_profiles_slug_key on public.public_profiles (lower(slug));

grant select on public.public_profiles to anon;
grant select, insert, update, delete on public.public_profiles to authenticated;
grant all on public.public_profiles to service_role;
alter table public.public_profiles enable row level security;

create policy "public profiles readable when discoverable"
  on public.public_profiles for select to anon, authenticated
  using (discoverable = true and moderation_status = 'ok');
create policy "owners read own profile"
  on public.public_profiles for select to authenticated using (user_id = auth.uid());
create policy "owners write own profile"
  on public.public_profiles for insert to authenticated with check (user_id = auth.uid());
create policy "owners update own profile"
  on public.public_profiles for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "owners delete own profile"
  on public.public_profiles for delete to authenticated using (user_id = auth.uid());

-- Safe public projection: no email, phone, address, preferences, attendees.
create or replace view public.public_itinerary_cards
with (security_invoker = true) as
select
  i.id,
  i.public_slug,
  i.itin_name           as title,
  i.itin_desc           as summary,
  i.itin_locations      as destinations,
  i.cover_asset_id,
  i.published_at,
  i.clone_count,
  greatest(1, (i.itin_date_end::date - i.itin_date_start::date) + 1) as day_count,
  p.slug                as author_slug,
  p.display_name        as author_display_name,
  p.avatar_url          as author_avatar_url
from public.itinerary i
join public.public_profiles p on p.user_id = i.userid
where i.visibility = 'public'
  and i.moderation_status = 'ok'
  and p.discoverable = true
  and p.moderation_status = 'ok';

grant select on public.public_itinerary_cards to anon, authenticated;

-- ----------------------------------------------------------------------------
-- D. Save (bookmark) vs clone lineage
-- ----------------------------------------------------------------------------
create table if not exists public.itinerary_bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  itinerary_id bigint not null references public.itinerary(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, itinerary_id)
);
grant select, insert, delete on public.itinerary_bookmarks to authenticated;
grant all on public.itinerary_bookmarks to service_role;
alter table public.itinerary_bookmarks enable row level security;
create policy "own bookmarks" on public.itinerary_bookmarks
  for select to authenticated using (user_id = auth.uid());
create policy "insert own bookmarks" on public.itinerary_bookmarks
  for insert to authenticated with check (user_id = auth.uid());
create policy "delete own bookmarks" on public.itinerary_bookmarks
  for delete to authenticated using (user_id = auth.uid());

create table if not exists public.itinerary_clone_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references auth.users(id) on delete cascade,
  source_itinerary_id bigint references public.itinerary(id) on delete set null,
  new_itinerary_id bigint references public.itinerary(id) on delete set null,
  requested_start date,
  requested_end date,
  day_shift integer,
  created_at timestamptz not null default now()
);
grant select, insert on public.itinerary_clone_events to authenticated;
grant all on public.itinerary_clone_events to service_role;
alter table public.itinerary_clone_events enable row level security;
create policy "own clone events" on public.itinerary_clone_events
  for select to authenticated using (actor_id = auth.uid());
create policy "insert own clone events" on public.itinerary_clone_events
  for insert to authenticated with check (actor_id = auth.uid());

-- ----------------------------------------------------------------------------
-- G. Reports / moderation
-- ----------------------------------------------------------------------------
create table if not exists public.content_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references auth.users(id) on delete set null,
  itinerary_id bigint references public.itinerary(id) on delete cascade,
  profile_user_id uuid references auth.users(id) on delete cascade,
  reason text not null check (char_length(reason) between 3 and 1000),
  state public.moderation_state not null default 'under_review',
  created_at timestamptz not null default now()
);
grant insert, select on public.content_reports to authenticated;
grant all on public.content_reports to service_role;
alter table public.content_reports enable row level security;
create policy "reporters see own reports" on public.content_reports
  for select to authenticated using (reporter_id = auth.uid());
create policy "reporters create reports" on public.content_reports
  for insert to authenticated with check (reporter_id = auth.uid());

-- ----------------------------------------------------------------------------
-- F. Free active-itinerary limit — SERVER SIDE, concurrency safe
-- ----------------------------------------------------------------------------
create or replace function public.active_itinerary_count(_user_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::int
  from public.itinerary
  where userid = _user_id
    and lifecycle = 'active'
$$;

create or replace function public.active_itinerary_limit(_user_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  -- Free tier = 3. Paid tiers are resolved from the existing subscribers table.
  select case
    when exists (
      select 1 from public.subscribers s
      where s.user_id = _user_id and s.subscribed = true
    ) then 25
    else 3
  end
$$;

-- Reserve a slot under a per-user transaction advisory lock so two concurrent
-- clone/create requests cannot both pass the check.
create or replace function public.reserve_active_itinerary_slot()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  used int;
  allowed int;
begin
  if uid is null then
    return jsonb_build_object('ok', false, 'reason', 'unauthenticated');
  end if;

  perform pg_advisory_xact_lock(hashtextextended('taai:active_itinerary:' || uid::text, 0));

  used := public.active_itinerary_count(uid);
  allowed := public.active_itinerary_limit(uid);

  if used >= allowed then
    return jsonb_build_object('ok', false, 'reason', 'limit_reached', 'used', used, 'allowed', allowed);
  end if;

  return jsonb_build_object('ok', true, 'used', used, 'allowed', allowed);
end;
$$;

revoke all on function public.reserve_active_itinerary_slot() from public;
grant execute on function public.reserve_active_itinerary_slot() to authenticated;
grant execute on function public.active_itinerary_count(uuid) to authenticated, service_role;
grant execute on function public.active_itinerary_limit(uuid) to authenticated, service_role;

-- Hard server-side backstop: block INSERTs beyond the limit even if a caller
-- skips the RPC. Bookmarks, archived and past itineraries are not counted.
create or replace function public.enforce_active_itinerary_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  used int;
  allowed int;
begin
  if new.lifecycle is distinct from 'active' or new.userid is null then
    return new;
  end if;

  perform pg_advisory_xact_lock(hashtextextended('taai:active_itinerary:' || new.userid::text, 0));
  used := public.active_itinerary_count(new.userid);
  allowed := public.active_itinerary_limit(new.userid);

  if used >= allowed then
    raise exception
      'You currently have three active trips. Archive one to start another, or upgrade for additional active itineraries. Your saved inspiration and past trips will remain available.'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_active_itinerary_limit on public.itinerary;
create trigger trg_enforce_active_itinerary_limit
  before insert on public.itinerary
  for each row execute function public.enforce_active_itinerary_limit();

-- ----------------------------------------------------------------------------
-- Public/unlisted read access to itineraries (additive policies only)
-- ----------------------------------------------------------------------------
create policy "public itineraries are readable"
  on public.itinerary for select to anon, authenticated
  using (visibility = 'public' and moderation_status = 'ok');

create policy "unlisted itineraries readable with share token"
  on public.itinerary for select to anon, authenticated
  using (
    visibility = 'unlisted'
    and moderation_status = 'ok'
    and share_token_revoked_at is null
    and share_token is not null
    and share_token::text = current_setting('request.headers.x-taai-share-token', true)
  );

commit;

-- ROLLBACK (see docs/social-itinerary/README.md) — additive only:
--   drop trigger trg_enforce_active_itinerary_limit on public.itinerary;
--   drop function reserve_active_itinerary_slot, enforce_active_itinerary_limit,
--        active_itinerary_count, active_itinerary_limit;
--   drop view public_itinerary_cards;
--   drop policy "public itineraries are readable" on public.itinerary;
--   drop policy "unlisted itineraries readable with share token" on public.itinerary;
--   drop table content_reports, itinerary_clone_events, itinerary_bookmarks,
--        itinerary_trending_scores, public_profiles;
--   alter table itinerary drop column ... (new columns only);
--   drop type itinerary_visibility, moderation_state, itinerary_lifecycle;
