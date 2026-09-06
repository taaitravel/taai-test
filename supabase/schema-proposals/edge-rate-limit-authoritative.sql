-- =====================================================================
-- UNAPPLIED PROPOSAL — DO NOT RUN AS PART OF ANY DEPLOYMENT
--
-- Purpose: replace the best-effort, process-local Edge Function rate limiter
-- (in-memory per isolate, see supabase/functions/_shared/edge-guard.ts) with
-- an atomic, authoritative per-user limiter shared by every isolate.
--
-- Current limitation being fixed: each isolate keeps its own counters, so the
-- effective ceiling is 30 requests/minute *per isolate*, and a cold start
-- resets a caller's window. It damps abuse; it does not guarantee a global
-- per-user rate.
--
-- Review gate: requires explicit human approval before becoming a migration.
-- =====================================================================

begin;

create table if not exists public.edge_rate_limits (
  scope        text        not null,          -- e.g. 'expedia', 'booking', 'chat'
  user_id      uuid        not null references auth.users (id) on delete cascade,
  window_start timestamptz not null,
  request_count integer    not null default 0,
  primary key (scope, user_id, window_start)
);

-- No Data API access: only the security-definer function below touches it.
revoke all on public.edge_rate_limits from anon, authenticated;
grant all on public.edge_rate_limits to service_role;

alter table public.edge_rate_limits enable row level security;

drop policy if exists "No direct client access" on public.edge_rate_limits;
create policy "No direct client access"
on public.edge_rate_limits
for all
to authenticated
using (false)
with check (false);

-- Atomic consume: one statement, one row lock, no read-modify-write race.
create or replace function public.consume_rate_limit(
  _scope text,
  _user_id uuid,
  _max_requests integer default 30,
  _window_seconds integer default 60
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  _window timestamptz := to_timestamp(floor(extract(epoch from now()) / _window_seconds) * _window_seconds);
  _count integer;
begin
  insert into public.edge_rate_limits (scope, user_id, window_start, request_count)
  values (_scope, _user_id, _window, 1)
  on conflict (scope, user_id, window_start)
  do update set request_count = public.edge_rate_limits.request_count + 1
  returning request_count into _count;

  return _count <= _max_requests;
end;
$$;

revoke all on function public.consume_rate_limit(text, uuid, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, uuid, integer, integer) to service_role;

-- Retention: windows older than one day are useless.
create index if not exists edge_rate_limits_window_idx on public.edge_rate_limits (window_start);

commit;

-- Edge-side change enabled by this proposal (also unapplied):
--   const { data: allowed } = await serviceClient.rpc('consume_rate_limit', {
--     _scope: 'expedia', _user_id: verifiedUserId,
--   });
--   if (!allowed) return json({ error: 'Too many requests' }, 429);
-- The in-memory limiter would remain as a cheap first line of defence.

-- ROLLBACK ---------------------------------------------------------------
-- drop function if exists public.consume_rate_limit(text, uuid, integer, integer);
-- drop table if exists public.edge_rate_limits;
