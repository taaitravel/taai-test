-- Security Hardening Migration (Fixed)
-- Fix 1: Make user_id columns NOT NULL where they should be
ALTER TABLE quotes ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE payments ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE cart_items ALTER COLUMN user_id SET NOT NULL;

-- Fix 2: Remove email matching from subscribers RLS policy
DROP POLICY IF EXISTS "Users can view their own subscription" ON subscribers;
CREATE POLICY "Users can view their own subscription" 
ON subscribers FOR SELECT 
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own subscription" ON subscribers;
CREATE POLICY "Users can update their own subscription" 
ON subscribers FOR UPDATE 
USING (user_id = auth.uid());

-- Fix 3: Fix SECURITY DEFINER functions to have fixed search_path
ALTER FUNCTION public.update_expedia_bookings_updated_at() SET search_path = 'public', 'pg_temp';
ALTER FUNCTION public.log_booking_changes() SET search_path = 'public', 'pg_temp';
ALTER FUNCTION public.update_subscribers_updated_at() SET search_path = 'public', 'pg_temp';
ALTER FUNCTION public.initialize_user_subscription() SET search_path = 'public', 'pg_temp';
ALTER FUNCTION public.update_country_coordinates_updated_at() SET search_path = 'public', 'pg_temp';
ALTER FUNCTION public.update_quotes_updated_at() SET search_path = 'public', 'pg_temp';
ALTER FUNCTION public.update_contact_inquiries_updated_at() SET search_path = 'public', 'pg_temp';
ALTER FUNCTION public.update_itinerary_budget_breakdown_updated_at() SET search_path = 'public', 'pg_temp';
ALTER FUNCTION public.update_bookings_updated_at() SET search_path = 'public', 'pg_temp';
ALTER FUNCTION public.update_cart_items_updated_at() SET search_path = 'public', 'pg_temp';
ALTER FUNCTION public.initialize_budget_breakdown() SET search_path = 'public', 'pg_temp';
ALTER FUNCTION public.sync_itinerary_to_budget_breakdown() SET search_path = 'public', 'pg_temp';