-- Demo itineraries for info@taai.travel.
-- FILE ONLY. Do not apply from CI or against production until this has been reviewed.
-- Run it in the Supabase SQL editor (or `supabase db query --linked -f <this file>`).
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
--   auth user for info@taai.travel. No other user's rows are touched.
--   If that auth user does not exist, the script adds the date columns (when
--   the bookings table exists) and inserts nothing. The notice is:
--   demo itinerary seed: no auth user for info@taai.travel, so no itineraries were inserted.
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
    'd4100000-de40-4000-8000-000000000001'::uuid,
    'd4100000-de40-4000-8000-000000000002'::uuid,
    'd4100000-de40-4000-8000-000000000003'::uuid,
    'd4100000-de40-4000-8000-000000000004'::uuid,
    'd4100000-de40-4000-8000-000000000005'::uuid,
    'd4100000-de40-4000-8000-000000000006'::uuid,
    'd4100000-de40-4000-8000-000000000007'::uuid,
    'd4100000-de40-4000-8000-000000000008'::uuid,
    'd4100000-de40-4000-8000-000000000009'::uuid,
    'd4100000-de40-4000-8000-00000000000a'::uuid,
    'd4100000-de40-4000-8000-00000000000b'::uuid,
    'd4100000-de40-4000-8000-00000000000c'::uuid,
    'd4100000-de40-4000-8000-00000000000d'::uuid
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
  where lower(email) = 'info@taai.travel'
  order by created_at asc
  limit 1;

  if demo_id is null then
    raise notice 'demo itinerary seed: no auth user for info@taai.travel, so no itineraries were inserted.';
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

  insert into public.itinerary (
    userid, itin_id, itin_name, itin_desc, itin_date_start, itin_date_end,
    budget, planned_traveler_count, itin_locations, creation_key, user_type
  ) values (
    demo_id, 'demo:NYC-VT-2612', 'Powder & Park Ave', 'Fly into New York, drive four hours north, ski four days, then one last night back in the city.',
    '2026-12-26'::date, '2027-01-03'::date, 13116.00, 3,
    '["Miami, United States","New York, United States","Killington, VT, United States"]'::json, 'd4100000-de40-4000-8000-000000000001'::uuid, 'individual'
  ) returning id into new_id;
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'flight', 'American',
      'American 1142 · MIA → LGA', ('2026-12-26'::date + time '12:00') at time zone 'UTC', '2026-12-26'::date, 'MIA', 'LGA', '3 seats, economy',
      'unpaid', 1284.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'car', 'SUV rental',
      'SUV rental · 8 days, AWD + ski rack', ('2026-12-26'::date + time '12:00') at time zone 'UTC', '2026-12-26'::date, null, null, 'Avis LGA',
      'unpaid', 892.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'hotel', 'Slopeside house, Killington',
      'Slopeside house, Killington', ('2026-12-26'::date + time '12:00') at time zone 'UTC', '2026-12-26'::date, null, null, '6 nights · 3 bedrooms',
      'unpaid', 4380.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'activity', 'Killington lift passes',
      'Killington lift passes', ('2026-12-27'::date + time '12:00') at time zone 'UTC', '2026-12-27'::date, null, null, '4 days × 3 skiers',
      'unpaid', 1560.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'activity', 'Ski & boot rental',
      'Ski & boot rental', ('2026-12-27'::date + time '12:00') at time zone 'UTC', '2026-12-27'::date, null, null, '4 days × 3',
      'unpaid', 420.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'activity', 'Backcountry snowmobile tour',
      'Backcountry snowmobile tour', ('2026-12-30'::date + time '12:00') at time zone 'UTC', '2026-12-30'::date, null, null, '3 places',
      'unpaid', 465.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'hotel', 'The Standard, East Village',
      'The Standard, East Village', ('2027-01-01'::date + time '12:00') at time zone 'UTC', '2027-01-01'::date, null, null, '1 night · 2 rooms',
      'unpaid', 980.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'activity', 'New Year''s Eve dinner & rooftop',
      'New Year''s Eve dinner & rooftop', ('2026-12-31'::date + time '12:00') at time zone 'UTC', '2026-12-31'::date, null, null, '3 places',
      'unpaid', 685.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'restaurant', 'Dining',
      'Dining · Vermont & New York', ('2026-12-26'::date + time '12:00') at time zone 'UTC', '2026-12-26'::date, null, null, '14 covers',
      'unpaid', 2140.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'car', 'Fuel, tolls, parking',
      'Fuel, tolls, parking', ('2026-12-26'::date + time '12:00') at time zone 'UTC', '2026-12-26'::date, null, null, 'MIA–LGA–VT–NYC',
      'unpaid', 310.00, 'USD'
    );

  insert into public.itinerary (
    userid, itin_id, itin_name, itin_desc, itin_date_start, itin_date_end,
    budget, planned_traveler_count, itin_locations, creation_key, user_type
  ) values (
    demo_id, 'demo:DCA-2701', 'The Capital Table', 'Two weeks eating through the city, with three nights at the Rosewood in the middle as the splurge.',
    '2027-01-27'::date, '2027-02-10'::date, 6978.00, 1,
    '["Miami, United States","Washington, DC, United States"]'::json, 'd4100000-de40-4000-8000-000000000002'::uuid, 'individual'
  ) returning id into new_id;
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'flight', 'Delta',
      'Delta 1318 · MIA → DCA', ('2027-01-27'::date + time '12:00') at time zone 'UTC', '2027-01-27'::date, 'MIA', 'DCA', '1 seat, economy',
      'unpaid', 412.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'car', 'Compact rental',
      'Compact rental · 14 days', ('2027-01-27'::date + time '12:00') at time zone 'UTC', '2027-01-27'::date, null, null, 'Hertz DCA',
      'unpaid', 686.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'hotel', 'Apartment, Capitol Hill',
      'Apartment, Capitol Hill', ('2027-01-27'::date + time '12:00') at time zone 'UTC', '2027-01-27'::date, null, null, '11 nights',
      'unpaid', 2310.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'hotel', 'Rosewood Georgetown',
      'Rosewood Georgetown', ('2027-02-03'::date + time '12:00') at time zone 'UTC', '2027-02-03'::date, null, null, '3 nights · midpoint',
      'unpaid', 1185.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'activity', 'Museum & gallery passes',
      'Museum & gallery passes', ('2027-01-29'::date + time '12:00') at time zone 'UTC', '2027-01-29'::date, null, null, 'Phillips, Hirshhorn, Planet Word',
      'unpaid', 185.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'activity', 'Kennedy Center',
      'Kennedy Center · evening performance', ('2027-02-05'::date + time '12:00') at time zone 'UTC', '2027-02-05'::date, null, null, '1 seat',
      'unpaid', 155.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'restaurant', 'Tasting menus',
      'Tasting menus · Rose''s, Albi, Jônt', ('2027-01-28'::date + time '12:00') at time zone 'UTC', '2027-01-28'::date, null, null, '3 seatings',
      'unpaid', 1180.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'restaurant', 'Everything else',
      'Everything else · Union Market to Little Ethiopia', ('2027-01-27'::date + time '12:00') at time zone 'UTC', '2027-01-27'::date, null, null, '14 days',
      'unpaid', 600.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'car', 'Metro, parking, tolls',
      'Metro, parking, tolls', ('2027-01-27'::date + time '12:00') at time zone 'UTC', '2027-01-27'::date, null, null, null,
      'unpaid', 265.00, 'USD'
    );

  insert into public.itinerary (
    userid, itin_id, itin_name, itin_desc, itin_date_start, itin_date_end,
    budget, planned_traveler_count, itin_locations, creation_key, user_type
  ) values (
    demo_id, 'demo:EZE-PAT-2702', 'Southbound', 'A week in the city, then south — Perito Moreno, an estancia, and a round at Llao Llao.',
    '2027-02-23'::date, '2027-03-10'::date, 19810.00, 2,
    '["New York, United States","Buenos Aires, Argentina","El Calafate, Argentina","Bariloche, Argentina"]'::json, 'd4100000-de40-4000-8000-000000000003'::uuid, 'individual'
  ) returning id into new_id;
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'flight', 'American',
      'American 953 · JFK → EZE', ('2027-02-23'::date + time '12:00') at time zone 'UTC', '2027-02-23'::date, 'JFK', 'EZE', '2 seats · 10h 50m',
      'unpaid', 2760.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'hotel', 'Palermo apartment, Buenos Aires',
      'Palermo apartment, Buenos Aires', ('2027-02-23'::date + time '12:00') at time zone 'UTC', '2027-02-23'::date, null, null, '7 nights',
      'unpaid', 3290.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'restaurant', 'Buenos Aires',
      'Buenos Aires · Don Julio, Trescha, Anafe', ('2027-02-24'::date + time '12:00') at time zone 'UTC', '2027-02-24'::date, null, null, '7 nights of eating',
      'unpaid', 1870.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'activity', 'Tango at Rojo Tango + San Telmo walk',
      'Tango at Rojo Tango + San Telmo walk', ('2027-02-26'::date + time '12:00') at time zone 'UTC', '2027-02-26'::date, null, null, '2 places',
      'unpaid', 320.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'flight', 'Aerolíneas',
      'Aerolíneas 1874 · AEP → FTE', ('2027-03-02'::date + time '12:00') at time zone 'UTC', '2027-03-02'::date, 'AEP', 'FTE', '2 seats',
      'unpaid', 640.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'hotel', 'Lodge, El Calafate',
      'Lodge, El Calafate', ('2027-03-02'::date + time '12:00') at time zone 'UTC', '2027-03-02'::date, null, null, '4 nights',
      'unpaid', 2180.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'activity', 'Perito Moreno ice trek',
      'Perito Moreno ice trek', ('2027-03-03'::date + time '12:00') at time zone 'UTC', '2027-03-03'::date, null, null, '2 places · full day',
      'unpaid', 580.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'activity', 'Estancia day & horseback',
      'Estancia day & horseback', ('2027-03-05'::date + time '12:00') at time zone 'UTC', '2027-03-05'::date, null, null, '2 places',
      'unpaid', 430.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'flight', 'Aerolíneas',
      'Aerolíneas 1692 · FTE → BRC', ('2027-03-06'::date + time '12:00') at time zone 'UTC', '2027-03-06'::date, 'FTE', 'BRC', '2 seats',
      'unpaid', 520.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'hotel', 'Llao Llao, Bariloche',
      'Llao Llao, Bariloche', ('2027-03-06'::date + time '12:00') at time zone 'UTC', '2027-03-06'::date, null, null, '4 nights · lake view',
      'unpaid', 3960.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'activity', 'Golf',
      'Golf · Llao Llao course', ('2027-03-07'::date + time '12:00') at time zone 'UTC', '2027-03-07'::date, null, null, '2 rounds + carts',
      'unpaid', 410.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'activity', 'Nahuel Huapi kayak & Circuito Chico',
      'Nahuel Huapi kayak & Circuito Chico', ('2027-03-08'::date + time '12:00') at time zone 'UTC', '2027-03-08'::date, null, null, '2 places',
      'unpaid', 810.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'restaurant', 'Patagonia',
      'Patagonia · lamb, trout, bodegas', ('2027-03-02'::date + time '12:00') at time zone 'UTC', '2027-03-02'::date, null, null, '8 nights',
      'unpaid', 1120.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'car', 'Remises, transfers, park fees',
      'Remises, transfers, park fees', ('2027-02-23'::date + time '12:00') at time zone 'UTC', '2027-02-23'::date, null, null, null,
      'unpaid', 540.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'flight', 'American',
      'American 954 · EZE → JFK', ('2027-03-10'::date + time '12:00') at time zone 'UTC', '2027-03-10'::date, 'EZE', 'JFK', '2 seats · return leg taxes',
      'unpaid', 380.00, 'USD'
    );

  insert into public.itinerary (
    userid, itin_id, itin_name, itin_desc, itin_date_start, itin_date_end,
    budget, planned_traveler_count, itin_locations, creation_key, user_type
  ) values (
    demo_id, 'demo:LRM-2705', 'Casa de Campo', 'Four nights easing in at La Romana, then the villa, Teeth of the Dog, and Catalina.',
    '2027-05-05'::date, '2027-05-15'::date, 17415.00, 4,
    '["Miami, United States","La Romana, Dominican Republic"]'::json, 'd4100000-de40-4000-8000-000000000004'::uuid, 'individual'
  ) returning id into new_id;
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'flight', 'JetBlue',
      'JetBlue 1281 · MIA → LRM', ('2027-05-05'::date + time '12:00') at time zone 'UTC', '2027-05-05'::date, 'MIA', 'LRM', '4 seats',
      'unpaid', 1640.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'hotel', 'Hotel, La Romana',
      'Hotel, La Romana', ('2027-05-05'::date + time '12:00') at time zone 'UTC', '2027-05-05'::date, null, null, '4 nights · 2 rooms',
      'unpaid', 2480.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'hotel', 'Villa, Casa de Campo',
      'Villa, Casa de Campo', ('2027-05-09'::date + time '12:00') at time zone 'UTC', '2027-05-09'::date, null, null, '6 nights · 4 bedrooms, staff',
      'unpaid', 7200.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'activity', 'Teeth of the Dog',
      'Teeth of the Dog · 2 rounds', ('2027-05-10'::date + time '12:00') at time zone 'UTC', '2027-05-10'::date, null, null, '4 players',
      'unpaid', 1960.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'activity', 'Catalina Island day & boat',
      'Catalina Island day & boat', ('2027-05-12'::date + time '12:00') at time zone 'UTC', '2027-05-12'::date, null, null, '4 places',
      'unpaid', 880.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'activity', 'Altos de Chavón evening',
      'Altos de Chavón evening', ('2027-05-13'::date + time '12:00') at time zone 'UTC', '2027-05-13'::date, null, null, '4 places',
      'unpaid', 295.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'restaurant', 'Dining',
      'Dining · Minitas, La Caña, Chavón', ('2027-05-05'::date + time '12:00') at time zone 'UTC', '2027-05-05'::date, null, null, '10 days',
      'unpaid', 2340.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'car', 'Golf carts, transfers, marina',
      'Golf carts, transfers, marina', ('2027-05-05'::date + time '12:00') at time zone 'UTC', '2027-05-05'::date, null, null, null,
      'unpaid', 620.00, 'USD'
    );

  insert into public.itinerary (
    userid, itin_id, itin_name, itin_desc, itin_date_start, itin_date_end,
    budget, planned_traveler_count, itin_locations, creation_key, user_type
  ) values (
    demo_id, 'demo:LIS-2709', 'Atlantic Edge', 'Built from your last three trips: the Medellín group size, the Costa Rica budget, the Italy pacing.',
    '2027-09-10'::date, '2027-09-20'::date, 25300.00, 6,
    '["Miami, United States","Lisbon, Portugal","Comporta, Portugal","Algarve, Portugal"]'::json, 'd4100000-de40-4000-8000-000000000005'::uuid, 'individual'
  ) returning id into new_id;
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'flight', 'TAP',
      'TAP 236 · MIA → LIS', ('2027-09-10'::date + time '12:00') at time zone 'UTC', '2027-09-10'::date, 'MIA', 'LIS', '6 seats',
      'unpaid', 4860.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'hotel', 'Bairro Alto Hotel, Lisbon',
      'Bairro Alto Hotel, Lisbon', ('2027-09-10'::date + time '12:00') at time zone 'UTC', '2027-09-10'::date, null, null, '3 nights · 3 rooms',
      'unpaid', 2940.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'hotel', 'Beach house, Comporta',
      'Beach house, Comporta', ('2027-09-13'::date + time '12:00') at time zone 'UTC', '2027-09-13'::date, null, null, '3 nights · 4 bedrooms',
      'unpaid', 3600.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'hotel', 'Resort, Quinta do Lago',
      'Resort, Quinta do Lago', ('2027-09-16'::date + time '12:00') at time zone 'UTC', '2027-09-16'::date, null, null, '4 nights · 3 rooms',
      'unpaid', 4420.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'car', 'Van rental',
      'Van rental · 10 days', ('2027-09-10'::date + time '12:00') at time zone 'UTC', '2027-09-10'::date, null, null, '9 seats',
      'unpaid', 1180.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'activity', 'Golf',
      'Golf · Monte Rei & Quinta do Lago South', ('2027-09-17'::date + time '12:00') at time zone 'UTC', '2027-09-17'::date, null, null, '6 players · 2 rounds',
      'unpaid', 2340.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'activity', 'Surf lessons, Comporta',
      'Surf lessons, Comporta', ('2027-09-14'::date + time '12:00') at time zone 'UTC', '2027-09-14'::date, null, null, '6 places · 2 sessions',
      'unpaid', 690.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'activity', 'Benagil caves & coast boat',
      'Benagil caves & coast boat', ('2027-09-18'::date + time '12:00') at time zone 'UTC', '2027-09-18'::date, null, null, '6 places',
      'unpaid', 820.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'activity', 'Setúbal wine & seafood day',
      'Setúbal wine & seafood day', ('2027-09-15'::date + time '12:00') at time zone 'UTC', '2027-09-15'::date, null, null, '6 places',
      'unpaid', 600.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'restaurant', 'Dining',
      'Dining · Lisbon to Algarve', ('2027-09-10'::date + time '12:00') at time zone 'UTC', '2027-09-10'::date, null, null, '10 days, 6 people',
      'unpaid', 3850.00, 'USD'
    );

  insert into public.itinerary (
    userid, itin_id, itin_name, itin_desc, itin_date_start, itin_date_end,
    budget, planned_traveler_count, itin_locations, creation_key, user_type
  ) values (
    demo_id, 'demo:MSY-2512', 'New Orleans', 'A long weekend for music and food, home in time for the week.',
    '2025-12-11'::date, '2025-12-15'::date, 2690.00, 2,
    '["Miami, United States","New Orleans, United States"]'::json, 'd4100000-de40-4000-8000-000000000006'::uuid, 'individual'
  ) returning id into new_id;
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'flight', 'American',
      'American 2214 · MIA → MSY', ('2025-12-11'::date + time '12:00') at time zone 'UTC', '2025-12-11'::date, 'MIA', 'MSY', '2 seats',
      'unpaid', 420.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'hotel', 'Hotel, French Quarter',
      'Hotel, French Quarter', ('2025-12-11'::date + time '12:00') at time zone 'UTC', '2025-12-11'::date, null, null, '4 nights',
      'unpaid', 980.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'restaurant', 'Dining',
      'Dining · New Orleans', ('2025-12-11'::date + time '12:00') at time zone 'UTC', '2025-12-11'::date, null, null, '4 nights',
      'unpaid', 640.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'activity', 'Jazz at Preservation Hall',
      'Jazz at Preservation Hall', ('2025-12-12'::date + time '12:00') at time zone 'UTC', '2025-12-12'::date, null, null, '2 places',
      'unpaid', 180.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'car', 'Taxis and streetcar',
      'Taxis and streetcar', ('2025-12-11'::date + time '12:00') at time zone 'UTC', '2025-12-11'::date, null, null, null,
      'unpaid', 90.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'flight', 'American',
      'American 2215 · MSY → MIA', ('2025-12-15'::date + time '12:00') at time zone 'UTC', '2025-12-15'::date, 'MSY', 'MIA', '2 seats, return',
      'unpaid', 380.00, 'USD'
    );

  insert into public.itinerary (
    userid, itin_id, itin_name, itin_desc, itin_date_start, itin_date_end,
    budget, planned_traveler_count, itin_locations, creation_key, user_type
  ) values (
    demo_id, 'demo:MEX-2511', 'Mexico City', 'Museums, a cooking class, and long lunches in Roma Norte.',
    '2025-11-06'::date, '2025-11-12'::date, 3760.00, 2,
    '["Miami, United States","Mexico City, Mexico"]'::json, 'd4100000-de40-4000-8000-000000000007'::uuid, 'individual'
  ) returning id into new_id;
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'flight', 'American',
      'American 389 · MIA → MEX', ('2025-11-06'::date + time '12:00') at time zone 'UTC', '2025-11-06'::date, 'MIA', 'MEX', '2 seats',
      'unpaid', 780.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'hotel', 'Apartment, Roma Norte',
      'Apartment, Roma Norte', ('2025-11-06'::date + time '12:00') at time zone 'UTC', '2025-11-06'::date, null, null, '6 nights',
      'unpaid', 1400.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'restaurant', 'Dining',
      'Dining · Roma and Centro', ('2025-11-06'::date + time '12:00') at time zone 'UTC', '2025-11-06'::date, null, null, null,
      'unpaid', 520.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'activity', 'Anthropology museum and cooking class',
      'Anthropology museum and cooking class', ('2025-11-07'::date + time '12:00') at time zone 'UTC', '2025-11-07'::date, null, null, null,
      'unpaid', 260.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'car', 'Airport transfers',
      'Airport transfers', ('2025-11-06'::date + time '12:00') at time zone 'UTC', '2025-11-06'::date, null, null, null,
      'unpaid', 110.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'flight', 'American',
      'American 390 · MEX → MIA', ('2025-11-12'::date + time '12:00') at time zone 'UTC', '2025-11-12'::date, 'MEX', 'MIA', '2 seats, return',
      'unpaid', 690.00, 'USD'
    );

  insert into public.itinerary (
    userid, itin_id, itin_name, itin_desc, itin_date_start, itin_date_end,
    budget, planned_traveler_count, itin_locations, creation_key, user_type
  ) values (
    demo_id, 'demo:LIS-2505', 'First Lisbon', 'The first time in the city — trams, miradouros, and one night in Belém.',
    '2025-05-08'::date, '2025-05-15'::date, 6430.00, 2,
    '["Miami, United States","Lisbon, Portugal"]'::json, 'd4100000-de40-4000-8000-000000000008'::uuid, 'individual'
  ) returning id into new_id;
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'flight', 'TAP',
      'TAP 227 · MIA → LIS', ('2025-05-08'::date + time '12:00') at time zone 'UTC', '2025-05-08'::date, 'MIA', 'LIS', '2 seats',
      'unpaid', 1680.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'hotel', 'Apartment, Alfama',
      'Apartment, Alfama', ('2025-05-08'::date + time '12:00') at time zone 'UTC', '2025-05-08'::date, null, null, '7 nights',
      'unpaid', 2100.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'restaurant', 'Dining',
      'Dining · Lisbon', ('2025-05-08'::date + time '12:00') at time zone 'UTC', '2025-05-08'::date, null, null, null,
      'unpaid', 740.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'activity', 'Day trip, Sintra',
      'Day trip, Sintra', ('2025-05-10'::date + time '12:00') at time zone 'UTC', '2025-05-10'::date, null, null, null,
      'unpaid', 310.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'car', 'Metro and tuk-tuk',
      'Metro and tuk-tuk', ('2025-05-08'::date + time '12:00') at time zone 'UTC', '2025-05-08'::date, null, null, null,
      'unpaid', 180.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'flight', 'TAP',
      'TAP 228 · LIS → MIA', ('2025-05-15'::date + time '12:00') at time zone 'UTC', '2025-05-15'::date, 'LIS', 'MIA', '2 seats, return',
      'unpaid', 1420.00, 'USD'
    );

  insert into public.itinerary (
    userid, itin_id, itin_name, itin_desc, itin_date_start, itin_date_end,
    budget, planned_traveler_count, itin_locations, creation_key, user_type
  ) values (
    demo_id, 'demo:EYW-2601', 'Key West', 'A short hop south for the water and one long dinner.',
    '2026-01-16'::date, '2026-01-19'::date, 2110.00, 2,
    '["Miami, United States","Key West, United States"]'::json, 'd4100000-de40-4000-8000-000000000009'::uuid, 'individual'
  ) returning id into new_id;
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'flight', 'American',
      'American 3615 · MIA → EYW', ('2026-01-16'::date + time '12:00') at time zone 'UTC', '2026-01-16'::date, 'MIA', 'EYW', '2 seats',
      'unpaid', 310.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'hotel', 'Inn, Old Town',
      'Inn, Old Town', ('2026-01-16'::date + time '12:00') at time zone 'UTC', '2026-01-16'::date, null, null, '3 nights',
      'unpaid', 890.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'restaurant', 'Dining',
      'Dining · Key West', ('2026-01-16'::date + time '12:00') at time zone 'UTC', '2026-01-16'::date, null, null, null,
      'unpaid', 420.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'activity', 'Sunset sail',
      'Sunset sail', ('2026-01-17'::date + time '12:00') at time zone 'UTC', '2026-01-17'::date, null, null, '2 places',
      'unpaid', 150.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'car', 'Taxis',
      'Taxis', ('2026-01-16'::date + time '12:00') at time zone 'UTC', '2026-01-16'::date, null, null, null,
      'unpaid', 60.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'flight', 'American',
      'American 3616 · EYW → MIA', ('2026-01-19'::date + time '12:00') at time zone 'UTC', '2026-01-19'::date, 'EYW', 'MIA', '2 seats, return',
      'unpaid', 280.00, 'USD'
    );

  insert into public.itinerary (
    userid, itin_id, itin_name, itin_desc, itin_date_start, itin_date_end,
    budget, planned_traveler_count, itin_locations, creation_key, user_type
  ) values (
    demo_id, 'demo:DEN-2602', 'Front Range', 'A few days of snow above Denver, then one night back in the city.',
    '2026-02-06'::date, '2026-02-10'::date, 3720.00, 2,
    '["Miami, United States","Denver, United States"]'::json, 'd4100000-de40-4000-8000-00000000000a'::uuid, 'individual'
  ) returning id into new_id;
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'flight', 'United',
      'United 1234 · MIA → DEN', ('2026-02-06'::date + time '12:00') at time zone 'UTC', '2026-02-06'::date, 'MIA', 'DEN', '2 seats',
      'unpaid', 640.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'hotel', 'Lodge, Breckenridge',
      'Lodge, Breckenridge', ('2026-02-06'::date + time '12:00') at time zone 'UTC', '2026-02-06'::date, null, null, '3 nights',
      'unpaid', 1120.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'hotel', 'Hotel, Denver',
      'Hotel, Denver', ('2026-02-09'::date + time '12:00') at time zone 'UTC', '2026-02-09'::date, null, null, '1 night',
      'unpaid', 280.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'restaurant', 'Dining',
      'Dining · Denver and Breckenridge', ('2026-02-06'::date + time '12:00') at time zone 'UTC', '2026-02-06'::date, null, null, null,
      'unpaid', 380.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'activity', 'Ski rental',
      'Ski rental', ('2026-02-07'::date + time '12:00') at time zone 'UTC', '2026-02-07'::date, null, null, '2 people',
      'unpaid', 480.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'car', 'Car rental',
      'Car rental · 4 days', ('2026-02-06'::date + time '12:00') at time zone 'UTC', '2026-02-06'::date, null, null, null,
      'unpaid', 210.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'flight', 'United',
      'United 1235 · DEN → MIA', ('2026-02-10'::date + time '12:00') at time zone 'UTC', '2026-02-10'::date, 'DEN', 'MIA', '2 seats, return',
      'unpaid', 610.00, 'USD'
    );

  insert into public.itinerary (
    userid, itin_id, itin_name, itin_desc, itin_date_start, itin_date_end,
    budget, planned_traveler_count, itin_locations, creation_key, user_type
  ) values (
    demo_id, 'demo:MDE-2603', 'The Medellín Week', 'The group trip — a house in El Poblado and long tables at night.',
    '2026-03-12'::date, '2026-03-19'::date, 13360.00, 6,
    '["Miami, United States","Medellín, Colombia"]'::json, 'd4100000-de40-4000-8000-00000000000b'::uuid, 'individual'
  ) returning id into new_id;
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'flight', 'Avianca',
      'Avianca 240 · MIA → MDE', ('2026-03-12'::date + time '12:00') at time zone 'UTC', '2026-03-12'::date, 'MIA', 'MDE', '6 seats',
      'unpaid', 3120.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'hotel', 'House, El Poblado',
      'House, El Poblado', ('2026-03-12'::date + time '12:00') at time zone 'UTC', '2026-03-12'::date, null, null, '7 nights',
      'unpaid', 4200.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'restaurant', 'Dining',
      'Dining · Medellín', ('2026-03-12'::date + time '12:00') at time zone 'UTC', '2026-03-12'::date, null, null, null,
      'unpaid', 1680.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'activity', 'Coffee region day',
      'Coffee region day', ('2026-03-15'::date + time '12:00') at time zone 'UTC', '2026-03-15'::date, null, null, '6 places',
      'unpaid', 960.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'car', 'Van and airport transfers',
      'Van and airport transfers', ('2026-03-12'::date + time '12:00') at time zone 'UTC', '2026-03-12'::date, null, null, null,
      'unpaid', 540.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'flight', 'Avianca',
      'Avianca 241 · MDE → MIA', ('2026-03-19'::date + time '12:00') at time zone 'UTC', '2026-03-19'::date, 'MDE', 'MIA', '6 seats, return',
      'unpaid', 2860.00, 'USD'
    );

  insert into public.itinerary (
    userid, itin_id, itin_name, itin_desc, itin_date_start, itin_date_end,
    budget, planned_traveler_count, itin_locations, creation_key, user_type
  ) values (
    demo_id, 'demo:LIR-2606', 'Pacific Costa Rica', 'A beach week at the scale of a villa, with one jungle day.',
    '2026-06-04'::date, '2026-06-14'::date, 11710.00, 4,
    '["Miami, United States","Guanacaste, Costa Rica"]'::json, 'd4100000-de40-4000-8000-00000000000c'::uuid, 'individual'
  ) returning id into new_id;
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'flight', 'American',
      'American 1120 · MIA → LIR', ('2026-06-04'::date + time '12:00') at time zone 'UTC', '2026-06-04'::date, 'MIA', 'LIR', '4 seats',
      'unpaid', 1860.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'hotel', 'Villa, Guanacaste',
      'Villa, Guanacaste', ('2026-06-04'::date + time '12:00') at time zone 'UTC', '2026-06-04'::date, null, null, '10 nights',
      'unpaid', 5400.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'restaurant', 'Dining',
      'Dining · Costa Rica', ('2026-06-04'::date + time '12:00') at time zone 'UTC', '2026-06-04'::date, null, null, null,
      'unpaid', 1320.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'activity', 'Jungle and boat day',
      'Jungle and boat day', ('2026-06-07'::date + time '12:00') at time zone 'UTC', '2026-06-07'::date, null, null, '4 places',
      'unpaid', 980.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'car', 'Transfers and a rental car',
      'Transfers and a rental car', ('2026-06-04'::date + time '12:00') at time zone 'UTC', '2026-06-04'::date, null, null, null,
      'unpaid', 410.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'flight', 'American',
      'American 1121 · LIR → MIA', ('2026-06-14'::date + time '12:00') at time zone 'UTC', '2026-06-14'::date, 'LIR', 'MIA', '4 seats, return',
      'unpaid', 1740.00, 'USD'
    );

  insert into public.itinerary (
    userid, itin_id, itin_name, itin_desc, itin_date_start, itin_date_end,
    budget, planned_traveler_count, itin_locations, creation_key, user_type
  ) values (
    demo_id, 'demo:FCO-2609', 'Slow Italy', 'Unhurried days: Rome first, then the coast.',
    '2026-09-02'::date, '2026-09-12'::date, 9740.00, 2,
    '["Miami, United States","Rome, Italy","Amalfi, Italy"]'::json, 'd4100000-de40-4000-8000-00000000000d'::uuid, 'individual'
  ) returning id into new_id;
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'flight', 'ITA',
      'ITA 906 · MIA → FCO', ('2026-09-02'::date + time '12:00') at time zone 'UTC', '2026-09-02'::date, 'MIA', 'FCO', '2 seats',
      'unpaid', 1540.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'hotel', 'Hotel, Rome',
      'Hotel, Rome', ('2026-09-02'::date + time '12:00') at time zone 'UTC', '2026-09-02'::date, null, null, '4 nights',
      'unpaid', 2200.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'car', 'Train, Rome to Naples',
      'Train, Rome to Naples', ('2026-09-06'::date + time '12:00') at time zone 'UTC', '2026-09-06'::date, null, null, null,
      'unpaid', 180.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'hotel', 'Hotel, Amalfi',
      'Hotel, Amalfi', ('2026-09-06'::date + time '12:00') at time zone 'UTC', '2026-09-06'::date, null, null, '6 nights',
      'unpaid', 2600.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'restaurant', 'Dining',
      'Dining · Rome and Amalfi', ('2026-09-02'::date + time '12:00') at time zone 'UTC', '2026-09-02'::date, null, null, null,
      'unpaid', 1100.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'activity', 'Walking tour, Centro Storico',
      'Walking tour, Centro Storico', ('2026-09-03'::date + time '12:00') at time zone 'UTC', '2026-09-03'::date, null, null, '2 places',
      'unpaid', 220.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'activity', 'Boat, Capri',
      'Boat, Capri', ('2026-09-08'::date + time '12:00') at time zone 'UTC', '2026-09-08'::date, null, null, '2 places',
      'unpaid', 420.00, 'USD'
    );
    insert into public.trip_external_bookings (
      itinerary_id, created_by, updated_by, record_status, category, provider_name,
      booking_title, start_at, service_date, origin, destination, notes,
      payment_status, total_amount, currency
    ) values (
      new_id, demo_id, demo_id, 'active', 'flight', 'ITA',
      'ITA 907 · FCO → MIA', ('2026-09-12'::date + time '12:00') at time zone 'UTC', '2026-09-12'::date, 'FCO', 'MIA', '2 seats, return',
      'unpaid', 1480.00, 'USD'
    );

  inserted_count := 13;

  if disabled_limit then
    alter table public.itinerary enable trigger enforce_itinerary_limit;
  end if;
  if disabled_usage then
    alter table public.itinerary enable trigger record_trip_created;
  end if;

  raise notice 'demo itinerary seed: replaced % demo itineraries for info@taai.travel. No other account was modified.', inserted_count;
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
