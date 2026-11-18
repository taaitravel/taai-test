import {
  DEMO_ACCOUNT_EMAIL,
  DEMO_TRIPS,
  demoCreationKey,
  demoItinId,
  demoTripTotal,
  type DemoCategory,
  type DemoLine,
  type DemoTrip,
} from './demo-itineraries';

const SQL_CATEGORY: Record<DemoCategory, string> = {
  flight: 'flight',
  stay: 'hotel',
  activity: 'activity',
  dining: 'restaurant',
  transport: 'car',
};

function sqlText(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function sqlJson(values: string[]): string {
  return `${sqlText(JSON.stringify(values))}::json`;
}

function providerName(item: DemoLine): string {
  if (item.cat === 'flight') {
    const carrier = item.name.split(/\s+\d/)[0]?.trim();
    return (carrier || 'Airline').slice(0, 80);
  }
  const head = item.name.split('·')[0]?.trim() || item.name;
  return head.slice(0, 80);
}

function tripInsert(trip: DemoTrip, index: number): string {
  const key = demoCreationKey(index);
  const lines = trip.items.map((item, itemIndex) => {
    const origin = item.origin ? sqlText(item.origin) : 'null';
    const destination = item.destination ? sqlText(item.destination) : 'null';
    const notes = item.memo ? sqlText(item.memo) : 'null';
    return `    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', ${sqlText(SQL_CATEGORY[item.cat])}, ${sqlText(providerName(item))},
      ${sqlText(item.name)}, (${sqlText(item.date)}::date + time '12:00') at time zone 'UTC', ${sqlText(item.date)}::date, ${origin}, ${destination}, ${notes},
      'unpaid', ${item.amount.toFixed(2)}, 'USD'
    );`;
  }).join('\n');

  return `  insert into public.itinerary (
    userid, itin_id, itin_name, itin_desc, itin_date_start, itin_date_end,
    budget, planned_traveler_count, itin_locations, creation_key, user_type
  ) values (
    demo_id, ${sqlText(demoItinId(trip.code))}, ${sqlText(trip.name)}, ${sqlText(trip.note)},
    ${sqlText(trip.start)}::date, ${sqlText(trip.end)}::date, ${demoTripTotal(trip).toFixed(2)}, ${trip.pax},
    ${sqlJson(trip.locations)}, ${sqlText(key)}::uuid, 'individual'
  ) returning id into new_id;
${lines}`;
}

/**
 * Idempotent SQL for the Supabase SQL editor.
 * Looks up auth.users by email and writes only that account's demo rows.
 */
export function renderDemoSeedSql(): string {
  const keys = DEMO_TRIPS.map((_, index) => `${sqlText(demoCreationKey(index + 1))}::uuid`).join(',\n    ');
  const inserts = DEMO_TRIPS.map((trip, index) => tripInsert(trip, index + 1)).join('\n\n');
  return `-- Demo itineraries for ${DEMO_ACCOUNT_EMAIL}.
-- FILE ONLY. Do not apply from CI or against production until this has been reviewed.
-- Run it in the Supabase SQL editor (or \`supabase db query --linked -f <this file>\`).
--
-- What it writes
--   public.itinerary                         one row per demo trip, owned by that auth user
--   public.trip_external_bookings            one planned line per cost, currency USD
--   public.itinerary_attendees               owner row, via the existing create trigger
--   public.itinerary_budget_breakdown        default rows, via the existing budget trigger
--   columns service_date, service_end_date   added to trip_external_bookings when missing
--
-- The line items are plans the traveler recorded. Nothing here is a taai booking,
-- a payment, or a confirmation number.
--
-- Depends on
--   public.trip_external_bookings
--     supabase/migrations/20260801153923_external_trip_bookings.sql
--   itinerary.planned_traveler_count and itinerary.creation_key
--     supabase/migrations/20260807231500_itinerary_membership_contract.sql
-- If either is missing, this script prints a notice and inserts nothing.
--
-- Does not depend on
--   supabase/migrations/20261103235000_security_definer_and_rls_hardening.sql
--   (PR #26, which may still be unapplied). That file changes function grants
--   and policies. This script does not call those functions. Apply #26 on its
--   own review; this seed neither requires it nor replaces it.
--
-- Plan limit
--   If 20261023190000_plan_entitlements_and_storage_limits.sql is applied, the
--   free tier allows 3 itineraries. enforce_itinerary_limit is disabled only
--   while these rows are inserted, then turned back on. The demo account can
--   hold this set so the metrics page has a last year to compare. Later trip
--   creates by that account still count against the plan.
--   record_trip_created is paused for the same window so a re-run does not
--   add a usage_tracking row per trip.
--
-- Idempotent, and limited to one account
--   Deletes and reinserts itineraries whose itin_id starts with 'demo:' or
--   whose creation_key is one of the keys below, and only when userid is the
--   auth user for ${DEMO_ACCOUNT_EMAIL}. No other user's rows are touched.
--   If that auth user does not exist, the script adds the date columns (when
--   the bookings table exists) and inserts nothing. The notice is:
--   demo itinerary seed: no auth user for ${DEMO_ACCOUNT_EMAIL}, so no itineraries were inserted.
--
-- Provenance
--   These rows are ordinary itineraries owned by that account. They are not
--   marked synthetic, fixture, or qa_fixture, so the metrics page does not
--   hide them. A future provenance value of 'demo' is also kept visible.

do $seed$
declare
  demo_id uuid;
  new_id bigint;
  inserted_count integer := 0;
  disabled_limit boolean := false;
  disabled_usage boolean := false;
  demo_keys uuid[] := array[
    ${keys}
  ];
begin
  if to_regclass('public.trip_external_bookings') is null then
    raise notice 'demo itinerary seed skipped: public.trip_external_bookings does not exist. Apply supabase/migrations/20260801153923_external_trip_bookings.sql first. No rows were written.';
    return;
  end if;

  alter table public.trip_external_bookings
    add column if not exists service_date date,
    add column if not exists service_end_date date;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'itinerary' and column_name = 'planned_traveler_count'
  ) or not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'itinerary' and column_name = 'creation_key'
  ) then
    raise notice 'demo itinerary seed skipped: itinerary.planned_traveler_count or creation_key is missing. Apply supabase/migrations/20260807231500_itinerary_membership_contract.sql first. No itineraries were written.';
    return;
  end if;

  select id into demo_id
  from auth.users
  where lower(email) = ${sqlText(DEMO_ACCOUNT_EMAIL)}
  order by created_at asc
  limit 1;

  if demo_id is null then
    raise notice 'demo itinerary seed: no auth user for ${DEMO_ACCOUNT_EMAIL}, so no itineraries were inserted.';
    return;
  end if;

  if exists (
    select 1 from pg_trigger
    where tgname = 'enforce_itinerary_limit' and tgrelid = 'public.itinerary'::regclass and not tgisinternal
  ) then
    alter table public.itinerary disable trigger enforce_itinerary_limit;
    disabled_limit := true;
  end if;

  if exists (
    select 1 from pg_trigger
    where tgname = 'record_trip_created' and tgrelid = 'public.itinerary'::regclass and not tgisinternal
  ) then
    alter table public.itinerary disable trigger record_trip_created;
    disabled_usage := true;
  end if;

  delete from public.trip_external_bookings
  where itinerary_id in (
    select id from public.itinerary
    where userid = demo_id
      and (itin_id like 'demo:%' or creation_key = any (demo_keys))
  );

  delete from public.itinerary
  where userid = demo_id
    and (itin_id like 'demo:%' or creation_key = any (demo_keys));

${inserts}

  inserted_count := ${DEMO_TRIPS.length};

  if disabled_limit then
    alter table public.itinerary enable trigger enforce_itinerary_limit;
  end if;
  if disabled_usage then
    alter table public.itinerary enable trigger record_trip_created;
  end if;

  raise notice 'demo itinerary seed: replaced % demo itineraries for ${DEMO_ACCOUNT_EMAIL}. No other account was modified.', inserted_count;
exception
  when others then
    if disabled_limit then
      alter table public.itinerary enable trigger enforce_itinerary_limit;
    end if;
    if disabled_usage then
      alter table public.itinerary enable trigger record_trip_created;
    end if;
    raise;
end
$seed$;
`;
}
