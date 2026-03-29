-- 1. Chat participants table
CREATE TABLE public.itinerary_chat_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_id bigint NOT NULL,
  user_id uuid NOT NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (itinerary_id, user_id)
);
ALTER TABLE public.itinerary_chat_participants ENABLE ROW LEVEL SECURITY;

-- 2. Chat messages table
CREATE TABLE public.itinerary_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_id bigint NOT NULL,
  sender_id uuid NOT NULL,
  content text,
  attachment_type text,
  attachment_data jsonb,
  reply_to_id uuid REFERENCES public.itinerary_chat_messages(id) ON DELETE SET NULL,
  edited_at timestamptz,
  deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.itinerary_chat_messages ENABLE ROW LEVEL SECURITY;

-- 3. Chat reactions table
CREATE TABLE public.itinerary_chat_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.itinerary_chat_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  reaction text NOT NULL DEFAULT 'like',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, user_id, reaction)
);
ALTER TABLE public.itinerary_chat_reactions ENABLE ROW LEVEL SECURITY;

-- Helper: check if user is a chat participant
CREATE OR REPLACE FUNCTION public.is_chat_participant(p_itinerary_id bigint, p_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.itinerary_chat_participants
    WHERE itinerary_id = p_itinerary_id AND user_id = p_user_id
  );
$$;

-- Helper: get participant joined_at
CREATE OR REPLACE FUNCTION public.get_chat_joined_at(p_itinerary_id bigint, p_user_id uuid)
RETURNS timestamptz
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT joined_at FROM public.itinerary_chat_participants
  WHERE itinerary_id = p_itinerary_id AND user_id = p_user_id
  LIMIT 1;
$$;

-- RLS: Participants
CREATE POLICY "Participants can view their itinerary participants"
  ON public.itinerary_chat_participants FOR SELECT
  USING (is_chat_participant(itinerary_id, auth.uid()));

CREATE POLICY "Itinerary attendees are auto-added"
  ON public.itinerary_chat_participants FOR INSERT
  WITH CHECK (
    get_itinerary_role(itinerary_id, auth.uid()) = 'owner'
    OR user_id = auth.uid()
  );

-- RLS: Messages SELECT
CREATE POLICY "Participants can view messages after joining"
  ON public.itinerary_chat_messages FOR SELECT
  USING (
    is_chat_participant(itinerary_id, auth.uid())
    AND created_at >= get_chat_joined_at(itinerary_id, auth.uid())
  );

-- RLS: Messages INSERT
CREATE POLICY "Participants can send messages"
  ON public.itinerary_chat_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND is_chat_participant(itinerary_id, auth.uid())
  );

-- RLS: Messages UPDATE (10-min edit window for content)
CREATE POLICY "Senders can edit messages within 10 min"
  ON public.itinerary_chat_messages FOR UPDATE
  USING (sender_id = auth.uid());

-- RLS: Reactions
CREATE POLICY "Participants can view reactions"
  ON public.itinerary_chat_reactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.itinerary_chat_messages m
      WHERE m.id = message_id
      AND is_chat_participant(m.itinerary_id, auth.uid())
    )
  );

CREATE POLICY "Participants can add reactions"
  ON public.itinerary_chat_reactions FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.itinerary_chat_messages m
      WHERE m.id = message_id
      AND is_chat_participant(m.itinerary_id, auth.uid())
    )
  );

CREATE POLICY "Users can remove their own reactions"
  ON public.itinerary_chat_reactions FOR DELETE
  USING (user_id = auth.uid());

-- Trigger: auto-add accepted attendees as chat participants
CREATE OR REPLACE FUNCTION public.auto_add_chat_participant()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'accepted' THEN
    INSERT INTO public.itinerary_chat_participants (itinerary_id, user_id, joined_at)
    VALUES (NEW.itinerary_id, NEW.user_id, now())
    ON CONFLICT (itinerary_id, user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_attendee_accepted
  AFTER INSERT OR UPDATE ON public.itinerary_attendees
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_add_chat_participant();

-- Storage bucket for chat attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS
CREATE POLICY "Authenticated users can upload chat attachments"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'chat-attachments');

CREATE POLICY "Anyone can view chat attachments"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'chat-attachments');

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.itinerary_chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.itinerary_chat_reactions;

-- Backfill existing attendees
INSERT INTO public.itinerary_chat_participants (itinerary_id, user_id, joined_at)
SELECT itinerary_id, user_id, COALESCE(joined_at, created_at)
FROM public.itinerary_attendees
WHERE status = 'accepted'
ON CONFLICT (itinerary_id, user_id) DO NOTHING;