-- Gate R1-B: manual external booking centralization
-- Creates one dedicated table for traveler-entered bookings made outside taai.
-- This migration is intentionally not applied by this slice.

CREATE TABLE public.trip_external_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_id bigint NOT NULL REFERENCES public.itinerary(id) ON DELETE RESTRICT,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  updated_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source text NOT NULL DEFAULT 'external_manual' CHECK (source = 'external_manual'),
  record_status text NOT NULL DEFAULT 'needs_details' CHECK (record_status IN ('active', 'needs_details', 'archived')),
  category text NOT NULL CHECK (category IN ('flight', 'hotel', 'car', 'activity', 'restaurant', 'rail', 'transfer', 'cruise', 'other')),
  provider_name text NOT NULL CHECK (length(trim(provider_name)) > 0),
  booking_title text NOT NULL CHECK (length(trim(booking_title)) > 0),
  traveler_names text[] NOT NULL DEFAULT '{}',
  start_at timestamptz NOT NULL,
  end_at timestamptz,
  origin text,
  destination text,
  location text,
  confirmation_number text,
  booking_url text,
  provider_contact text,
  payment_status text NOT NULL DEFAULT 'unknown' CHECK (payment_status IN ('unknown', 'unpaid', 'partially_paid', 'reported_paid')),
  total_amount numeric(12,2),
  amount_paid numeric(12,2),
  amount_remaining numeric(12,2),
  currency char(3) NOT NULL DEFAULT 'USD' CHECK (currency = upper(currency) AND currency ~ '^[A-Z]{3}$'),
  cancellation_terms text,
  refundable_amount numeric(12,2),
  notes text,
  associated_itinerary_item_type text CHECK (associated_itinerary_item_type IS NULL OR associated_itinerary_item_type IN ('flight', 'hotel', 'activity', 'reservation')),
  associated_itinerary_item_id text,
  evidence_type text NOT NULL DEFAULT 'user_reported' CHECK (evidence_type = 'user_reported'),
  evidence_quality text NOT NULL DEFAULT 'unverified' CHECK (evidence_quality = 'unverified'),
  manually_reported boolean NOT NULL DEFAULT true CHECK (manually_reported IS TRUE),
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT trip_external_bookings_amounts_nonnegative CHECK (
    (total_amount IS NULL OR total_amount >= 0)
    AND (amount_paid IS NULL OR amount_paid >= 0)
    AND (amount_remaining IS NULL OR amount_remaining >= 0)
    AND (refundable_amount IS NULL OR refundable_amount >= 0)
  ),
  CONSTRAINT trip_external_bookings_paid_within_total CHECK (
    total_amount IS NULL OR amount_paid IS NULL OR amount_paid <= total_amount
  ),
  CONSTRAINT trip_external_bookings_remaining_within_total CHECK (
    total_amount IS NULL OR amount_remaining IS NULL OR amount_remaining <= total_amount
  ),
  CONSTRAINT trip_external_bookings_refundable_within_total CHECK (
    total_amount IS NULL OR refundable_amount IS NULL OR refundable_amount <= total_amount
  ),
  CONSTRAINT trip_external_bookings_end_after_start CHECK (
    end_at IS NULL OR end_at >= start_at
  ),
  CONSTRAINT trip_external_bookings_association_pair CHECK (
    (associated_itinerary_item_type IS NULL AND associated_itinerary_item_id IS NULL)
    OR (associated_itinerary_item_type IS NOT NULL AND associated_itinerary_item_id IS NOT NULL)
  ),
  CONSTRAINT trip_external_bookings_archive_consistency CHECK (
    (record_status = 'archived' AND archived_at IS NOT NULL)
    OR (record_status <> 'archived' AND archived_at IS NULL)
  )
);

CREATE INDEX trip_external_bookings_itinerary_id_idx
  ON public.trip_external_bookings (itinerary_id);

CREATE INDEX trip_external_bookings_created_by_idx
  ON public.trip_external_bookings (created_by);

CREATE INDEX trip_external_bookings_active_idx
  ON public.trip_external_bookings (itinerary_id, record_status)
  WHERE archived_at IS NULL;

CREATE OR REPLACE FUNCTION public.set_trip_external_bookings_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.guard_trip_external_bookings_manual_authority()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.source := 'external_manual';
    NEW.evidence_type := 'user_reported';
    NEW.evidence_quality := 'unverified';
    NEW.manually_reported := true;
    RETURN NEW;
  END IF;

  IF NEW.created_by <> OLD.created_by THEN
    RAISE EXCEPTION 'created_by cannot be changed for external bookings';
  END IF;

  IF NEW.itinerary_id <> OLD.itinerary_id THEN
    RAISE EXCEPTION 'itinerary_id cannot be changed for external bookings';
  END IF;

  IF NEW.created_at <> OLD.created_at THEN
    RAISE EXCEPTION 'created_at cannot be changed for external bookings';
  END IF;

  IF NEW.source <> OLD.source THEN
    RAISE EXCEPTION 'source cannot be changed for external bookings';
  END IF;

  IF NEW.evidence_type <> OLD.evidence_type THEN
    RAISE EXCEPTION 'evidence_type cannot be changed for external bookings';
  END IF;

  IF NEW.evidence_quality <> OLD.evidence_quality THEN
    RAISE EXCEPTION 'evidence_quality cannot be changed for external bookings';
  END IF;

  IF NEW.manually_reported <> OLD.manually_reported THEN
    RAISE EXCEPTION 'manually_reported cannot be changed for external bookings';
  END IF;

  NEW.source := 'external_manual';
  NEW.evidence_type := 'user_reported';
  NEW.evidence_quality := 'unverified';
  NEW.manually_reported := true;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_trip_external_bookings_updated_at
  BEFORE UPDATE ON public.trip_external_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_trip_external_bookings_updated_at();

CREATE TRIGGER guard_trip_external_bookings_manual_authority
  BEFORE INSERT OR UPDATE ON public.trip_external_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_trip_external_bookings_manual_authority();

ALTER TABLE public.trip_external_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trip participants can view manual external bookings"
ON public.trip_external_bookings
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND (
    public.get_itinerary_role(itinerary_id, auth.uid()) IN ('owner', 'collaborator')
    OR EXISTS (
      SELECT 1
      FROM public.itinerary i
      WHERE i.id = trip_external_bookings.itinerary_id
        AND i.userid = auth.uid()
    )
  )
);

CREATE POLICY "Owners and collaborators can add manual external bookings"
ON public.trip_external_bookings
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND created_by = auth.uid()
  AND updated_by = auth.uid()
  AND source = 'external_manual'
  AND evidence_type = 'user_reported'
  AND evidence_quality = 'unverified'
  AND manually_reported IS TRUE
  AND archived_at IS NULL
  AND record_status IN ('active', 'needs_details')
  AND (
    public.get_itinerary_role(itinerary_id, auth.uid()) IN ('owner', 'collaborator')
    OR EXISTS (
      SELECT 1
      FROM public.itinerary i
      WHERE i.id = trip_external_bookings.itinerary_id
        AND i.userid = auth.uid()
    )
  )
);

CREATE POLICY "Owners can update manual external bookings on their trip"
ON public.trip_external_bookings
FOR UPDATE
TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND (
    public.get_itinerary_role(itinerary_id, auth.uid()) = 'owner'
    OR EXISTS (
      SELECT 1
      FROM public.itinerary i
      WHERE i.id = trip_external_bookings.itinerary_id
        AND i.userid = auth.uid()
    )
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND updated_by = auth.uid()
  AND source = 'external_manual'
  AND evidence_type = 'user_reported'
  AND evidence_quality = 'unverified'
  AND manually_reported IS TRUE
  AND (
    public.get_itinerary_role(itinerary_id, auth.uid()) = 'owner'
    OR EXISTS (
      SELECT 1
      FROM public.itinerary i
      WHERE i.id = trip_external_bookings.itinerary_id
        AND i.userid = auth.uid()
    )
  )
);

CREATE POLICY "Collaborators can update their own manual external bookings"
ON public.trip_external_bookings
FOR UPDATE
TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND created_by = auth.uid()
  AND public.get_itinerary_role(itinerary_id, auth.uid()) = 'collaborator'
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND created_by = auth.uid()
  AND updated_by = auth.uid()
  AND source = 'external_manual'
  AND evidence_type = 'user_reported'
  AND evidence_quality = 'unverified'
  AND manually_reported IS TRUE
  AND public.get_itinerary_role(itinerary_id, auth.uid()) = 'collaborator'
);
