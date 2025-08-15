-- Fix database functions search path vulnerabilities
-- Update all functions to have proper immutable search path

-- First fix the has_role function to be more secure
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$function$;

-- Update handle_new_user function with proper search path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
  INSERT INTO public.users (
    userid,
    email,
    first_name,
    last_name,
    username,
    comp_name,
    address,
    cell,
    user_type
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
    COALESCE(NEW.raw_user_meta_data ->> 'user_type', 'individual')
  );
  RETURN NEW;
END;
$function$;

-- Update handle_new_user_to_users function with proper search path  
CREATE OR REPLACE FUNCTION public.handle_new_user_to_users()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
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
    coalesce(new.raw_user_meta_data ->> 'user_type', 'individual'),
    coalesce(new.raw_user_meta_data ->> 'comp_name', new.raw_user_meta_data ->> 'company_name'),
    coalesce(new.raw_user_meta_data ->> 'address', new.raw_user_meta_data ->> 'registered_address'),
    coalesce(new.raw_user_meta_data ->> 'city', null),
    coalesce(new.raw_user_meta_data ->> 'state', null),
    coalesce(new.raw_user_meta_data ->> 'zip', null),
    coalesce(new.raw_user_meta_data ->> 'country', null),
    coalesce(new.raw_user_meta_data ->> 'cell', new.raw_user_meta_data ->> 'phone'),
    coalesce(new.raw_user_meta_data ->> 'terms_version', '1.0')
  )
  on conflict (userid) do nothing;

  return new;
end;
$function$;