-- TAAI agent operations foundation.
-- Direction: Hermes routes; specialists work inside task scope; humans approve
-- consequential actions; evidence is durable and immutable.

create table public.agent_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 3 and 160),
  objective text not null check (char_length(btrim(objective)) between 3 and 5000),
  assigned_agent text not null check (assigned_agent in (
    'ajax', 'tom', 'scott', 'manny', 'benny', 'piper', 'lester', 'scout'
  )),
  routed_by text not null default 'hermes' check (routed_by = 'hermes'),
  status text not null default 'draft' check (status in (
    'draft', 'awaiting_approval', 'queued', 'in_progress', 'blocked',
    'completed', 'failed', 'cancelled'
  )),
  action_class text not null default 'analyze' check (action_class in (
    'read', 'analyze', 'propose', 'draft', 'test', 'modify_code',
    'modify_data', 'deploy', 'send_external', 'financial_action', 'provider_action'
  )),
  risk_level text not null default 'low' check (risk_level in (
    'low', 'medium', 'high', 'consequential'
  )),
  approval_required boolean not null default false,
  success_criteria text,
  next_action text,
  source_context jsonb not null default '{}'::jsonb check (jsonb_typeof(source_context) = 'object'),
  created_by uuid not null references auth.users(id),
  updated_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz
);

create index agent_tasks_assignee_status_idx
  on public.agent_tasks (assigned_agent, status, created_at desc);
create index agent_tasks_created_by_idx
  on public.agent_tasks (created_by, created_at desc);

create table public.agent_task_approvals (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.agent_tasks(id) on delete restrict,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'revoked', 'expired')),
  action_class text not null,
  requested_scope jsonb not null default '{}'::jsonb check (jsonb_typeof(requested_scope) = 'object'),
  requested_by uuid not null references auth.users(id),
  requested_at timestamptz not null default now(),
  decided_by uuid references auth.users(id),
  decided_at timestamptz,
  decision_reason text,
  expires_at timestamptz,
  check (
    (status = 'pending' and decided_by is null and decided_at is null)
    or (status <> 'pending' and decided_by is not null and decided_at is not null)
  )
);

create unique index agent_task_one_pending_approval_idx
  on public.agent_task_approvals (task_id)
  where status = 'pending';
create index agent_task_approvals_task_idx
  on public.agent_task_approvals (task_id, requested_at desc);

create table public.agent_task_evidence (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.agent_tasks(id) on delete restrict,
  evidence_type text not null check (evidence_type in (
    'analysis', 'code', 'test', 'query', 'deployment', 'approval', 'report',
    'artifact', 'screenshot', 'provider', 'financial', 'other'
  )),
  label text not null check (char_length(btrim(label)) between 3 and 200),
  summary text not null check (char_length(btrim(summary)) between 3 and 5000),
  reference_url text,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  recorded_by uuid not null references auth.users(id),
  recorded_at timestamptz not null default now()
);

create index agent_task_evidence_task_idx
  on public.agent_task_evidence (task_id, recorded_at desc);

create table public.agent_task_events (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.agent_tasks(id) on delete restrict,
  event_type text not null check (event_type in (
    'created', 'routed', 'status_changed', 'approval_requested',
    'approval_decided', 'evidence_added'
  )),
  actor_kind text not null check (actor_kind in ('human', 'agent', 'system')),
  actor_user_id uuid references auth.users(id),
  actor_key text,
  summary text not null,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now()
);

create index agent_task_events_task_idx
  on public.agent_task_events (task_id, created_at asc);

comment on table public.agent_tasks is
  'Hermes-routed internal work. A task is scope and workflow state, never authorization by itself.';
comment on table public.agent_task_approvals is
  'Human, durable, action-scoped decisions required before consequential task execution.';
comment on table public.agent_task_evidence is
  'Immutable evidence supporting analysis, tests, execution, and task completion.';
comment on table public.agent_task_events is
  'Immutable execution journal for routing, status, approvals, and evidence.';

create or replace function public.is_agent_state_changing_action(p_action_class text)
returns boolean
language sql
immutable
set search_path = public, pg_temp
as $$
  select p_action_class in (
    'modify_code', 'modify_data', 'deploy', 'send_external',
    'financial_action', 'provider_action'
  );
$$;

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
      from public.agent_task_approvals a
      where a.task_id = old.id
        and a.status = 'approved'
        and (a.expires_at is null or a.expires_at > now())
    ) into v_has_approval;

    if not v_has_approval then
      raise exception 'Security / Control approval required before consequential execution';
    end if;
  end if;

  if new.status = 'completed' and old.status <> 'completed' then
    select exists (
      select 1 from public.agent_task_evidence e where e.task_id = old.id
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

create trigger guard_agent_task_before_write
before insert or update on public.agent_tasks
for each row execute function public.guard_agent_task();

create or replace function public.create_agent_task_journal()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.agent_task_events (
      task_id, event_type, actor_kind, actor_user_id, summary, metadata
    ) values (
      new.id, 'created', 'human', new.created_by, 'Task created',
      jsonb_build_object('status', new.status, 'action_class', new.action_class)
    );

    insert into public.agent_task_events (
      task_id, event_type, actor_kind, actor_key, summary, metadata
    ) values (
      new.id, 'routed', 'agent', 'hermes',
      'Hermes routed task to ' || new.assigned_agent,
      jsonb_build_object('assigned_agent', new.assigned_agent)
    );

    if new.approval_required then
      insert into public.agent_task_approvals (
        task_id, action_class, requested_scope, requested_by
      ) values (
        new.id,
        new.action_class,
        jsonb_build_object(
          'title', new.title,
          'objective', new.objective,
          'assigned_agent', new.assigned_agent,
          'source_context', new.source_context
        ),
        new.created_by
      );

      insert into public.agent_task_events (
        task_id, event_type, actor_kind, actor_key, summary, metadata
      ) values (
        new.id, 'approval_requested', 'system', 'security-control',
        'Security / Control approval requested',
        jsonb_build_object('action_class', new.action_class)
      );
    end if;

    return new;
  end if;

  if new.status is distinct from old.status then
    insert into public.agent_task_events (
      task_id, event_type, actor_kind, actor_user_id, summary, metadata
    ) values (
      new.id, 'status_changed', 'human', new.updated_by,
      'Task status changed from ' || old.status || ' to ' || new.status,
      jsonb_build_object('old_status', old.status, 'new_status', new.status)
    );
  end if;

  return new;
end;
$$;

create trigger journal_agent_task_after_write
after insert or update on public.agent_tasks
for each row execute function public.create_agent_task_journal();

create or replace function public.guard_agent_task_approval()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
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

create trigger guard_agent_task_approval_before_update
before update on public.agent_task_approvals
for each row execute function public.guard_agent_task_approval();

create or replace function public.journal_agent_task_approval()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.status is distinct from old.status then
    insert into public.agent_task_events (
      task_id, event_type, actor_kind, actor_user_id, summary, metadata
    ) values (
      new.task_id, 'approval_decided', 'human', new.decided_by,
      'Security / Control approval ' || new.status,
      jsonb_build_object('approval_id', new.id, 'status', new.status, 'reason', new.decision_reason)
    );
  end if;
  return new;
end;
$$;

create trigger journal_agent_task_approval_after_update
after update on public.agent_task_approvals
for each row execute function public.journal_agent_task_approval();

create or replace function public.guard_agent_task_evidence()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
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

create trigger guard_agent_task_evidence_before_write
before insert or update or delete on public.agent_task_evidence
for each row execute function public.guard_agent_task_evidence();

create or replace function public.journal_agent_task_evidence()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.agent_task_events (
    task_id, event_type, actor_kind, actor_user_id, summary, metadata
  ) values (
    new.task_id, 'evidence_added', 'human', new.recorded_by,
    'Evidence added: ' || new.label,
    jsonb_build_object('evidence_id', new.id, 'evidence_type', new.evidence_type)
  );
  return new;
end;
$$;

create trigger journal_agent_task_evidence_after_insert
after insert on public.agent_task_evidence
for each row execute function public.journal_agent_task_evidence();

create or replace function public.block_agent_task_event_mutation()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  raise exception 'Agent task events are immutable';
end;
$$;

create trigger block_agent_task_event_mutation_before_write
before update or delete on public.agent_task_events
for each row execute function public.block_agent_task_event_mutation();

alter table public.agent_tasks enable row level security;
alter table public.agent_task_approvals enable row level security;
alter table public.agent_task_evidence enable row level security;
alter table public.agent_task_events enable row level security;

create policy "Admins can read agent tasks"
on public.agent_tasks for select to authenticated
using (public.has_role(auth.uid(), 'admin'::public.app_role));

create policy "Admins can create agent tasks"
on public.agent_tasks for insert to authenticated
with check (public.has_role(auth.uid(), 'admin'::public.app_role));

create policy "Admins can update agent tasks"
on public.agent_tasks for update to authenticated
using (public.has_role(auth.uid(), 'admin'::public.app_role))
with check (public.has_role(auth.uid(), 'admin'::public.app_role));

create policy "Admins can read task approvals"
on public.agent_task_approvals for select to authenticated
using (public.has_role(auth.uid(), 'admin'::public.app_role));

create policy "Admins can decide task approvals"
on public.agent_task_approvals for update to authenticated
using (public.has_role(auth.uid(), 'admin'::public.app_role))
with check (public.has_role(auth.uid(), 'admin'::public.app_role));

create policy "Admins can read task evidence"
on public.agent_task_evidence for select to authenticated
using (public.has_role(auth.uid(), 'admin'::public.app_role));

create policy "Admins can add task evidence"
on public.agent_task_evidence for insert to authenticated
with check (public.has_role(auth.uid(), 'admin'::public.app_role));

create policy "Admins can read task events"
on public.agent_task_events for select to authenticated
using (public.has_role(auth.uid(), 'admin'::public.app_role));

revoke delete on public.agent_tasks from authenticated;
revoke insert, delete on public.agent_task_approvals from authenticated;
revoke update, delete on public.agent_task_evidence from authenticated;
revoke insert, update, delete on public.agent_task_events from authenticated;

revoke all on function public.is_agent_state_changing_action(text) from public, anon;
revoke all on function public.guard_agent_task() from public, anon, authenticated;
revoke all on function public.create_agent_task_journal() from public, anon, authenticated;
revoke all on function public.guard_agent_task_approval() from public, anon, authenticated;
revoke all on function public.journal_agent_task_approval() from public, anon, authenticated;
revoke all on function public.guard_agent_task_evidence() from public, anon, authenticated;
revoke all on function public.journal_agent_task_evidence() from public, anon, authenticated;
revoke all on function public.block_agent_task_event_mutation() from public, anon, authenticated;
