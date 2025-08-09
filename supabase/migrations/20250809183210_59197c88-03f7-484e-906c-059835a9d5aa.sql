-- Create users table to store profile data and auto-populate on signup
create table if not exists public.users (
  id bigint generated always as identity primary key,
  userid uuid not null unique,
  email text,
  first_name text,
  last_name text,
  username text,
  comp_name text,
  address text,
  city text,
  state text,
  zip text,
  country text,
  cell text,
  user_type text,
  countries_visited jsonb,
  flight_freq jsonb,
  p_airlines jsonb,
  p_hotels jsonb,
  p_car_rentals jsonb,
  avg_spending numeric,
  taai_rating numeric,
  taai_rating_text text,
  itineraries jsonb,
  terms_accepted_at timestamptz,
  privacy_accepted_at timestamptz,
  terms_version text,
  created_at timestamptz not null default now()
);

-- Ensure RLS is enabled
alter table public.users enable row level security;

-- Unique index on userid for fast lookups (if not already created by unique constraint)
create unique index if not exists users_userid_unique_idx on public.users (userid);

-- Policies: allow users to access only their own row
-- Create SELECT policy if not exists
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'users' and policyname = 'Users can view their own profile'
  ) then
    create policy "Users can view their own profile"
      on public.users
      for select
      using (auth.uid() = userid);
  end if;
end$$;

-- Create UPDATE policy if not exists
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'users' and policyname = 'Users can update their own profile'
  ) then
    create policy "Users can update their own profile"
      on public.users
      for update
      using (auth.uid() = userid);
  end if;
end$$;

-- Create INSERT policy (optional, in case we ever insert from client)
-- This will not be used during signup because we use a trigger, but keeps things consistent
-- Only allow inserting a row for yourself
 do $$
 begin
   if not exists (
     select 1 from pg_policies where schemaname = 'public' and tablename = 'users' and policyname = 'Users can insert their own profile'
   ) then
     create policy "Users can insert their own profile"
       on public.users
       for insert
       with check (auth.uid() = userid);
   end if;
 end$$;

-- Function to handle new auth user and create corresponding public.users row
create or replace function public.handle_new_user_to_users()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.users (
    userid, email, first_name, last_name, username, user_type, comp_name,
    address, city, state, zip, country, cell, terms_version
  ) values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'first_name', null),
    coalesce(new.raw_user_meta_data ->> 'last_name', null),
    coalesce(new.raw_user_meta_data ->> 'username', null),
    coalesce(new.raw_user_meta_data ->> 'user_type', null),
    coalesce(new.raw_user_meta_data ->> 'comp_name', null),
    coalesce(new.raw_user_meta_data ->> 'address', null),
    coalesce(new.raw_user_meta_data ->> 'city', null),
    coalesce(new.raw_user_meta_data ->> 'state', null),
    coalesce(new.raw_user_meta_data ->> 'zip', null),
    coalesce(new.raw_user_meta_data ->> 'country', null),
    coalesce(new.raw_user_meta_data ->> 'cell', null),
    coalesce(new.raw_user_meta_data ->> 'terms_version', null)
  )
  on conflict (userid) do nothing;

  return new;
end;
$$;

-- Trigger to populate users table on signup
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE t.tgname = 'on_auth_user_created_to_users' AND n.nspname = 'auth' AND c.relname = 'users'
  ) THEN
    CREATE TRIGGER on_auth_user_created_to_users
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_to_users();
  END IF;
END$$;
