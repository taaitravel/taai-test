-- Signup attribution columns on the profile row created at registration.
-- Nullable so existing users stay valid. RLS policies are unchanged; the new
-- columns inherit the existing public.users policies.
--
-- The signup writer below is the latest definition from
-- 20250827001140_f00a7252-9acb-4508-800c-2e8c799ce239.sql
-- (public.handle_new_user_to_users, attached to on_auth_user_created_to_users).
-- public.handle_new_user was last replaced in 20250815003209 and may still be
-- attached to on_auth_user_created, so it copies the same metadata too.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS utm_source text,
  ADD COLUMN IF NOT EXISTS utm_medium text,
  ADD COLUMN IF NOT EXISTS utm_campaign text,
  ADD COLUMN IF NOT EXISTS utm_content text,
  ADD COLUMN IF NOT EXISTS utm_term text,
  ADD COLUMN IF NOT EXISTS signup_referrer text,
  ADD COLUMN IF NOT EXISTS landing_path text,
  ADD COLUMN IF NOT EXISTS first_touch_at timestamptz;

CREATE OR REPLACE FUNCTION public.handle_new_user_to_users()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $function$
DECLARE
  v_first_touch timestamptz;
BEGIN
  BEGIN
    v_first_touch := NULLIF(BTRIM(NEW.raw_user_meta_data ->> 'first_touch_at'), '')::timestamptz;
  EXCEPTION
    WHEN OTHERS THEN
      v_first_touch := NULL;
  END;

  INSERT INTO public.users (
    userid,
    email,
    first_name,
    last_name,
    username,
    user_type,
    comp_name,
    address,
    city,
    state,
    zip,
    country,
    cell,
    terms_version,
    utm_source,
    utm_medium,
    utm_campaign,
    utm_content,
    utm_term,
    signup_referrer,
    landing_path,
    first_touch_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', NEW.raw_user_meta_data ->> 'firstName'),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', NEW.raw_user_meta_data ->> 'lastName'),
    COALESCE(NEW.raw_user_meta_data ->> 'username', NEW.raw_user_meta_data ->> 'userName'),
    COALESCE(NEW.raw_user_meta_data ->> 'user_type', 'individual'),
    COALESCE(NEW.raw_user_meta_data ->> 'comp_name', NEW.raw_user_meta_data ->> 'company_name', NEW.raw_user_meta_data ->> 'companyName'),
    COALESCE(NEW.raw_user_meta_data ->> 'address', NEW.raw_user_meta_data ->> 'registered_address', NEW.raw_user_meta_data ->> 'registeredAddress'),
    COALESCE(NEW.raw_user_meta_data ->> 'city'),
    COALESCE(NEW.raw_user_meta_data ->> 'state'),
    COALESCE(NEW.raw_user_meta_data ->> 'zip'),
    COALESCE(NEW.raw_user_meta_data ->> 'country'),
    COALESCE(NEW.raw_user_meta_data ->> 'cell', NEW.raw_user_meta_data ->> 'phone'),
    COALESCE(NEW.raw_user_meta_data ->> 'terms_version', '1.0'),
    NULLIF(BTRIM(NEW.raw_user_meta_data ->> 'utm_source'), ''),
    NULLIF(BTRIM(NEW.raw_user_meta_data ->> 'utm_medium'), ''),
    NULLIF(BTRIM(NEW.raw_user_meta_data ->> 'utm_campaign'), ''),
    NULLIF(BTRIM(NEW.raw_user_meta_data ->> 'utm_content'), ''),
    NULLIF(BTRIM(NEW.raw_user_meta_data ->> 'utm_term'), ''),
    NULLIF(BTRIM(NEW.raw_user_meta_data ->> 'signup_referrer'), ''),
    NULLIF(BTRIM(NEW.raw_user_meta_data ->> 'landing_path'), ''),
    v_first_touch
  )
  ON CONFLICT (userid) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = COALESCE(EXCLUDED.first_name, users.first_name),
    last_name = COALESCE(EXCLUDED.last_name, users.last_name),
    username = COALESCE(EXCLUDED.username, users.username),
    user_type = COALESCE(EXCLUDED.user_type, users.user_type),
    comp_name = COALESCE(EXCLUDED.comp_name, users.comp_name),
    address = COALESCE(EXCLUDED.address, users.address),
    city = COALESCE(EXCLUDED.city, users.city),
    state = COALESCE(EXCLUDED.state, users.state),
    zip = COALESCE(EXCLUDED.zip, users.zip),
    country = COALESCE(EXCLUDED.country, users.country),
    cell = COALESCE(EXCLUDED.cell, users.cell),
    terms_version = COALESCE(EXCLUDED.terms_version, users.terms_version),
    utm_source = COALESCE(users.utm_source, EXCLUDED.utm_source),
    utm_medium = COALESCE(users.utm_medium, EXCLUDED.utm_medium),
    utm_campaign = COALESCE(users.utm_campaign, EXCLUDED.utm_campaign),
    utm_content = COALESCE(users.utm_content, EXCLUDED.utm_content),
    utm_term = COALESCE(users.utm_term, EXCLUDED.utm_term),
    signup_referrer = COALESCE(users.signup_referrer, EXCLUDED.signup_referrer),
    landing_path = COALESCE(users.landing_path, EXCLUDED.landing_path),
    first_touch_at = COALESCE(users.first_touch_at, EXCLUDED.first_touch_at);

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error creating user profile: %', SQLERRM;
    RETURN NEW;
END;
$function$;

-- Same metadata copy for the earlier signup trigger, without changing its
-- existing column mapping or conflict behavior (plain insert).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_first_touch timestamptz;
BEGIN
  BEGIN
    v_first_touch := NULLIF(BTRIM(NEW.raw_user_meta_data ->> 'first_touch_at'), '')::timestamptz;
  EXCEPTION
    WHEN OTHERS THEN
      v_first_touch := NULL;
  END;

  INSERT INTO public.users (
    userid,
    email,
    first_name,
    last_name,
    username,
    comp_name,
    address,
    cell,
    user_type,
    utm_source,
    utm_medium,
    utm_campaign,
    utm_content,
    utm_term,
    signup_referrer,
    landing_path,
    first_touch_at
  ) VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    NEW.raw_user_meta_data ->> 'username',
    NEW.raw_user_meta_data ->> 'company_name',
    NEW.raw_user_meta_data ->> 'registered_address',
    CASE
      WHEN NEW.raw_user_meta_data ->> 'phone' IS NOT NULL
      THEN (NEW.raw_user_meta_data ->> 'phone')::BIGINT
      ELSE NULL
    END,
    COALESCE(NEW.raw_user_meta_data ->> 'user_type', 'individual'),
    NULLIF(BTRIM(NEW.raw_user_meta_data ->> 'utm_source'), ''),
    NULLIF(BTRIM(NEW.raw_user_meta_data ->> 'utm_medium'), ''),
    NULLIF(BTRIM(NEW.raw_user_meta_data ->> 'utm_campaign'), ''),
    NULLIF(BTRIM(NEW.raw_user_meta_data ->> 'utm_content'), ''),
    NULLIF(BTRIM(NEW.raw_user_meta_data ->> 'utm_term'), ''),
    NULLIF(BTRIM(NEW.raw_user_meta_data ->> 'signup_referrer'), ''),
    NULLIF(BTRIM(NEW.raw_user_meta_data ->> 'landing_path'), ''),
    v_first_touch
  );
  RETURN NEW;
END;
$function$;
