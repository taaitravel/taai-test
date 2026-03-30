-- Phase 1: Fix role constraint to support owner/collaborator model
ALTER TABLE public.itinerary_attendees DROP CONSTRAINT itinerary_attendees_role_check;
ALTER TABLE public.itinerary_attendees ADD CONSTRAINT itinerary_attendees_role_check 
  CHECK (role = ANY (ARRAY['owner'::text, 'collaborator'::text]));

-- Migrate legacy roles to collaborator
UPDATE public.itinerary_attendees SET role = 'collaborator' WHERE role IN ('editor', 'viewer');

-- Phase 1b: Create a safe RPC to get participant profiles for an itinerary
CREATE OR REPLACE FUNCTION public.get_itinerary_participant_profiles(p_itinerary_id bigint)
RETURNS TABLE (
  user_id uuid,
  first_name text,
  last_name text,
  username text,
  avatar_url text,
  role text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    u.userid as user_id,
    u.first_name,
    u.last_name,
    u.username,
    u.avatar_url,
    ia.role
  FROM public.itinerary_attendees ia
  JOIN public.users u ON u.userid = ia.user_id
  WHERE ia.itinerary_id = p_itinerary_id
    AND ia.status = 'accepted'
    AND public.is_itinerary_attendee(p_itinerary_id, auth.uid())
$$;

-- Phase 3: Backfill broken accepted invitations that never created attendee rows
INSERT INTO public.itinerary_attendees (itinerary_id, user_id, role, status, invited_by)
SELECT 
  inv.itinerary_id,
  u.userid,
  'collaborator',
  'accepted',
  inv.invited_by
FROM public.itinerary_invitations inv
JOIN public.users u ON (
  (inv.invite_method = 'email' AND lower(u.email) = lower(inv.invite_value))
  OR (inv.invite_method = 'username' AND lower(u.username) = lower(inv.invite_value))
)
WHERE inv.status = 'accepted'
ON CONFLICT (itinerary_id, user_id) DO NOTHING;

-- Backfill chat participants for any attendees missing them
INSERT INTO public.itinerary_chat_participants (itinerary_id, user_id, joined_at)
SELECT ia.itinerary_id, ia.user_id, COALESCE(ia.joined_at, ia.created_at)
FROM public.itinerary_attendees ia
WHERE ia.status = 'accepted'
ON CONFLICT (itinerary_id, user_id) DO NOTHING;