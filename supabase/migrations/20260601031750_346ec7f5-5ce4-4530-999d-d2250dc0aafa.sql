
-- saved_travelers
CREATE TABLE public.saved_travelers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  label text,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text,
  phone text,
  dob date,
  gender text,
  nationality text,
  passport_number text,
  passport_expiry date,
  frequent_flyer jsonb DEFAULT '{}'::jsonb,
  is_self boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_travelers TO authenticated;
GRANT ALL ON public.saved_travelers TO service_role;
ALTER TABLE public.saved_travelers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own saved travelers" ON public.saved_travelers FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users insert own saved travelers" ON public.saved_travelers FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own saved travelers" ON public.saved_travelers FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users delete own saved travelers" ON public.saved_travelers FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE INDEX idx_saved_travelers_user ON public.saved_travelers(user_id);
CREATE TRIGGER trg_saved_travelers_updated BEFORE UPDATE ON public.saved_travelers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- user_booking_preferences
CREATE TABLE public.user_booking_preferences (
  user_id uuid NOT NULL PRIMARY KEY,
  preferred_room_type text,
  preferred_bed text,
  preferred_seat text,
  preferred_meal text,
  preferred_cabin_class text,
  last_traveler_doc_used uuid,
  default_payer_mode text NOT NULL DEFAULT 'single_payer',
  preferred_currency text NOT NULL DEFAULT 'USD',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_booking_preferences TO authenticated;
GRANT ALL ON public.user_booking_preferences TO service_role;
ALTER TABLE public.user_booking_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own booking prefs" ON public.user_booking_preferences FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users insert own booking prefs" ON public.user_booking_preferences FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own booking prefs" ON public.user_booking_preferences FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Service manages booking prefs" ON public.user_booking_preferences FOR ALL TO public USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE TRIGGER trg_user_booking_preferences_updated BEFORE UPDATE ON public.user_booking_preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- booking_receipts
CREATE TABLE public.booking_receipts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  booking_id uuid,
  quote_id uuid,
  stripe_session_id text,
  receipt_number text NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  total numeric NOT NULL DEFAULT 0,
  receipt_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  pdf_path text,
  sent_to text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.booking_receipts TO authenticated;
GRANT ALL ON public.booking_receipts TO service_role;
ALTER TABLE public.booking_receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own receipts" ON public.booking_receipts FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Service manages receipts" ON public.booking_receipts FOR ALL TO public USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE INDEX idx_booking_receipts_user ON public.booking_receipts(user_id);

-- trip_balances_ledger
CREATE TABLE public.trip_balances_ledger (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  itinerary_id bigint NOT NULL,
  payer_user_id uuid NOT NULL,
  debtor_user_id uuid,
  debtor_label text,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  source_receipt_id uuid,
  source_cart_item_id uuid,
  status text NOT NULL DEFAULT 'open',
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.trip_balances_ledger TO authenticated;
GRANT ALL ON public.trip_balances_ledger TO service_role;
ALTER TABLE public.trip_balances_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Attendees view ledger" ON public.trip_balances_ledger FOR SELECT TO authenticated USING (public.is_itinerary_attendee(itinerary_id, auth.uid()));
CREATE POLICY "Parties update ledger" ON public.trip_balances_ledger FOR UPDATE TO authenticated USING (auth.uid() = payer_user_id OR auth.uid() = debtor_user_id);
CREATE POLICY "Service manages ledger" ON public.trip_balances_ledger FOR ALL TO public USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE INDEX idx_trip_balances_itin ON public.trip_balances_ledger(itinerary_id);
CREATE TRIGGER trg_trip_balances_updated BEFORE UPDATE ON public.trip_balances_ledger FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Private storage bucket for receipts
INSERT INTO storage.buckets (id, name, public) VALUES ('receipts', 'receipts', false) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "Users read own receipt files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Service writes receipt files" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'receipts' AND auth.role() = 'service_role');
CREATE POLICY "Service updates receipt files" ON storage.objects FOR UPDATE TO public USING (bucket_id = 'receipts' AND auth.role() = 'service_role');
