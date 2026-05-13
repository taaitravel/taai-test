-- =========================================================================
-- Cost splitting + inter-attendee balances (Part 1)
-- =========================================================================

-- 1. cart_item_splits ----------------------------------------------------
CREATE TABLE public.cart_item_splits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_item_id uuid NOT NULL,
  itinerary_id bigint NOT NULL,
  attendee_user_id uuid NULL,
  attendee_label text NULL,
  share_method text NOT NULL DEFAULT 'equal',
  share_value numeric NULL,
  computed_amount numeric NOT NULL DEFAULT 0,
  computed_taxes_and_fees numeric NOT NULL DEFAULT 0,
  paid_by_user_id uuid NULL,
  payment_status text NOT NULL DEFAULT 'pending',
  auto_added boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT cart_item_splits_method_chk
    CHECK (share_method IN ('equal','percent','amount')),
  CONSTRAINT cart_item_splits_status_chk
    CHECK (payment_status IN ('pending','covered','paid','refunded')),
  CONSTRAINT cart_item_splits_attendee_present
    CHECK (attendee_user_id IS NOT NULL OR attendee_label IS NOT NULL)
);

CREATE INDEX idx_cart_item_splits_cart_item ON public.cart_item_splits(cart_item_id);
CREATE INDEX idx_cart_item_splits_itin ON public.cart_item_splits(itinerary_id);
CREATE INDEX idx_cart_item_splits_attendee ON public.cart_item_splits(attendee_user_id);

ALTER TABLE public.cart_item_splits ENABLE ROW LEVEL SECURITY;

-- Read: any accepted attendee on the trip can see splits.
CREATE POLICY "Attendees can view splits"
ON public.cart_item_splits FOR SELECT
USING (public.is_itinerary_attendee(itinerary_id, auth.uid()));

-- Write: owner / editor / collaborator on the trip can manage splits.
CREATE POLICY "Owners and editors can insert splits"
ON public.cart_item_splits FOR INSERT
WITH CHECK (
  public.get_itinerary_role(itinerary_id, auth.uid())
    = ANY (ARRAY['owner','editor','collaborator'])
);

CREATE POLICY "Owners and editors can update splits"
ON public.cart_item_splits FOR UPDATE
USING (
  public.get_itinerary_role(itinerary_id, auth.uid())
    = ANY (ARRAY['owner','editor','collaborator'])
);

CREATE POLICY "Owners and editors can delete splits"
ON public.cart_item_splits FOR DELETE
USING (
  public.get_itinerary_role(itinerary_id, auth.uid())
    = ANY (ARRAY['owner','editor','collaborator'])
);

-- Service role full access (for webhook payment_status flips).
CREATE POLICY "Service role manages splits"
ON public.cart_item_splits FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE TRIGGER trg_cart_item_splits_updated_at
BEFORE UPDATE ON public.cart_item_splits
FOR EACH ROW EXECUTE FUNCTION public.update_cart_items_updated_at();


-- 2. attendee_balances ---------------------------------------------------
CREATE TABLE public.attendee_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_id bigint NOT NULL,
  debtor_user_id uuid NOT NULL,
  creditor_user_id uuid NOT NULL,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'open',
  source_split_id uuid NULL,
  note text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT attendee_balances_status_chk
    CHECK (status IN ('open','settled_in_app','settled_off_platform','refunded')),
  CONSTRAINT attendee_balances_distinct_parties
    CHECK (debtor_user_id <> creditor_user_id)
);

CREATE INDEX idx_attendee_balances_itin ON public.attendee_balances(itinerary_id);
CREATE INDEX idx_attendee_balances_debtor ON public.attendee_balances(debtor_user_id);
CREATE INDEX idx_attendee_balances_creditor ON public.attendee_balances(creditor_user_id);
CREATE INDEX idx_attendee_balances_source_split ON public.attendee_balances(source_split_id);

ALTER TABLE public.attendee_balances ENABLE ROW LEVEL SECURITY;

-- Read: trip attendees only.
CREATE POLICY "Attendees can view balances"
ON public.attendee_balances FOR SELECT
USING (public.is_itinerary_attendee(itinerary_id, auth.uid()));

-- Update: only the debtor or creditor can flip a balance to settled_off_platform.
CREATE POLICY "Parties can update their balances"
ON public.attendee_balances FOR UPDATE
USING (auth.uid() = debtor_user_id OR auth.uid() = creditor_user_id);

-- Service role full access (webhook writes ledger rows).
CREATE POLICY "Service role manages balances"
ON public.attendee_balances FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE TRIGGER trg_attendee_balances_updated_at
BEFORE UPDATE ON public.attendee_balances
FOR EACH ROW EXECUTE FUNCTION public.update_cart_items_updated_at();


-- 3. Validation trigger: percent rows sum to 100, amount rows sum <= price ----
CREATE OR REPLACE FUNCTION public.validate_cart_item_splits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_cart_item_id uuid;
  v_price numeric;
  v_pct_sum numeric;
  v_amt_sum numeric;
BEGIN
  v_cart_item_id := COALESCE(NEW.cart_item_id, OLD.cart_item_id);

  SELECT price INTO v_price FROM public.cart_items WHERE id = v_cart_item_id;
  IF v_price IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(SUM(share_value),0)
    INTO v_pct_sum
    FROM public.cart_item_splits
   WHERE cart_item_id = v_cart_item_id AND share_method = 'percent';

  SELECT COALESCE(SUM(share_value),0)
    INTO v_amt_sum
    FROM public.cart_item_splits
   WHERE cart_item_id = v_cart_item_id AND share_method = 'amount';

  IF v_pct_sum > 100.0001 THEN
    RAISE EXCEPTION 'Percent splits exceed 100%% (sum=%)', v_pct_sum;
  END IF;

  IF v_amt_sum > v_price + 0.01 THEN
    RAISE EXCEPTION 'Amount splits (%) exceed item price (%)', v_amt_sum, v_price;
  END IF;

  RETURN NEW;
END;
$$;

CREATE CONSTRAINT TRIGGER trg_validate_cart_item_splits
AFTER INSERT OR UPDATE ON public.cart_item_splits
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION public.validate_cart_item_splits();


-- 4. recompute_cart_item_splits: normalize computed_amount per share_method ---
CREATE OR REPLACE FUNCTION public.recompute_cart_item_splits(_cart_item_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_price numeric;
  v_locked numeric;
  v_equal_count int;
  v_equal_share numeric;
BEGIN
  SELECT price INTO v_price FROM public.cart_items WHERE id = _cart_item_id;
  IF v_price IS NULL THEN RETURN; END IF;

  -- percent rows
  UPDATE public.cart_item_splits
     SET computed_amount = ROUND(v_price * (share_value / 100.0), 2)
   WHERE cart_item_id = _cart_item_id AND share_method = 'percent';

  -- fixed-amount rows
  UPDATE public.cart_item_splits
     SET computed_amount = ROUND(share_value, 2)
   WHERE cart_item_id = _cart_item_id AND share_method = 'amount';

  -- equal rows split the remainder
  SELECT COALESCE(SUM(computed_amount),0)
    INTO v_locked
    FROM public.cart_item_splits
   WHERE cart_item_id = _cart_item_id AND share_method <> 'equal';

  SELECT COUNT(*)
    INTO v_equal_count
    FROM public.cart_item_splits
   WHERE cart_item_id = _cart_item_id AND share_method = 'equal';

  IF v_equal_count > 0 THEN
    v_equal_share := ROUND(GREATEST(v_price - v_locked, 0) / v_equal_count, 2);
    UPDATE public.cart_item_splits
       SET computed_amount = v_equal_share
     WHERE cart_item_id = _cart_item_id AND share_method = 'equal';
  END IF;
END;
$$;


-- 5. recompute_balances_for_item: write ledger rows for covered (organizer-paid) splits
CREATE OR REPLACE FUNCTION public.recompute_balances_for_item(_cart_item_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_itin bigint;
BEGIN
  SELECT itinerary_id INTO v_itin
    FROM public.cart_item_splits
   WHERE cart_item_id = _cart_item_id
   LIMIT 1;
  IF v_itin IS NULL THEN RETURN; END IF;

  -- Wipe prior open ledger rows tied to this item's splits, then re-create.
  DELETE FROM public.attendee_balances
   WHERE source_split_id IN (
     SELECT id FROM public.cart_item_splits WHERE cart_item_id = _cart_item_id
   ) AND status = 'open';

  INSERT INTO public.attendee_balances
    (itinerary_id, debtor_user_id, creditor_user_id, amount, currency, status, source_split_id)
  SELECT
    s.itinerary_id,
    s.attendee_user_id,
    s.paid_by_user_id,
    s.computed_amount + COALESCE(s.computed_taxes_and_fees, 0),
    'USD',
    'open',
    s.id
  FROM public.cart_item_splits s
  WHERE s.cart_item_id = _cart_item_id
    AND s.payment_status = 'covered'
    AND s.paid_by_user_id IS NOT NULL
    AND s.attendee_user_id IS NOT NULL
    AND s.attendee_user_id <> s.paid_by_user_id
    AND (s.computed_amount + COALESCE(s.computed_taxes_and_fees, 0)) > 0;
END;
$$;