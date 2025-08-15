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

-- Add RLS policy to prevent users from updating their own user_type field
CREATE POLICY "Users cannot update their own user_type" 
ON public.users 
FOR UPDATE 
USING (auth.uid() = userid)
WITH CHECK (
  CASE 
    WHEN OLD.user_type IS DISTINCT FROM NEW.user_type 
    THEN false 
    ELSE true 
  END
);

-- Update other trigger functions with proper search path
CREATE OR REPLACE FUNCTION public.update_country_coordinates_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_quotes_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_contact_inquiries_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_itinerary_budget_breakdown_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_bookings_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_cart_items_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.initialize_budget_breakdown()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
    -- Insert default categories with zero amounts
    INSERT INTO public.itinerary_budget_breakdown (itinerary_id, category, budgeted_amount, spent_amount)
    VALUES 
        (NEW.id, 'Flights', COALESCE(NEW.budget, 0) * 0.25, 0),
        (NEW.id, 'Accommodation', COALESCE(NEW.budget, 0) * 0.30, 0),
        (NEW.id, 'Activities', COALESCE(NEW.budget, 0) * 0.20, 0),
        (NEW.id, 'Dining', COALESCE(NEW.budget, 0) * 0.15, 0),
        (NEW.id, 'Transportation', COALESCE(NEW.budget, 0) * 0.10, 0),
        (NEW.id, 'Shopping', 0, 0),
        (NEW.id, 'Miscellaneous', 0, 0)
    ON CONFLICT (itinerary_id, category) DO NOTHING;
    
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.sync_itinerary_to_budget_breakdown()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
    flight_total NUMERIC := 0;
    hotel_total NUMERIC := 0;
    activity_total NUMERIC := 0;
BEGIN
    -- Calculate totals from JSON data
    IF NEW.flights IS NOT NULL THEN
        SELECT COALESCE(SUM((flight_data->>'cost')::numeric), 0) INTO flight_total
        FROM json_array_elements(NEW.flights) AS flight_data;
    END IF;
    
    IF NEW.hotels IS NOT NULL THEN
        SELECT COALESCE(SUM((hotel_data->>'cost')::numeric), 0) INTO hotel_total
        FROM json_array_elements(NEW.hotels) AS hotel_data;
    END IF;
    
    IF NEW.activities IS NOT NULL THEN
        SELECT COALESCE(SUM((activity_data->>'cost')::numeric), 0) INTO activity_total
        FROM json_array_elements(NEW.activities) AS activity_data;
    END IF;
    
    -- Update budget breakdown for flights
    INSERT INTO public.itinerary_budget_breakdown (itinerary_id, category, budgeted_amount, spent_amount)
    VALUES (NEW.id, 'Flights', flight_total, flight_total)
    ON CONFLICT (itinerary_id, category) 
    DO UPDATE SET 
        spent_amount = flight_total,
        updated_at = now();
    
    -- Update budget breakdown for accommodation
    INSERT INTO public.itinerary_budget_breakdown (itinerary_id, category, budgeted_amount, spent_amount)
    VALUES (NEW.id, 'Accommodation', hotel_total, hotel_total)
    ON CONFLICT (itinerary_id, category) 
    DO UPDATE SET 
        spent_amount = hotel_total,
        updated_at = now();
    
    -- Update budget breakdown for activities
    INSERT INTO public.itinerary_budget_breakdown (itinerary_id, category, budgeted_amount, spent_amount)
    VALUES (NEW.id, 'Activities', activity_total, activity_total)
    ON CONFLICT (itinerary_id, category) 
    DO UPDATE SET 
        spent_amount = activity_total,
        updated_at = now();
    
    RETURN NEW;
END;
$function$;