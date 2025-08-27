-- Fix handle_new_user_to_users function to prevent database errors during user creation
CREATE OR REPLACE FUNCTION public.handle_new_user_to_users()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $function$
BEGIN
  -- Insert into public.users table with proper error handling
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
    terms_version
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
    COALESCE(NEW.raw_user_meta_data ->> 'terms_version', '1.0')
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
    terms_version = COALESCE(EXCLUDED.terms_version, users.terms_version);

  RETURN NEW;
EXCEPTION 
  WHEN OTHERS THEN
    -- Log the error but don't fail the auth signup process
    RAISE WARNING 'Error creating user profile: %', SQLERRM;
    RETURN NEW;
END;
$function$;

-- Ensure the trigger exists and is properly configured
DROP TRIGGER IF EXISTS on_auth_user_created_to_users ON auth.users;
CREATE TRIGGER on_auth_user_created_to_users
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user_to_users();