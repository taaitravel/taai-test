-- Drop the overly permissive payment policies
DROP POLICY IF EXISTS "Anyone can insert payments (for edge functions)" ON public.payments;
DROP POLICY IF EXISTS "Edge functions can update payments" ON public.payments;

-- Create secure policies that only allow service role (edge functions) to insert/update
-- This ensures only legitimate payment processing edge functions can manipulate payment data

-- Allow only service role to insert payments (edge functions using service role key)
CREATE POLICY "Service role can insert payments" ON public.payments
FOR INSERT 
WITH CHECK (auth.role() = 'service_role');

-- Allow only service role to update payments (edge functions using service role key)  
CREATE POLICY "Service role can update payments" ON public.payments
FOR UPDATE
USING (auth.role() = 'service_role');

-- Keep the existing user read policy (users can view their own payments)
-- This policy already exists and is secure: "Users can view their own payments"

-- Add a safety policy to prevent regular users from any insert/update operations
CREATE POLICY "Block user payment manipulation" ON public.payments
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);