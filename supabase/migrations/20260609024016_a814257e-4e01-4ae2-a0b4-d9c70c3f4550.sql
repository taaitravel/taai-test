
CREATE TABLE IF NOT EXISTS public.quote_reprice_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES public.booking_quotes(id) ON DELETE CASCADE,
  cart_item_id uuid,
  user_id uuid NOT NULL,
  old_price numeric NOT NULL DEFAULT 0,
  new_price numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'available',
  reason text,
  inputs jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS quote_reprice_events_quote_idx ON public.quote_reprice_events(quote_id);
CREATE INDEX IF NOT EXISTS quote_reprice_events_user_idx ON public.quote_reprice_events(user_id);

GRANT SELECT ON public.quote_reprice_events TO authenticated;
GRANT ALL ON public.quote_reprice_events TO service_role;

ALTER TABLE public.quote_reprice_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own reprice events"
  ON public.quote_reprice_events FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
