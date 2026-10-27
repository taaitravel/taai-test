-- Meter every AI planning turn and store the tokens that turn used.
-- Do not apply this file from the coding agent. The founder applies it
-- in the Supabase SQL editor or with `supabase db push` after review.
--
-- This does not change Stripe prices, products, or travel booking checkout.
-- Apply it before or with the chat-with-gpt deploy. Until consume_ai_credit
-- succeeds, Miles and Bob fail closed instead of answering for free.

-- The original usage_tracking check only allowed api_call, ai_chat, and
-- itinerary_creation. ai_turn inserts fail while that check is still present.
alter table public.usage_tracking drop constraint if exists usage_tracking_usage_type_check;

do $$
declare
  constraint_name text;
begin
  for constraint_name in
    select c.conname
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'usage_tracking'
      and c.contype = 'c'
      and pg_get_constraintdef(c.oid) ilike '%usage_type%'
      and pg_get_constraintdef(c.oid) ilike '%ai_chat%'
  loop
    execute format('alter table public.usage_tracking drop constraint %I', constraint_name);
  end loop;
end $$;

alter table public.usage_tracking
  add column if not exists prompt_tokens integer,
  add column if not exists completion_tokens integer,
  add column if not exists total_tokens integer,
  add column if not exists model text;

alter table public.usage_tracking
  drop constraint if exists usage_tracking_prompt_tokens_nonnegative,
  drop constraint if exists usage_tracking_completion_tokens_nonnegative,
  drop constraint if exists usage_tracking_total_tokens_nonnegative;

alter table public.usage_tracking
  add constraint usage_tracking_prompt_tokens_nonnegative check (prompt_tokens is null or prompt_tokens >= 0),
  add constraint usage_tracking_completion_tokens_nonnegative check (completion_tokens is null or completion_tokens >= 0),
  add constraint usage_tracking_total_tokens_nonnegative check (total_tokens is null or total_tokens >= 0);

-- Return type changes from integer to jsonb, so replace cannot be used.
drop function if exists public.consume_ai_credit(uuid);

create or replace function public.consume_ai_credit(uid uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  lim integer;
  used integer;
  new_id uuid;
begin
  if uid is null then
    return jsonb_build_object('ok', false, 'remaining', 0, 'credits_charged', 0);
  end if;

  -- Serialize a user's turns so two overlapping requests cannot both pass.
  perform pg_advisory_xact_lock(hashtext('consume_ai_credit:' || uid::text));

  update public.users set last_active_at = now() where userid = uid;

  select monthly_ai_credits into lim from public.plan_limits where tier = public.current_tier(uid);
  if lim is null then
    lim := 5;
  end if;

  if lim < 0 then
    insert into public.usage_tracking (user_id, usage_type, credits_used)
    values (uid, 'ai_turn', 0)
    returning id into new_id;
    return jsonb_build_object(
      'ok', true,
      'remaining', -1,
      'usage_id', new_id,
      'credits_charged', 0
    );
  end if;

  select coalesce(sum(credits_used), 0) into used
  from public.usage_tracking
  where user_id = uid
    and usage_type = 'ai_turn'
    and created_at >= date_trunc('month', now());

  -- Block when the balance is already at or below zero. The turn that spends
  -- the last included credit is still allowed and returns remaining 0.
  if used >= lim then
    return jsonb_build_object('ok', false, 'remaining', 0, 'credits_charged', 0);
  end if;

  insert into public.usage_tracking (user_id, usage_type, credits_used)
  values (uid, 'ai_turn', 1)
  returning id into new_id;

  return jsonb_build_object(
    'ok', true,
    'remaining', lim - used - 1,
    'usage_id', new_id,
    'credits_charged', 1
  );
end;
$$;

revoke all on function public.consume_ai_credit(uuid) from public, anon, authenticated;
grant execute on function public.consume_ai_credit(uuid) to service_role;

create or replace function public.record_ai_turn_tokens(
  uid uuid,
  usage_id uuid,
  p_prompt_tokens integer,
  p_completion_tokens integer,
  p_total_tokens integer,
  p_model text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if uid is null or usage_id is null then
    return;
  end if;
  update public.usage_tracking u
  set
    prompt_tokens = case
      when p_prompt_tokens is null or p_prompt_tokens < 0 then u.prompt_tokens
      else p_prompt_tokens
    end,
    completion_tokens = case
      when p_completion_tokens is null or p_completion_tokens < 0 then u.completion_tokens
      else p_completion_tokens
    end,
    total_tokens = case
      when p_total_tokens is null or p_total_tokens < 0 then u.total_tokens
      else p_total_tokens
    end,
    model = case
      when p_model is null or btrim(p_model) = '' then u.model
      else left(btrim(p_model), 120)
    end
  where u.id = usage_id
    and u.user_id = uid
    and u.usage_type = 'ai_turn';
end;
$$;

revoke all on function public.record_ai_turn_tokens(uuid, uuid, integer, integer, integer, text) from public, anon, authenticated;
grant execute on function public.record_ai_turn_tokens(uuid, uuid, integer, integer, integer, text) to service_role;

-- Give the credit back only when the model produced no completion. Token
-- columns stay null in that case, and the row has to be from this turn.
create or replace function public.release_ai_credit(uid uuid, usage_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if uid is null or usage_id is null then
    return;
  end if;
  delete from public.usage_tracking
  where id = usage_id
    and user_id = uid
    and usage_type = 'ai_turn'
    and prompt_tokens is null
    and completion_tokens is null
    and total_tokens is null
    and created_at >= now() - interval '15 minutes';
end;
$$;

revoke all on function public.release_ai_credit(uuid, uuid) from public, anon, authenticated;
grant execute on function public.release_ai_credit(uuid, uuid) to service_role;
