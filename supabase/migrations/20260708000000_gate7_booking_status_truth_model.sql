-- Gate 7: separate payment state from provider-confirmation state.
-- Payment completion is not provider confirmation.

ALTER TABLE public.booking_completions
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS provider_status text NOT NULL DEFAULT 'not_requested',
  ADD COLUMN IF NOT EXISTS traveler_notification_status text NOT NULL DEFAULT 'not_sent',
  ADD COLUMN IF NOT EXISTS provider_confirmation_required boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS manual_review_required boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS provider_confirmation_metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.booking_completions
  ADD CONSTRAINT booking_completions_payment_status_check
  CHECK (payment_status IN ('unpaid', 'payment_pending', 'payment_completed', 'payment_failed', 'refunded')) NOT VALID;

ALTER TABLE public.booking_completions
  ADD CONSTRAINT booking_completions_provider_status_check
  CHECK (provider_status IN ('not_requested', 'provider_pending', 'provider_confirmed', 'provider_failed', 'manual_review_required')) NOT VALID;

ALTER TABLE public.booking_completions
  ADD CONSTRAINT booking_completions_traveler_notification_status_check
  CHECK (traveler_notification_status IN ('not_sent', 'payment_notice_sent', 'provider_confirmation_sent', 'failed')) NOT VALID;

CREATE INDEX IF NOT EXISTS idx_booking_completions_payment_status ON public.booking_completions(payment_status);
CREATE INDEX IF NOT EXISTS idx_booking_completions_provider_status ON public.booking_completions(provider_status);

ALTER TABLE public.cart_items
  ADD COLUMN IF NOT EXISTS provider_status text NOT NULL DEFAULT 'not_requested',
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid';

CREATE INDEX IF NOT EXISTS idx_cart_items_payment_status ON public.cart_items(payment_status);
CREATE INDEX IF NOT EXISTS idx_cart_items_provider_status ON public.cart_items(provider_status);
