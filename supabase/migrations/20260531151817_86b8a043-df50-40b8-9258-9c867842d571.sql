CREATE TABLE public.quote_travelers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id uuid NOT NULL,
  cart_item_id uuid NOT NULL,
  user_id uuid NOT NULL,
  item_type text NOT NULL,
  traveler_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (quote_id, cart_item_id)
);

CREATE INDEX idx_quote_travelers_quote ON public.quote_travelers(quote_id);
CREATE INDEX idx_quote_travelers_user ON public.quote_travelers(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.quote_travelers TO authenticated;
GRANT ALL ON public.quote_travelers TO service_role;

ALTER TABLE public.quote_travelers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their own travelers"
  ON public.quote_travelers FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users insert their own travelers"
  ON public.quote_travelers FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.booking_quotes q
      WHERE q.id = quote_id AND q.user_id = auth.uid()
    )
  );

CREATE POLICY "Users update their own travelers"
  ON public.quote_travelers FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users delete their own travelers"
  ON public.quote_travelers FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Service role manages travelers"
  ON public.quote_travelers FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE TRIGGER update_quote_travelers_updated_at
  BEFORE UPDATE ON public.quote_travelers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();