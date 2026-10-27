-- Upload quotas and storage access.
--
-- The migration role is not the owner of storage.objects. This file does
-- not add a trigger, an index, or any other alteration on that table.
--
-- Statements that touch the storage schema:
--   1. SELECT storage.objects inside private.claim_storage_folder_slot
--      (count and replacement check). A privilege error falls back to the
--      reservation table in private.
--   2. CREATE/DROP POLICY on storage.objects, inside a block that continues
--      when the role is not the owner (SQLSTATE 42501).
--   3. UPDATE storage.buckets (file size and mime limits), inside the same
--      kind of block. That is storage.buckets, not storage.objects.
--
-- The cap itself is private.claim_storage_folder_slot, called by
-- public.reserve_storage_upload before an upload. The lock is held for that
-- transaction, and a reservation in private.storage_upload_reservations holds
-- the slot until the object exists or the client releases it. Replacing an
-- object with the same name does not take a new slot.
--
-- Ceilings match the client and the receipt function:
--   avatars            1 file,  2 MB
--   chat-attachments  20 files, 5 MB
--   receipts          10 files, 10 MB
--
-- Write policies, when they can be created, are limited to authenticated
-- members or the service role. There is no write policy for anonymous sessions.

create schema if not exists private;

revoke all on schema private from public;
revoke all on schema private from anon, authenticated;

create table if not exists private.storage_upload_reservations (
  bucket_id text not null,
  object_name text not null,
  folder text not null,
  reserved_by uuid,
  reserved_at timestamptz not null default now(),
  primary key (bucket_id, object_name)
);

create index if not exists storage_upload_reservations_folder_idx
  on private.storage_upload_reservations (bucket_id, folder);

revoke all on table private.storage_upload_reservations from public;
revoke all on table private.storage_upload_reservations from anon, authenticated;

create or replace function private.claim_storage_folder_slot(
  p_bucket text,
  p_object_name text
) returns boolean
language plpgsql
security definer
set search_path = pg_catalog, storage, public, private
as $$
declare
  folder text;
  max_count integer;
  current_count integer;
  actor uuid;
  actor_role text;
  can_read_objects boolean := true;
begin
  actor := auth.uid();
  actor_role := coalesce(auth.role(), '');

  max_count := case p_bucket
    when 'avatars' then 1
    when 'chat-attachments' then 20
    when 'receipts' then 10
    else null
  end;

  if max_count is null or p_object_name is null or btrim(p_object_name) = '' then
    raise exception 'STORAGE_PATH_REQUIRED' using errcode = '42501';
  end if;

  folder := (storage.foldername(p_object_name))[1];
  if folder is null or folder = '' or position('/' in p_object_name) = 0 then
    raise exception 'STORAGE_PATH_REQUIRED' using errcode = '42501';
  end if;

  if actor_role = 'service_role' then
    null;
  elsif p_bucket = 'avatars' then
    if actor is null or folder <> actor::text then
      raise exception 'STORAGE_FORBIDDEN' using errcode = '42501';
    end if;
  elsif p_bucket = 'chat-attachments' then
    if actor is null
      or not public.is_itinerary_attendee(folder::bigint, actor)
      or not public.is_chat_participant(folder::bigint, actor) then
      raise exception 'STORAGE_FORBIDDEN' using errcode = '42501';
    end if;
  else
    raise exception 'STORAGE_FORBIDDEN' using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(hashtext(p_bucket), hashtext(folder));

  delete from private.storage_upload_reservations
  where bucket_id = p_bucket
    and folder = folder
    and reserved_at < now() - interval '10 minutes';

  begin
    if exists (
      select 1
      from storage.objects
      where bucket_id = p_bucket
        and name = p_object_name
    ) then
      return true;
    end if;
  exception
    when insufficient_privilege then
      can_read_objects := false;
  end;

  if exists (
    select 1
    from private.storage_upload_reservations
    where bucket_id = p_bucket
      and object_name = p_object_name
  ) then
    update private.storage_upload_reservations
      set reserved_at = now(),
          reserved_by = actor
    where bucket_id = p_bucket
      and object_name = p_object_name;
    return true;
  end if;

  if can_read_objects then
    begin
      select count(*)::integer
        into current_count
      from (
        select name as object_name
        from storage.objects
        where bucket_id = p_bucket
          and (storage.foldername(name))[1] = folder
        union
        select object_name
        from private.storage_upload_reservations
        where bucket_id = p_bucket
          and folder = folder
      ) slots;
    exception
      when insufficient_privilege then
        can_read_objects := false;
    end;
  end if;

  if not can_read_objects then
    select count(*)::integer
      into current_count
    from private.storage_upload_reservations
    where bucket_id = p_bucket
      and folder = folder;
  end if;

  if current_count >= max_count then
    raise exception '%', case p_bucket
      when 'avatars' then 'AVATAR_LIMIT'
      when 'chat-attachments' then 'CHAT_ATTACHMENT_LIMIT'
      else 'DOCUMENT_LIMIT'
    end
      using errcode = 'P0001';
  end if;

  insert into private.storage_upload_reservations (
    bucket_id, object_name, folder, reserved_by
  ) values (
    p_bucket, p_object_name, folder, actor
  );

  return true;
end;
$$;

create or replace function public.reserve_storage_upload(
  p_bucket text,
  p_object_name text
) returns void
language plpgsql
security definer
set search_path = pg_catalog, storage, public, private
as $$
begin
  perform private.claim_storage_folder_slot(p_bucket, p_object_name);
end;
$$;

create or replace function public.release_storage_upload(
  p_bucket text,
  p_object_name text
) returns void
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  actor uuid := auth.uid();
  actor_role text := coalesce(auth.role(), '');
begin
  if actor_role <> 'service_role' and actor is null then
    raise exception 'STORAGE_FORBIDDEN' using errcode = '42501';
  end if;

  delete from private.storage_upload_reservations
  where bucket_id = p_bucket
    and object_name = p_object_name
    and (
      actor_role = 'service_role'
      or reserved_by = actor
    );
end;
$$;

revoke all on function private.claim_storage_folder_slot(text, text) from public;
revoke all on function public.reserve_storage_upload(text, text) from public;
revoke all on function public.release_storage_upload(text, text) from public;

grant usage on schema private to authenticated, service_role;
grant execute on function private.claim_storage_folder_slot(text, text) to authenticated, service_role;
grant execute on function public.reserve_storage_upload(text, text) to authenticated, service_role;
grant execute on function public.release_storage_upload(text, text) to authenticated, service_role;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'supabase_storage_admin') then
    grant usage on schema private to supabase_storage_admin;
    grant execute on function private.claim_storage_folder_slot(text, text) to supabase_storage_admin;
  end if;
end $$;

-- Policies are best-effort. Creating one requires ownership of storage.objects,
-- which the migration role does not have on the hosted project. A failure here
-- does not undo the reservation function above.
do $storage_policies$
begin
  drop policy if exists "Users can upload their own avatar" on storage.objects;
  drop policy if exists "Users can update their own avatar" on storage.objects;
  drop policy if exists "Users can delete their own avatar" on storage.objects;
  drop policy if exists "Users can read their own avatar" on storage.objects;

  create policy "Users can upload their own avatar"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
    and private.claim_storage_folder_slot(bucket_id, name)
  );

  create policy "Users can update their own avatar"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

  create policy "Users can delete their own avatar"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

  create policy "Users can read their own avatar"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

  drop policy if exists "Service writes receipt files" on storage.objects;
  drop policy if exists "Service updates receipt files" on storage.objects;

  create policy "Service writes receipt files"
  on storage.objects for insert
  to service_role
  with check (
    bucket_id = 'receipts'
    and private.claim_storage_folder_slot(bucket_id, name)
  );

  create policy "Service updates receipt files"
  on storage.objects for update
  to service_role
  using (bucket_id = 'receipts')
  with check (bucket_id = 'receipts');

  drop policy if exists "Chat participants can view chat attachments" on storage.objects;
  create policy "Chat participants can view chat attachments"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'chat-attachments'
    and public.is_chat_participant(
      nullif((storage.foldername(name))[1], '')::bigint,
      (select auth.uid())
    )
    and public.is_itinerary_attendee(
      nullif((storage.foldername(name))[1], '')::bigint,
      (select auth.uid())
    )
  );

  drop policy if exists "Chat participants can upload chat attachments" on storage.objects;
  create policy "Chat participants can upload chat attachments"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'chat-attachments'
    and public.is_chat_participant(
      nullif((storage.foldername(name))[1], '')::bigint,
      (select auth.uid())
    )
    and public.is_itinerary_attendee(
      nullif((storage.foldername(name))[1], '')::bigint,
      (select auth.uid())
    )
    and private.claim_storage_folder_slot(bucket_id, name)
  );

  drop policy if exists "Chat participants can update their chat attachments" on storage.objects;
  create policy "Chat participants can update their chat attachments"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'chat-attachments'
    and owner = (select auth.uid())
    and public.is_chat_participant(
      nullif((storage.foldername(name))[1], '')::bigint,
      (select auth.uid())
    )
    and public.is_itinerary_attendee(
      nullif((storage.foldername(name))[1], '')::bigint,
      (select auth.uid())
    )
  )
  with check (
    bucket_id = 'chat-attachments'
    and owner = (select auth.uid())
    and public.is_chat_participant(
      nullif((storage.foldername(name))[1], '')::bigint,
      (select auth.uid())
    )
    and public.is_itinerary_attendee(
      nullif((storage.foldername(name))[1], '')::bigint,
      (select auth.uid())
    )
  );

  drop policy if exists "Chat participants can delete their chat attachments" on storage.objects;
  create policy "Chat participants can delete their chat attachments"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'chat-attachments'
    and owner = (select auth.uid())
    and public.is_itinerary_attendee(
      nullif((storage.foldername(name))[1], '')::bigint,
      (select auth.uid())
    )
  );
exception
  when insufficient_privilege then
    raise warning 'storage.objects policies skipped: %', sqlerrm;
end
$storage_policies$;

do $storage_buckets$
begin
  update storage.buckets
  set file_size_limit = 2097152,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
  where id = 'avatars';

  update storage.buckets
  set file_size_limit = 5242880,
      allowed_mime_types = array[
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
        'image/heic',
        'image/heif',
        'image/heic-sequence',
        'image/heif-sequence',
        'application/pdf'
      ]
  where id = 'chat-attachments';

  update storage.buckets
  set file_size_limit = 10485760,
      allowed_mime_types = array['application/pdf', 'image/jpeg', 'image/png']
  where id = 'receipts';
exception
  when insufficient_privilege then
    raise warning 'storage.buckets limits skipped: %', sqlerrm;
end
$storage_buckets$;
