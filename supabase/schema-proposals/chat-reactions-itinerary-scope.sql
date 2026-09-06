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
-- Quarantine, never guess. A reaction is backfilled only when its message_id
-- resolves to EXACTLY ONE itinerary. Anything else (missing message_id,
-- deleted message, or — defensively — more than one candidate itinerary) is
-- moved to a quarantine table for human review, and the migration FAILS
-- CLOSED if any unresolvable row is still present in the live table.

create table if not exists public.itinerary_chat_reactions_quarantine (
  quarantined_at timestamptz not null default now(),
  reason         text        not null,
  reaction       jsonb       not null
);
revoke all on public.itinerary_chat_reactions_quarantine from anon, authenticated;
grant all on public.itinerary_chat_reactions_quarantine to service_role;
alter table public.itinerary_chat_reactions_quarantine enable row level security;

with candidates as (
  select r.id,
         count(distinct m.itinerary_id) as itinerary_count,
         min(m.itinerary_id)            as itinerary_id
    from public.itinerary_chat_reactions r
    left join public.itinerary_chat_messages m on m.id = r.message_id
   group by r.id
)
update public.itinerary_chat_reactions r
   set itinerary_id = c.itinerary_id
  from candidates c
 where c.id = r.id
   and c.itinerary_count = 1
   and c.itinerary_id is not null;

-- Ambiguous / unmappable rows are quarantined verbatim, then removed from the
-- live table so no reaction is ever attributed to a guessed trip.
with unresolved as (
  select r.*
    from public.itinerary_chat_reactions r
   where r.itinerary_id is null
)
insert into public.itinerary_chat_reactions_quarantine (reason, reaction)
select case
         when u.message_id is null then 'missing message_id'
         when not exists (select 1 from public.itinerary_chat_messages m where m.id = u.message_id)
           then 'parent message not found'
         else 'ambiguous itinerary mapping'
       end,
       to_jsonb(u)
  from unresolved u;

delete from public.itinerary_chat_reactions r
 where r.itinerary_id is null;

-- Fail closed: abort the whole migration if anything unresolvable remains.
do $$
declare
  _remaining bigint;
begin
  select count(*) into _remaining
    from public.itinerary_chat_reactions
   where itinerary_id is null;
  if _remaining > 0 then
    raise exception 'aborting: % reaction rows could not be deterministically scoped', _remaining;
  end if;
end $$;

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
-- Quarantined rows are kept deliberately: re-insert them from
-- public.itinerary_chat_reactions_quarantine after human review, then
-- drop table if exists public.itinerary_chat_reactions_quarantine;
