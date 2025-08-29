-- Drop the dangerous subscription policy that allows anyone to insert
DROP POLICY IF EXISTS "Anyone can insert subscription (for edge functions)" ON public.subscribers;

-- Create secure policy that only allows service role to insert subscriptions
-- This ensures only legitimate subscription management edge functions can create records
CREATE POLICY "Service role can insert subscriptions" ON public.subscribers
FOR INSERT 
WITH CHECK (auth.role() = 'service_role');

-- Keep existing secure policies for users to read/update their own subscriptions
-- These are already properly secured with user_id/email checks

-- Add explicit blocking policy to prevent regular users from inserting subscriptions
CREATE POLICY "Block user subscription creation" ON public.subscribers
FOR INSERT
TO authenticated
WITH CHECK (false);

-- Also add a policy to prevent unauthorized access to subscription creation
CREATE POLICY "Block anonymous subscription creation" ON public.subscribers
FOR INSERT
TO anon
WITH CHECK (false);