-- Throwaway stand-ins so the upload migration can be executed outside hosted Supabase.
-- Not a migration. The live project already has auth, storage, and these roles.

create role anon nologin;
create role authenticated nologin;
create role service_role nologin;

create schema if not exists auth;

create or replace function auth.uid() returns uuid
language sql stable
as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

create or replace function auth.role() returns text
language sql stable
as $$
  select coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), '');
$$;

create schema if not exists storage;

create table storage.objects (
  id bigserial primary key,
  bucket_id text,
  name text,
  owner uuid
);

create table storage.buckets (
  id text primary key,
  file_size_limit bigint,
  allowed_mime_types text[]
);

insert into storage.buckets (id) values ('avatars'), ('chat-attachments'), ('receipts');

create or replace function storage.foldername(p_name text) returns text[]
language sql immutable
as $$
  select case
    when p_name is null or position('/' in p_name) = 0 then '{}'::text[]
    else (string_to_array(p_name, '/'))[1:array_length(string_to_array(p_name, '/'), 1) - 1]
  end;
$$;

create or replace function public.is_itinerary_attendee(p_itinerary_id bigint, p_user_id uuid)
returns boolean
language sql stable
as $$ select true $$;

create or replace function public.is_chat_participant(p_itinerary_id bigint, p_user_id uuid)
returns boolean
language sql stable
as $$ select true $$;
