-- Upload quotas and storage access.
--
-- Chat used to count files with storage.list() in the browser. Two members
-- could both pass that check and both upload. The trigger below locks the
-- folder, counts objects, and rejects the insert that would pass the ceiling.
-- Replacing an object with the same name does not take a new slot.
--
-- Ceilings match the client and the receipt function:
--   avatars            1 file,  2 MB
--   chat-attachments  20 files, 5 MB
--   receipts          10 files, 10 MB
--
-- Write policies are limited to authenticated members or the service role.
-- There is no write policy for the anonymous role.

create schema if not exists private;

revoke all on schema private from public;
revoke all on schema private from anon, authenticated;

create or replace function private.enforce_storage_folder_quota()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, storage, public
as $$
declare
  folder text;
  max_count integer;
  current_count integer;
begin
  if tg_op <> 'INSERT' then
    return new;
  end if;

  max_count := case new.bucket_id
    when 'avatars' then 1
    when 'chat-attachments' then 20
    when 'receipts' then 10
    else null
  end;

  if max_count is null then
    return new;
  end if;

  folder := (storage.foldername(new.name))[1];
  if folder is null or folder = '' then
    raise exception 'STORAGE_PATH_REQUIRED' using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(hashtext(new.bucket_id), hashtext(folder));

  -- Same path is a replacement (avatar.jpg, an upserted receipt), not a new file.
  -- Checked after the lock so a concurrent insert of this name is visible.
  if exists (
    select 1
    from storage.objects
    where bucket_id = new.bucket_id
      and name = new.name
  ) then
    return new;
  end if;

  select count(*)::integer
    into current_count
  from storage.objects
  where bucket_id = new.bucket_id
    and (storage.foldername(name))[1] = folder;

  if current_count >= max_count then
    raise exception '%', case new.bucket_id
      when 'avatars' then 'AVATAR_LIMIT'
      when 'chat-attachments' then 'CHAT_ATTACHMENT_LIMIT'
      else 'DOCUMENT_LIMIT'
    end
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

revoke all on function private.enforce_storage_folder_quota() from public;
revoke all on function private.enforce_storage_folder_quota() from anon, authenticated;
grant usage on schema private to authenticated, service_role;
grant execute on function private.enforce_storage_folder_quota() to authenticated, service_role;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'supabase_storage_admin') then
    grant usage on schema private to supabase_storage_admin;
    grant execute on function private.enforce_storage_folder_quota() to supabase_storage_admin;
  end if;
end $$;

create index if not exists storage_objects_bucket_folder_idx
  on storage.objects (bucket_id, ((storage.foldername(name))[1]));

drop trigger if exists enforce_storage_folder_quota on storage.objects;
create trigger enforce_storage_folder_quota
  before insert on storage.objects
  for each row
  execute function private.enforce_storage_folder_quota();

-- Avatar writes used to omit a role, which means the public role (including
-- anonymous sessions). Restrict them to signed-in users. Upsert also needs
-- the owner to be able to read the existing object.
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

-- Receipt writes were granted to the public role and then filtered with
-- auth.role(). Target the service role directly so anonymous sessions are
-- not covered by a write policy.
drop policy if exists "Service writes receipt files" on storage.objects;
drop policy if exists "Service updates receipt files" on storage.objects;

create policy "Service writes receipt files"
on storage.objects for insert
to service_role
with check (bucket_id = 'receipts');

create policy "Service updates receipt files"
on storage.objects for update
to service_role
using (bucket_id = 'receipts')
with check (bucket_id = 'receipts');

-- Signing a chat attachment requires select. Require a current accepted
-- attendee, not only a leftover chat-participant row, so someone removed
-- from the trip cannot mint a new URL.
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
