-- Protect TAAI's master administrator as a durable system invariant.
-- The registry is keyed by the stable auth user ID. Database triggers prevent
-- removal of the protected admin role, deletion of the identity, or changing
-- the registered email address.

create table public.master_admins (
  user_id uuid primary key references auth.users(id) on delete restrict,
  email text not null unique check (email = lower(btrim(email))),
  protected_reason text not null,
  protected_at timestamptz not null default now()
);

alter table public.master_admins enable row level security;

insert into public.user_roles (user_id, role)
select id, 'admin'::public.app_role
from auth.users
where lower(email) = 'info@taai.travel'
on conflict (user_id, role) do nothing;

insert into public.master_admins (user_id, email, protected_reason)
select id, 'info@taai.travel', 'TAAI primary owner and protected master administrator'
from auth.users
where lower(email) = 'info@taai.travel'
on conflict (user_id) do update
set email = excluded.email,
    protected_reason = excluded.protected_reason;

do $$
begin
  if not exists (
    select 1
    from public.master_admins master
    join public.user_roles role
      on role.user_id = master.user_id
     and role.role = 'admin'::public.app_role
    where master.email = 'info@taai.travel'
  ) then
    raise exception 'Protected master administrator info@taai.travel was not found';
  end if;
end;
$$;

create or replace function public.guard_master_admin_registry()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op in ('UPDATE', 'DELETE') then
    raise exception 'Master administrator registrations are immutable';
  end if;

  if not exists (
    select 1
    from public.user_roles role
    where role.user_id = new.user_id
      and role.role = 'admin'::public.app_role
  ) then
    raise exception 'A master administrator must already hold the admin role';
  end if;

  return new;
end;
$$;

create trigger guard_master_admin_registry_before_write
before insert or update or delete on public.master_admins
for each row execute function public.guard_master_admin_registry();

create or replace function public.protect_master_admin_role()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if old.role = 'admin'::public.app_role
    and exists (
      select 1 from public.master_admins master where master.user_id = old.user_id
    ) then
    raise exception 'Protected master administrator role cannot be removed or changed';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger protect_master_admin_role_before_write
before update or delete on public.user_roles
for each row execute function public.protect_master_admin_role();

create or replace function public.protect_master_admin_auth_identity()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  registered_email text;
begin
  select master.email
  into registered_email
  from public.master_admins master
  where master.user_id = old.id;

  if registered_email is null then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;

  if tg_op = 'DELETE' then
    raise exception 'Protected master administrator identity cannot be deleted';
  end if;

  if lower(coalesce(new.email, '')) <> registered_email then
    raise exception 'Protected master administrator email cannot be changed';
  end if;

  return new;
end;
$$;

create trigger protect_master_admin_auth_identity_before_write
before update of email or delete on auth.users
for each row execute function public.protect_master_admin_auth_identity();

create policy "Admins can read protected master administrators"
on public.master_admins
for select
to authenticated
using (public.has_role(auth.uid(), 'admin'::public.app_role));

revoke all on table public.master_admins from public, anon;
grant select on table public.master_admins to authenticated;
grant select on table public.master_admins to service_role;

revoke all on function public.guard_master_admin_registry() from public, anon, authenticated;
revoke all on function public.protect_master_admin_role() from public, anon, authenticated;
revoke all on function public.protect_master_admin_auth_identity() from public, anon, authenticated;

comment on table public.master_admins is
  'Immutable registry of TAAI master administrators whose admin role and auth identity are protected.';
