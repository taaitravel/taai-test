
-- 1. cart_items: provider tracking + reprice metadata
ALTER TABLE public.cart_items
  ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS external_id text,
  ADD COLUMN IF NOT EXISTS rate_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_repriced_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_price numeric,
  ADD COLUMN IF NOT EXISTS provider_ref jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_cart_items_provider ON public.cart_items(provider);
CREATE INDEX IF NOT EXISTS idx_cart_items_external_id ON public.cart_items(external_id);

-- 2. booking_quotes: signed validated cart snapshot consumed by Stripe checkout
CREATE TABLE IF NOT EXISTS public.booking_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  itinerary_id bigint,
  items jsonb NOT NULL,
  diffs jsonb NOT NULL DEFAULT '[]'::jsonb,
  provider_total numeric NOT NULL,
  taxes_and_fees numeric NOT NULL,
  total numeric NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'active',
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  stripe_session_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.booking_quotes TO authenticated;
GRANT ALL ON public.booking_quotes TO service_role;

ALTER TABLE public.booking_quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own quotes"
  ON public.booking_quotes FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Service role manages booking quotes"
  ON public.booking_quotes FOR ALL TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE TRIGGER trg_booking_quotes_updated_at
  BEFORE UPDATE ON public.booking_quotes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_booking_quotes_user ON public.booking_quotes(user_id);
CREATE INDEX IF NOT EXISTS idx_booking_quotes_session ON public.booking_quotes(stripe_session_id);

-- 3. booking_attempts: audit of every provider call
CREATE TABLE IF NOT EXISTS public.booking_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  cart_item_id uuid,
  quote_id uuid,
  itinerary_id bigint,
  provider text NOT NULL,
  phase text NOT NULL,
  request jsonb,
  response jsonb,
  success boolean NOT NULL DEFAULT false,
  external_booking_ref text,
  error_code text,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.booking_attempts TO authenticated;
GRANT ALL ON public.booking_attempts TO service_role;

ALTER TABLE public.booking_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own booking attempts"
  ON public.booking_attempts FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Service role writes booking attempts"
  ON public.booking_attempts FOR ALL TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_booking_attempts_user ON public.booking_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_booking_attempts_cart_item ON public.booking_attempts(cart_item_id);
CREATE INDEX IF NOT EXISTS idx_booking_attempts_quote ON public.booking_attempts(quote_id);

-- 4. bookings: provider-level columns
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS provider text,
  ADD COLUMN IF NOT EXISTS provider_booking_ref text,
  ADD COLUMN IF NOT EXISTS supplier_charge numeric,
  ADD COLUMN IF NOT EXISTS commission numeric,
  ADD COLUMN IF NOT EXISTS cancellation_policy jsonb,
  ADD COLUMN IF NOT EXISTS voucher_url text;

CREATE INDEX IF NOT EXISTS idx_bookings_provider ON public.bookings(provider);
