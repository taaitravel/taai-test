-- =====================================================================
-- UNAPPLIED PROPOSAL — DO NOT RUN AS PART OF ANY DEPLOYMENT
--
-- Purpose: scope itinerary_chat_reactions to a trip so realtime can be
-- filtered per conversation instead of broadcasting every reaction to
-- every subscriber (egress containment), with owner/member RLS.
--
-- Review gate: requires explicit human approval before it is turned into a
-- migration. Nothing in the application depends on it yet; the client keeps
-- ignoring reaction events whose message is not in the loaded page.
-- =====================================================================

begin;

-- 1. Column + foreign key -------------------------------------------------
alter table public.itinerary_chat_reactions
  add column if not exists itinerary_id bigint;

-- 2. Deterministic backfill from the parent message ------------------------
update public.itinerary_chat_reactions r
   set itinerary_id = m.itinerary_id
  from public.itinerary_chat_messages m
 where m.id = r.message_id
   and r.itinerary_id is distinct from m.itinerary_id;

-- Orphaned reactions (message deleted) cannot be scoped and are removed.
delete from public.itinerary_chat_reactions r
 where r.itinerary_id is null;

alter table public.itinerary_chat_reactions
  alter column itinerary_id set not null;

alter table public.itinerary_chat_reactions
  add constraint itinerary_chat_reactions_itinerary_fk
  foreign key (itinerary_id) references public.itinerary (id) on delete cascade;

-- 3. Keep it correct on write --------------------------------------------
create or replace function public.set_chat_reaction_itinerary()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  select m.itinerary_id into new.itinerary_id
    from public.itinerary_chat_messages m
   where m.id = new.message_id;
  if new.itinerary_id is null then
    raise exception 'reaction must reference an existing chat message';
  end if;
  return new;
end;
$$;

drop trigger if exists set_chat_reaction_itinerary on public.itinerary_chat_reactions;
create trigger set_chat_reaction_itinerary
  before insert or update of message_id on public.itinerary_chat_reactions
  for each row execute function public.set_chat_reaction_itinerary();

-- 4. Index for the realtime filter and per-page reads ---------------------
create index if not exists itinerary_chat_reactions_itinerary_message_idx
  on public.itinerary_chat_reactions (itinerary_id, message_id);

-- 5. Grants ---------------------------------------------------------------
grant select, insert, delete on public.itinerary_chat_reactions to authenticated;
grant all on public.itinerary_chat_reactions to service_role;

-- 6. Owner / member RLS ---------------------------------------------------
alter table public.itinerary_chat_reactions enable row level security;

drop policy if exists "Members read trip reactions" on public.itinerary_chat_reactions;
create policy "Members read trip reactions"
on public.itinerary_chat_reactions
for select
to authenticated
using (public.is_itinerary_attendee(itinerary_id, auth.uid()));

drop policy if exists "Members add own reactions" on public.itinerary_chat_reactions;
create policy "Members add own reactions"
on public.itinerary_chat_reactions
for insert
to authenticated
with check (user_id = auth.uid() and public.is_itinerary_attendee(itinerary_id, auth.uid()));

drop policy if exists "Members remove own reactions" on public.itinerary_chat_reactions;
create policy "Members remove own reactions"
on public.itinerary_chat_reactions
for delete
to authenticated
using (user_id = auth.uid());

commit;

-- 7. Client change enabled by this proposal (also unapplied) --------------
-- useItineraryChat would add to the reactions realtime subscription:
--   filter: `itinerary_id=eq.${itineraryId}`
-- so a subscriber only receives reactions for the open conversation.

-- ROLLBACK ---------------------------------------------------------------
-- drop trigger if exists set_chat_reaction_itinerary on public.itinerary_chat_reactions;
-- drop function if exists public.set_chat_reaction_itinerary();
-- drop index if exists public.itinerary_chat_reactions_itinerary_message_idx;
-- alter table public.itinerary_chat_reactions
--   drop constraint if exists itinerary_chat_reactions_itinerary_fk,
--   drop column if exists itinerary_id;
