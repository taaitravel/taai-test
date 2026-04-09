
-- Booking intents: tracks every user interaction from discovery to purchase intent
CREATE TABLE public.booking_intents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  event_type text NOT NULL, -- 'view', 'add_to_cart', 'add_to_itinerary', 'checkout_start', 'booking_complete'
  provider text NOT NULL, -- 'booking_com', 'amadeus', 'getyourguide', 'viator', 'expedia', 'yelp'
  item_type text NOT NULL, -- 'hotel', 'flight', 'activity', 'restaurant', 'package'
  item_id text, -- provider-specific item ID
  item_data jsonb NOT NULL DEFAULT '{}'::jsonb, -- full snapshot of search result
  price_snapshot numeric, -- price at time of intent
  currency text DEFAULT 'USD',
  guest_details jsonb, -- guest count, names, etc.
  service_dates jsonb, -- check-in/check-out, departure, etc.
  itinerary_id bigint REFERENCES public.itinerary(id) ON DELETE SET NULL,
  cart_item_id uuid REFERENCES public.cart_items(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.booking_intents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own booking intents"
  ON public.booking_intents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own booking intents"
  ON public.booking_intents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all booking intents"
  ON public.booking_intents FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_booking_intents_user ON public.booking_intents(user_id);
CREATE INDEX idx_booking_intents_type ON public.booking_intents(event_type);
CREATE INDEX idx_booking_intents_provider ON public.booking_intents(provider);

-- Booking completions: confirmed bookings with financial breakdown
CREATE TABLE public.booking_completions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  booking_intent_id uuid REFERENCES public.booking_intents(id),
  provider text NOT NULL,
  provider_confirmation_code text,
  item_type text NOT NULL,
  item_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  guest_details jsonb,
  service_start_date date,
  service_end_date date,
  provider_cost numeric NOT NULL DEFAULT 0,
  taai_service_fee numeric NOT NULL DEFAULT 0,
  taai_commission numeric DEFAULT 0, -- affiliate commission from provider
  tax_amount numeric NOT NULL DEFAULT 0,
  stripe_fee numeric DEFAULT 0,
  total_charged numeric NOT NULL DEFAULT 0,
  net_revenue numeric DEFAULT 0,
  currency text DEFAULT 'USD',
  stripe_payment_intent_id text,
  stripe_session_id text,
  provider_contact jsonb, -- { phone, email, website }
  status text NOT NULL DEFAULT 'confirmed', -- confirmed, cancelled, refunded, change_requested
  receipt_url text,
  change_requests jsonb DEFAULT '[]'::jsonb,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.booking_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can insert booking completions"
  ON public.booking_completions FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Users can view their own booking completions"
  ON public.booking_completions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can update booking completions"
  ON public.booking_completions FOR UPDATE
  USING (auth.role() = 'service_role');

CREATE POLICY "Admins can view all booking completions"
  ON public.booking_completions FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_booking_completions_user ON public.booking_completions(user_id);
CREATE INDEX idx_booking_completions_status ON public.booking_completions(status);

-- Financial ledger: double-entry tracking
CREATE TABLE public.financial_ledger (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_completion_id uuid REFERENCES public.booking_completions(id),
  entry_type text NOT NULL, -- 'charge', 'service_fee', 'affiliate_commission', 'stripe_fee', 'refund', 'payout'
  amount numeric NOT NULL,
  currency text DEFAULT 'USD',
  description text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.financial_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can insert ledger entries"
  ON public.financial_ledger FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Admins can view all ledger entries"
  ON public.financial_ledger FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_financial_ledger_booking ON public.financial_ledger(booking_completion_id);
CREATE INDEX idx_financial_ledger_type ON public.financial_ledger(entry_type);

-- Add booking_status to cart_items
ALTER TABLE public.cart_items ADD COLUMN IF NOT EXISTS booking_status text NOT NULL DEFAULT 'browsing';

-- Trigger to update booking_completions updated_at
CREATE OR REPLACE FUNCTION public.update_booking_completions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_booking_completions_updated_at
  BEFORE UPDATE ON public.booking_completions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_booking_completions_updated_at();
