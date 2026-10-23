-- Plan limits, tier lookup, lightweight usage, and upload ceilings.
-- Do not apply this file from the coding agent. The founder applies it
-- in the Supabase SQL editor or with `supabase db push` after review.
-- Existing trips over the free limit stay readable and editable. Only new
-- inserts are blocked.

create table if not exists public.plan_limits (
  tier text primary key,
  max_itineraries integer not null,
  max_shared_friends integer not null,
  monthly_ai_credits integer not null,
  display_name text not null
);

insert into public.plan_limits (tier, max_itineraries, max_shared_friends, monthly_ai_credits, display_name)
values
  ('traveler', 3, 10, 5, 'Traveler'),
  ('taai_traveler', 20, 20, 50, 'taaiTraveler'),
  ('taai_traveler_plus', -1, -1, 100, 'taaiTraveler+'),
  ('corp_taai_traveler_plus', 100, 50, 200, 'Corp. taaiTraveler+'),
  ('taai_enterprise_plus', -1, -1, -1, 'taaiEnterprise+')
on conflict (tier) do update set
  max_itineraries = excluded.max_itineraries,
  max_shared_friends = excluded.max_shared_friends,
  monthly_ai_credits = excluded.monthly_ai_credits,
  display_name = excluded.display_name;

alter table public.plan_limits enable row level security;
drop policy if exists "read plan limits" on public.plan_limits;
create policy "read plan limits" on public.plan_limits for select using (true);

create table if not exists public.stripe_price_tiers (
  price_id text primary key,
  product_id text,
  lookup_key text,
  tier text not null references public.plan_limits (tier),
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.stripe_price_tiers enable row level security;
drop policy if exists "read stripe price tiers" on public.stripe_price_tiers;
create policy "read stripe price tiers" on public.stripe_price_tiers for select using (true);

create unique index if not exists subscribers_user_id_key on public.subscribers (user_id);

alter table public.users add column if not exists last_active_at timestamptz;

create index if not exists usage_tracking_user_type_created_idx
  on public.usage_tracking (user_id, usage_type, created_at desc);

alter table public.usage_tracking enable row level security;
drop policy if exists "users read own usage" on public.usage_tracking;
create policy "users read own usage"
  on public.usage_tracking
  for select
  to authenticated
  using (user_id = auth.uid());

create or replace function public.current_tier(uid uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select subscription_tier
      from public.subscribers
      where user_id = uid
        and subscribed = true
        and subscription_tier is not null
      order by updated_at desc
      limit 1
    ),
    'traveler'
  );
$$;

revoke all on function public.current_tier(uuid) from public, anon, authenticated;
grant execute on function public.current_tier(uuid) to service_role;

create or replace function public.enforce_itinerary_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  lim integer;
  cnt integer;
  tier text;
begin
  if new.userid is null then
    return new;
  end if;
  tier := public.current_tier(new.userid);
  select max_itineraries into lim from public.plan_limits where plan_limits.tier = tier;
  if lim is null or lim < 0 then
    return new;
  end if;
  select count(*) into cnt from public.itinerary where userid = new.userid;
  if cnt >= lim then
    raise exception 'PLAN_LIMIT_ITINERARIES'
      using hint = format('limit=%s tier=%s', lim, tier), errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_itinerary_limit on public.itinerary;
create trigger enforce_itinerary_limit
  before insert on public.itinerary
  for each row execute function public.enforce_itinerary_limit();

create or replace function public.record_trip_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.userid is not null then
    insert into public.usage_tracking (user_id, usage_type, credits_used)
    values (new.userid, 'trip_created', 0);
    update public.users set last_active_at = now() where userid = new.userid;
  end if;
  return new;
exception
  when others then
    return new;
end;
$$;

drop trigger if exists record_trip_created on public.itinerary;
create trigger record_trip_created
  after insert on public.itinerary
  for each row execute function public.record_trip_created();

create or replace function public.enforce_share_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  lim integer;
  cnt integer;
  owner_id uuid;
  tier text;
begin
  if new.role = 'owner' then
    return new;
  end if;
  if new.status in ('declined', 'removed', 'left', 'cancelled') then
    return new;
  end if;
  select userid into owner_id from public.itinerary where id = new.itinerary_id;
  if owner_id is null then
    return new;
  end if;
  tier := public.current_tier(owner_id);
  select max_shared_friends into lim from public.plan_limits where plan_limits.tier = tier;
  if lim is null or lim < 0 then
    return new;
  end if;
  select count(*) into cnt
  from public.itinerary_attendees
  where itinerary_id = new.itinerary_id
    and role <> 'owner'
    and status not in ('declined', 'removed', 'left', 'cancelled');
  if cnt >= lim then
    raise exception 'PLAN_LIMIT_SHARING'
      using hint = format('limit=%s tier=%s', lim, tier), errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_share_limit on public.itinerary_attendees;
create trigger enforce_share_limit
  before insert on public.itinerary_attendees
  for each row execute function public.enforce_share_limit();

create or replace function public.consume_ai_credit(uid uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  lim integer;
  used integer;
begin
  if uid is null then
    return 0;
  end if;
  update public.users set last_active_at = now() where userid = uid;
  select monthly_ai_credits into lim from public.plan_limits where tier = public.current_tier(uid);
  if lim is null then
    lim := 5;
  end if;
  if lim < 0 then
    insert into public.usage_tracking (user_id, usage_type, credits_used)
    values (uid, 'ai_turn', 0);
    return -1;
  end if;
  select coalesce(sum(credits_used), 0) into used
  from public.usage_tracking
  where user_id = uid
    and usage_type = 'ai_turn'
    and created_at >= date_trunc('month', now());
  if used >= lim then
    return 0;
  end if;
  insert into public.usage_tracking (user_id, usage_type, credits_used)
  values (uid, 'ai_turn', 1);
  return lim - used - 1;
end;
$$;

revoke all on function public.consume_ai_credit(uuid) from public, anon, authenticated;
grant execute on function public.consume_ai_credit(uuid) to service_role;

create or replace function public.record_usage(uid uuid, kind text, credits integer default 0)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if uid is null or kind is null or kind not in ('search', 'ai_message', 'trip_created') then
    return;
  end if;
  insert into public.usage_tracking (user_id, usage_type, credits_used)
  values (uid, kind, greatest(coalesce(credits, 0), 0));
  update public.users set last_active_at = now() where userid = uid;
end;
$$;

revoke all on function public.record_usage(uuid, text, integer) from public, anon, authenticated;
grant execute on function public.record_usage(uuid, text, integer) to service_role;

create or replace function public.get_my_plan_usage()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  tier text;
  lim public.plan_limits%rowtype;
  trips integer;
  shares integer;
  ai_used integer;
  searches integer;
begin
  if uid is null then
    return jsonb_build_object('error', 'auth_required');
  end if;
  tier := public.current_tier(uid);
  select * into lim from public.plan_limits where plan_limits.tier = tier;
  select count(*) into trips from public.itinerary where userid = uid;
  select count(*) into shares
  from public.itinerary_attendees a
  join public.itinerary i on i.id = a.itinerary_id
  where i.userid = uid
    and a.role <> 'owner'
    and a.status not in ('declined', 'removed', 'left', 'cancelled');
  select coalesce(sum(credits_used), 0) into ai_used
  from public.usage_tracking
  where user_id = uid
    and usage_type = 'ai_turn'
    and created_at >= date_trunc('month', now());
  select count(*) into searches
  from public.usage_tracking
  where user_id = uid
    and usage_type = 'search'
    and created_at >= date_trunc('month', now());
  return jsonb_build_object(
    'tier', tier,
    'max_itineraries', coalesce(lim.max_itineraries, 3),
    'max_shared_friends', coalesce(lim.max_shared_friends, 10),
    'monthly_ai_credits', coalesce(lim.monthly_ai_credits, 5),
    'trips_used', trips,
    'shares_used', shares,
    'ai_credits_used', ai_used,
    'ai_credits_remaining', case
      when coalesce(lim.monthly_ai_credits, 5) < 0 then -1
      else greatest(coalesce(lim.monthly_ai_credits, 5) - ai_used, 0)
    end,
    'searches_this_month', searches
  );
end;
$$;

revoke all on function public.get_my_plan_usage() from public, anon;
grant execute on function public.get_my_plan_usage() to authenticated, service_role;

create or replace function public.touch_last_active()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return;
  end if;
  update public.users
  set last_active_at = now()
  where userid = auth.uid()
    and (last_active_at is null or last_active_at < now() - interval '15 minutes');
end;
$$;

revoke all on function public.touch_last_active() from public, anon;
grant execute on function public.touch_last_active() to authenticated;

update storage.buckets
set file_size_limit = 2097152,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'avatars';

update storage.buckets
set file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
where id = 'chat-attachments';

update storage.buckets
set file_size_limit = 10485760,
    allowed_mime_types = array['application/pdf', 'image/jpeg', 'image/png']
where id = 'receipts';
