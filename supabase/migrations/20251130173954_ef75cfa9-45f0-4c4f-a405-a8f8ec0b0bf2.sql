-- Create itinerary_attendees table for tracking users in itineraries
CREATE TABLE public.itinerary_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_id BIGINT NOT NULL REFERENCES public.itinerary(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
  status TEXT NOT NULL DEFAULT 'accepted' CHECK (status IN ('accepted', 'pending')),
  invited_by UUID,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(itinerary_id, user_id)
);

-- Create itinerary_invitations table for pending invites
CREATE TABLE public.itinerary_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_id BIGINT NOT NULL REFERENCES public.itinerary(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL,
  invite_method TEXT NOT NULL CHECK (invite_method IN ('email', 'sms', 'username')),
  invite_value TEXT NOT NULL,
  invite_token UUID DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notifications table for activity feed
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  reference_type TEXT,
  reference_id TEXT,
  title TEXT NOT NULL,
  message TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.itinerary_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itinerary_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is an attendee
CREATE OR REPLACE FUNCTION public.is_itinerary_attendee(itinerary_id_param BIGINT, user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.itinerary_attendees
    WHERE itinerary_id = itinerary_id_param 
    AND user_id = user_id_param 
    AND status = 'accepted'
  );
$$;

-- Helper function to get user's role in itinerary
CREATE OR REPLACE FUNCTION public.get_itinerary_role(itinerary_id_param BIGINT, user_id_param UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.itinerary_attendees
  WHERE itinerary_id = itinerary_id_param 
  AND user_id = user_id_param 
  AND status = 'accepted'
  LIMIT 1;
$$;

-- RLS Policies for itinerary_attendees
CREATE POLICY "Users can view attendees for their itineraries"
ON public.itinerary_attendees
FOR SELECT
USING (
  is_itinerary_attendee(itinerary_id, auth.uid())
);

CREATE POLICY "Owners can insert attendees"
ON public.itinerary_attendees
FOR INSERT
WITH CHECK (
  get_itinerary_role(itinerary_id, auth.uid()) = 'owner'
);

CREATE POLICY "Owners can update attendees"
ON public.itinerary_attendees
FOR UPDATE
USING (
  get_itinerary_role(itinerary_id, auth.uid()) = 'owner'
);

CREATE POLICY "Owners can delete attendees"
ON public.itinerary_attendees
FOR DELETE
USING (
  get_itinerary_role(itinerary_id, auth.uid()) = 'owner'
);

-- RLS Policies for itinerary_invitations
CREATE POLICY "Users can view invitations they sent or received"
ON public.itinerary_invitations
FOR SELECT
USING (
  auth.uid() = invited_by OR
  invite_value IN (
    SELECT email FROM public.users WHERE userid = auth.uid()
    UNION
    SELECT username FROM public.users WHERE userid = auth.uid()
    UNION
    SELECT cell::TEXT FROM public.users WHERE userid = auth.uid()
  )
);

CREATE POLICY "Attendees can create invitations"
ON public.itinerary_invitations
FOR INSERT
WITH CHECK (
  is_itinerary_attendee(itinerary_id, auth.uid())
);

CREATE POLICY "Users can update their received invitations"
ON public.itinerary_invitations
FOR UPDATE
USING (
  invite_value IN (
    SELECT email FROM public.users WHERE userid = auth.uid()
    UNION
    SELECT username FROM public.users WHERE userid = auth.uid()
    UNION
    SELECT cell::TEXT FROM public.users WHERE userid = auth.uid()
  )
);

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- Update itinerary RLS policies to allow shared access
DROP POLICY IF EXISTS "Users can view their own itineraries" ON public.itinerary;
CREATE POLICY "Users can view their own or shared itineraries"
ON public.itinerary
FOR SELECT
USING (
  auth.uid() = userid OR
  is_itinerary_attendee(id, auth.uid())
);

DROP POLICY IF EXISTS "Users can update their own itineraries" ON public.itinerary;
CREATE POLICY "Owners and editors can update itineraries"
ON public.itinerary
FOR UPDATE
USING (
  auth.uid() = userid OR
  get_itinerary_role(id, auth.uid()) IN ('owner', 'editor')
);

-- Trigger to create owner attendee record when itinerary is created
CREATE OR REPLACE FUNCTION public.create_itinerary_owner()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.itinerary_attendees (itinerary_id, user_id, role, status)
  VALUES (NEW.id, NEW.userid, 'owner', 'accepted');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_itinerary_created
AFTER INSERT ON public.itinerary
FOR EACH ROW
EXECUTE FUNCTION public.create_itinerary_owner();

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.itinerary_attendees;