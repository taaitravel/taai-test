-- Executes private.claim_storage_folder_slot through the public RPCs.
-- A folder = folder collision fails the first reserve, or lets one folder consume every slot.

create or replace function pg_temp.expect_error(p_sql text, p_message text) returns void
language plpgsql
as $$
begin
  execute p_sql;
  raise exception 'expected %', p_message;
exception
  when others then
    if sqlerrm is distinct from p_message then
      raise exception 'expected %, got %', p_message, sqlerrm;
    end if;
end;
$$;

create or replace function pg_temp.expect_folder_count(
  p_bucket text,
  p_folder text,
  p_expected integer
) returns void
language plpgsql
as $$
declare
  v_count integer;
begin
  select count(*)::integer
    into v_count
  from private.storage_upload_reservations as r
  where r.bucket_id = p_bucket
    and r.folder = p_folder;
  if v_count is distinct from p_expected then
    raise exception '%/% has % reservations, expected %', p_bucket, p_folder, v_count, p_expected;
  end if;
end;
$$;

select set_config('request.jwt.claim.role', 'service_role', false);
select set_config('request.jwt.claim.sub', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', false);

do $$
begin
  for i in 1..10 loop
    perform public.reserve_storage_upload('receipts', 'folder-a/' || i || '.pdf');
  end loop;
end $$;

select pg_temp.expect_folder_count('receipts', 'folder-a', 10);
select pg_temp.expect_error(
  $sql$select public.reserve_storage_upload('receipts', 'folder-a/11.pdf')$sql$,
  'DOCUMENT_LIMIT'
);
select pg_temp.expect_folder_count('receipts', 'folder-a', 10);

-- Same object name is a replacement and does not take another slot.
select public.reserve_storage_upload('receipts', 'folder-a/1.pdf');
select pg_temp.expect_folder_count('receipts', 'folder-a', 10);

-- A different folder still has its own 10 slots.
select public.reserve_storage_upload('receipts', 'folder-b/1.pdf');
select pg_temp.expect_folder_count('receipts', 'folder-b', 1);
select pg_temp.expect_folder_count('receipts', 'folder-a', 10);

-- Expiry cleanup is limited to the folder being claimed.
insert into private.storage_upload_reservations (bucket_id, object_name, folder, reserved_at)
values ('receipts', 'folder-c/old.pdf', 'folder-c', now() - interval '11 minutes');

select public.reserve_storage_upload('receipts', 'folder-d/1.pdf');
select pg_temp.expect_folder_count('receipts', 'folder-c', 1);

do $$
begin
  for i in 1..10 loop
    perform public.reserve_storage_upload('receipts', 'folder-e/' || i || '.pdf');
  end loop;
end $$;

update private.storage_upload_reservations as r
  set reserved_at = now() - interval '11 minutes'
where r.bucket_id = 'receipts'
  and r.object_name = 'folder-e/1.pdf';

select public.reserve_storage_upload('receipts', 'folder-e/fresh.pdf');
select pg_temp.expect_folder_count('receipts', 'folder-e', 10);
select pg_temp.expect_folder_count('receipts', 'folder-c', 1);

do $$
declare
  v_still_there integer;
begin
  select count(*)::integer into v_still_there
  from private.storage_upload_reservations as r
  where r.object_name = 'folder-e/1.pdf';
  if v_still_there <> 0 then
    raise exception 'expired reservation in folder-e was kept';
  end if;
  select count(*)::integer into v_still_there
  from private.storage_upload_reservations as r
  where r.object_name = 'folder-c/old.pdf';
  if v_still_there <> 1 then
    raise exception 'expired reservation in folder-c was deleted by a claim in another folder';
  end if;
end $$;

-- Objects already stored in that folder count. Re-uploading one does not.
insert into storage.objects (bucket_id, name)
select 'receipts', 'stored/' || i || '.pdf'
from generate_series(1, 10) as file(i);

select pg_temp.expect_error(
  $sql$select public.reserve_storage_upload('receipts', 'stored/new.pdf')$sql$,
  'DOCUMENT_LIMIT'
);
select public.reserve_storage_upload('receipts', 'stored/1.pdf');
select pg_temp.expect_folder_count('receipts', 'stored', 0);
select public.reserve_storage_upload('receipts', 'stored-other/1.pdf');
select pg_temp.expect_folder_count('receipts', 'stored-other', 1);

select pg_temp.expect_error(
  $sql$select public.reserve_storage_upload('receipts', 'nofolder.pdf')$sql$,
  'STORAGE_PATH_REQUIRED'
);
select pg_temp.expect_error(
  $sql$select public.reserve_storage_upload('no-such-bucket', 'folder/file.pdf')$sql$,
  'STORAGE_PATH_REQUIRED'
);

do $$
begin
  for i in 1..20 loop
    perform private.claim_storage_folder_slot('chat-attachments', '77/' || i || '.jpg');
  end loop;
end $$;

select pg_temp.expect_folder_count('chat-attachments', '77', 20);
select pg_temp.expect_error(
  $sql$select public.reserve_storage_upload('chat-attachments', '77/21.jpg')$sql$,
  'CHAT_ATTACHMENT_LIMIT'
);
select private.claim_storage_folder_slot('chat-attachments', '77/1.jpg');
select pg_temp.expect_folder_count('chat-attachments', '77', 20);
select public.reserve_storage_upload('chat-attachments', '78/1.jpg');
select pg_temp.expect_folder_count('chat-attachments', '78', 1);

-- Authenticated callers are scoped to their own avatar and to chats they belong to.
create table public.upload_quota_members (
  itinerary_id bigint not null,
  user_id uuid not null,
  primary key (itinerary_id, user_id)
);

create or replace function public.is_itinerary_attendee(p_itinerary_id bigint, p_user_id uuid)
returns boolean
language sql stable
as $$
  select exists (
    select 1
    from public.upload_quota_members as m
    where m.itinerary_id = p_itinerary_id
      and m.user_id = p_user_id
  );
$$;

create or replace function public.is_chat_participant(p_itinerary_id bigint, p_user_id uuid)
returns boolean
language sql stable
as $$
  select public.is_itinerary_attendee(p_itinerary_id, p_user_id);
$$;

insert into public.upload_quota_members (itinerary_id, user_id)
values (42, '33333333-3333-4333-8333-333333333333');

select set_config('request.jwt.claim.role', 'authenticated', false);
select set_config('request.jwt.claim.sub', '33333333-3333-4333-8333-333333333333', false);

select pg_temp.expect_error(
  $sql$select public.reserve_storage_upload('receipts', 'user-try/1.pdf')$sql$,
  'STORAGE_FORBIDDEN'
);
select pg_temp.expect_error(
  $sql$select public.reserve_storage_upload('chat-attachments', '99/1.jpg')$sql$,
  'STORAGE_FORBIDDEN'
);
select public.reserve_storage_upload('chat-attachments', '42/mine.jpg');
select pg_temp.expect_folder_count('chat-attachments', '42', 1);

select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', false);
select public.reserve_storage_upload('avatars', '11111111-1111-4111-8111-111111111111/avatar.jpg');
select pg_temp.expect_error(
  $sql$select public.reserve_storage_upload('avatars', '11111111-1111-4111-8111-111111111111/other.jpg')$sql$,
  'AVATAR_LIMIT'
);
select public.reserve_storage_upload('avatars', '11111111-1111-4111-8111-111111111111/avatar.jpg');
select pg_temp.expect_folder_count('avatars', '11111111-1111-4111-8111-111111111111', 1);
select pg_temp.expect_error(
  $sql$select public.reserve_storage_upload('avatars', '22222222-2222-4222-8222-222222222222/avatar.jpg')$sql$,
  'STORAGE_FORBIDDEN'
);

-- An existing avatar object occupies the only slot.
select set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', false);
insert into storage.objects (bucket_id, name)
values ('avatars', '22222222-2222-4222-8222-222222222222/avatar.jpg');
select pg_temp.expect_error(
  $sql$select public.reserve_storage_upload('avatars', '22222222-2222-4222-8222-222222222222/new.jpg')$sql$,
  'AVATAR_LIMIT'
);
select public.reserve_storage_upload('avatars', '22222222-2222-4222-8222-222222222222/avatar.jpg');
select pg_temp.expect_folder_count('avatars', '22222222-2222-4222-8222-222222222222', 0);

-- Release deletes only the caller's reservation, unless the caller is the service role.
select set_config('request.jwt.claim.sub', '44444444-4444-4444-8444-444444444444', false);
select public.reserve_storage_upload('avatars', '44444444-4444-4444-8444-444444444444/avatar.jpg');
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', false);
select public.release_storage_upload('avatars', '44444444-4444-4444-8444-444444444444/avatar.jpg');
select pg_temp.expect_folder_count('avatars', '44444444-4444-4444-8444-444444444444', 1);
select set_config('request.jwt.claim.sub', '44444444-4444-4444-8444-444444444444', false);
select public.release_storage_upload('avatars', '44444444-4444-4444-8444-444444444444/avatar.jpg');
select pg_temp.expect_folder_count('avatars', '44444444-4444-4444-8444-444444444444', 0);

select public.reserve_storage_upload('avatars', '44444444-4444-4444-8444-444444444444/avatar.jpg');
select set_config('request.jwt.claim.role', '', false);
select set_config('request.jwt.claim.sub', '', false);
select pg_temp.expect_error(
  $sql$select public.release_storage_upload('avatars', '44444444-4444-4444-8444-444444444444/avatar.jpg')$sql$,
  'STORAGE_FORBIDDEN'
);
select set_config('request.jwt.claim.role', 'service_role', false);
select public.release_storage_upload('avatars', '44444444-4444-4444-8444-444444444444/avatar.jpg');
select pg_temp.expect_folder_count('avatars', '44444444-4444-4444-8444-444444444444', 0);

-- Insert policies call the same claim, so the avatar cap holds there too.
alter table storage.objects enable row level security;
grant usage on schema storage to authenticated, service_role;
grant select, insert, update, delete on storage.objects to authenticated, service_role;
grant usage, select on sequence storage.objects_id_seq to authenticated, service_role;

select set_config('request.jwt.claim.role', 'authenticated', false);
select set_config('request.jwt.claim.sub', '55555555-5555-4555-8555-555555555555', false);
set role authenticated;
insert into storage.objects (bucket_id, name)
values ('avatars', '55555555-5555-4555-8555-555555555555/avatar.jpg');
reset role;
select pg_temp.expect_folder_count('avatars', '55555555-5555-4555-8555-555555555555', 1);

do $$
begin
  execute 'set local role authenticated';
  insert into storage.objects (bucket_id, name)
  values ('avatars', '55555555-5555-4555-8555-555555555555/other.jpg');
  raise exception 'expected AVATAR_LIMIT';
exception
  when others then
    if sqlerrm is distinct from 'AVATAR_LIMIT' then
      raise exception 'expected AVATAR_LIMIT from storage insert, got %', sqlerrm;
    end if;
end $$;

select pg_temp.expect_folder_count('avatars', '55555555-5555-4555-8555-555555555555', 1);

do $$
declare
  v_policies integer;
  v_ok boolean;
begin
  select count(*)::integer
    into v_policies
  from pg_policies
  where schemaname = 'storage'
    and tablename = 'objects';
  if v_policies < 10 then
    raise exception 'expected storage.objects policies, found %', v_policies;
  end if;

  select b.file_size_limit = 2097152
      and b.allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
    into v_ok
  from storage.buckets as b
  where b.id = 'avatars';
  if v_ok is not true then
    raise exception 'avatar bucket limits were not applied';
  end if;

  select b.file_size_limit = 5242880 and 'image/heic' = any(b.allowed_mime_types)
    into v_ok
  from storage.buckets as b
  where b.id = 'chat-attachments';
  if v_ok is not true then
    raise exception 'chat bucket limits were not applied';
  end if;

  select b.file_size_limit = 10485760
    into v_ok
  from storage.buckets as b
  where b.id = 'receipts';
  if v_ok is not true then
    raise exception 'receipt bucket limit was not applied';
  end if;
end $$;
