-- Fix Function Search Path Security Issues
-- Update all functions to use secure search_path

CREATE OR REPLACE FUNCTION public.update_contact_inquiries_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_country_coordinates_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
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
 SET search_path TO ''
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
 SET search_path TO ''
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
 SET search_path TO ''
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
 SET search_path TO ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.sync_itinerary_to_budget_breakdown()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
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

CREATE OR REPLACE FUNCTION public.initialize_budget_breakdown()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
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