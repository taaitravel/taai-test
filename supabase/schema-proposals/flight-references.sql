-- PROPOSED, NOT APPLIED — awaiting Marco's approval before it is run.
-- Purpose: store reference-only flight observations captured from provider test mode.
-- These are planning references, NOT bookings and NOT cart items: no totals,
-- no booking status, no payment linkage.
--
-- The existing public.cart_items table cannot hold these records: it is a
-- commerce cart (price, booking_status, provider_ref, rate_expires_at,
-- last_repriced_at) and every row participates in checkout totals. A
-- reference-only flight observation must never enter that path.

CREATE TABLE IF NOT EXISTS public.flight_references (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Canonical itinerary relationship: public.itinerary.id is a bigint identity.
  itinerary_id bigint NOT NULL REFERENCES public.itinerary(id) ON DELETE CASCADE,
  provider text NOT NULL,
  provider_offer_id text NOT NULL,
  -- v0.1 is reference-only by construction. 'live', 'bookable' and
  -- 'outbound_link' are intentionally NOT permitted; widening these checks is a
  -- separate, explicitly approved migration.
  mode text NOT NULL DEFAULT 'test' CHECK (mode = 'test'),
  evidence_grade text NOT NULL DEFAULT 'provider_test' CHECK (evidence_grade = 'provider_test'),
  commerce_capability text NOT NULL DEFAULT 'reference_only'
    CHECK (commerce_capability = 'reference_only'),
  origin_iata text NOT NULL,
  destination_iata text NOT NULL,
  cabin_class text,
  passenger_count integer NOT NULL DEFAULT 1 CHECK (passenger_count >= 1),
  stop_count integer NOT NULL DEFAULT 0 CHECK (stop_count >= 0),
  total_duration_minutes integer,
  observed_amount numeric(12,2) NOT NULL,
  observed_currency text NOT NULL,
  observed_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  slices jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS flight_references_itinerary_idx
  ON public.flight_references (itinerary_id);
CREATE INDEX IF NOT EXISTS flight_references_user_idx
  ON public.flight_references (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS flight_references_unique_offer_per_itinerary
  ON public.flight_references (itinerary_id, provider, provider_offer_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.flight_references TO authenticated;
GRANT ALL ON public.flight_references TO service_role;

ALTER TABLE public.flight_references ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read their own flight references"
  ON public.flight_references FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert their own flight references"
  ON public.flight_references FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update their own flight references"
  ON public.flight_references FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete their own flight references"
  ON public.flight_references FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Collaborator access is deliberately NOT granted here. Whether itinerary
-- collaborators may read or edit another member's flight references is an open
-- product decision; owner-only policies stay in force until it is decided.
--
-- Application flag FLIGHT_REFERENCE_TABLE_READY stays false until this file is
-- approved and applied.
