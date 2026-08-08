-- Separate planned party size from accepted collaborators and make invitation
-- delivery/audit state explicit.

ALTER TABLE public.itinerary
  ADD COLUMN IF NOT EXISTS planned_traveler_count integer,
  ADD COLUMN IF NOT EXISTS creation_key uuid;

UPDATE public.itinerary
SET planned_traveler_count = GREATEST(
  1,
  CASE
    WHEN jsonb_typeof(attendees::jsonb) = 'array' THEN jsonb_array_length(attendees::jsonb)
    ELSE 1
  END
)
WHERE planned_traveler_count IS NULL;

ALTER TABLE public.itinerary
  ALTER COLUMN planned_traveler_count SET DEFAULT 1,
  ALTER COLUMN planned_traveler_count SET NOT NULL;

ALTER TABLE public.itinerary
  DROP CONSTRAINT IF EXISTS itinerary_planned_traveler_count_check;

ALTER TABLE public.itinerary
  ADD CONSTRAINT itinerary_planned_traveler_count_check
    CHECK (planned_traveler_count BETWEEN 1 AND 100);

CREATE UNIQUE INDEX IF NOT EXISTS itinerary_creation_key_unique
  ON public.itinerary (creation_key)
  WHERE creation_key IS NOT NULL;

ALTER TABLE public.itinerary_invitations
  ADD COLUMN IF NOT EXISTS inviter_display_name text,
  ADD COLUMN IF NOT EXISTS delivery_status text NOT NULL DEFAULT 'record_only',
  ADD COLUMN IF NOT EXISTS responded_at timestamptz,
  ADD COLUMN IF NOT EXISTS revoked_at timestamptz;

UPDATE public.itinerary_invitations invitation
SET inviter_display_name = COALESCE(
  NULLIF(trim(concat_ws(' ', inviter.first_name, inviter.last_name)), ''),
  inviter.username,
  'Trip owner'
)
FROM public.users inviter
WHERE inviter.userid = invitation.invited_by
  AND invitation.inviter_display_name IS NULL;

-- Existing invitations addressed to a registered profile are already available
-- in-app, even though no external email was sent.
UPDATE public.itinerary_invitations invitation
SET delivery_status = 'in_app'
WHERE EXISTS (
  SELECT 1
  FROM public.users recipient
  WHERE
    (invitation.invite_method = 'email' AND lower(recipient.email) = lower(invitation.invite_value))
    OR (invitation.invite_method = 'username' AND lower(recipient.username) = lower(invitation.invite_value))
    OR (invitation.invite_method = 'sms' AND recipient.cell::text = invitation.invite_value)
);

ALTER TABLE public.itinerary_invitations
  DROP CONSTRAINT IF EXISTS itinerary_invitations_status_check;

ALTER TABLE public.itinerary_invitations
  ADD CONSTRAINT itinerary_invitations_status_check
    CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'revoked'));

ALTER TABLE public.itinerary_invitations
  DROP CONSTRAINT IF EXISTS itinerary_invitations_delivery_status_check;

ALTER TABLE public.itinerary_invitations
  ADD CONSTRAINT itinerary_invitations_delivery_status_check
    CHECK (delivery_status IN ('in_app', 'record_only'));

CREATE INDEX IF NOT EXISTS itinerary_invitations_owner_status_idx
  ON public.itinerary_invitations (itinerary_id, invited_by, status, created_at DESC);

-- Historical retries created duplicate pending invitations on a few older
-- itineraries. Preserve the newest actionable invitation and close the older
-- copies before enforcing the one-pending-invitation contract.
WITH ranked_pending_invitations AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY itinerary_id, lower(invite_value)
      ORDER BY created_at DESC, id DESC
    ) AS pending_rank
  FROM public.itinerary_invitations
  WHERE status = 'pending'
)
UPDATE public.itinerary_invitations invitation
SET
  status = 'expired',
  responded_at = COALESCE(invitation.responded_at, now())
FROM ranked_pending_invitations ranked
WHERE invitation.id = ranked.id
  AND ranked.pending_rank > 1;

CREATE UNIQUE INDEX IF NOT EXISTS itinerary_invitations_one_pending_recipient_idx
  ON public.itinerary_invitations (itinerary_id, lower(invite_value))
  WHERE status = 'pending';

-- Invitation mutations must go through authenticated server functions. This
-- prevents a collaborator or recipient from forging invitation state directly.
DROP POLICY IF EXISTS "Attendees can create invitations"
  ON public.itinerary_invitations;
DROP POLICY IF EXISTS "Users can update their received invitations"
  ON public.itinerary_invitations;

CREATE OR REPLACE FUNCTION public.respond_to_itinerary_invitation(
  p_invitation_id uuid,
  p_accept boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation public.itinerary_invitations%ROWTYPE;
  v_user public.users%ROWTYPE;
  v_user_id uuid := auth.uid();
  v_user_name text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Please sign in first.';
  END IF;

  SELECT * INTO v_invitation
  FROM public.itinerary_invitations
  WHERE id = p_invitation_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation not found.';
  END IF;

  IF v_invitation.status <> 'pending' THEN
    RAISE EXCEPTION 'Invitation is already %.', v_invitation.status;
  END IF;

  IF v_invitation.expires_at IS NOT NULL AND v_invitation.expires_at <= now() THEN
    RAISE EXCEPTION 'This invitation has expired.';
  END IF;

  SELECT * INTO v_user
  FROM public.users
  WHERE userid = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found.';
  END IF;

  IF NOT (
    (v_invitation.invite_method = 'email' AND lower(trim(v_user.email)) = lower(trim(v_invitation.invite_value)))
    OR (v_invitation.invite_method = 'username' AND lower(trim(v_user.username)) = lower(trim(v_invitation.invite_value)))
    OR (v_invitation.invite_method = 'sms' AND v_user.cell::text = trim(v_invitation.invite_value))
  ) THEN
    RAISE EXCEPTION 'This invitation was not sent to you.';
  END IF;

  IF p_accept THEN
    INSERT INTO public.itinerary_attendees (
      itinerary_id,
      user_id,
      role,
      status,
      invited_by
    ) VALUES (
      v_invitation.itinerary_id,
      v_user_id,
      'collaborator',
      'accepted',
      v_invitation.invited_by
    )
    ON CONFLICT (itinerary_id, user_id) DO NOTHING;

    INSERT INTO public.itinerary_chat_participants (itinerary_id, user_id)
    VALUES (v_invitation.itinerary_id, v_user_id)
    ON CONFLICT (itinerary_id, user_id) DO NOTHING;

    UPDATE public.itinerary_invitations
    SET status = 'accepted', responded_at = now()
    WHERE id = p_invitation_id;
  ELSE
    UPDATE public.itinerary_invitations
    SET status = 'declined', responded_at = now()
    WHERE id = p_invitation_id;
  END IF;

  v_user_name := COALESCE(
    NULLIF(trim(concat_ws(' ', v_user.first_name, v_user.last_name)), ''),
    v_user.username,
    'A traveler'
  );

  RETURN jsonb_build_object(
    'status', CASE WHEN p_accept THEN 'accepted' ELSE 'declined' END,
    'itinerary_id', v_invitation.itinerary_id,
    'invited_by', v_invitation.invited_by,
    'user_name', v_user_name
  );
END;
$$;

REVOKE ALL ON FUNCTION public.respond_to_itinerary_invitation(uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.respond_to_itinerary_invitation(uuid, boolean) TO authenticated;
