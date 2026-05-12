
-- 1) Chat attachments: make bucket private + scope policies to participants
UPDATE storage.buckets SET public = false WHERE id = 'chat-attachments';

DROP POLICY IF EXISTS "Anyone can view chat attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload chat attachments" ON storage.objects;

CREATE POLICY "Chat participants can view chat attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'chat-attachments'
  AND public.is_chat_participant(
    NULLIF((storage.foldername(name))[1], '')::bigint,
    auth.uid()
  )
);

CREATE POLICY "Chat participants can upload chat attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'chat-attachments'
  AND public.is_chat_participant(
    NULLIF((storage.foldername(name))[1], '')::bigint,
    auth.uid()
  )
);

CREATE POLICY "Chat participants can delete their chat attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'chat-attachments'
  AND owner = auth.uid()
);

-- 2) itinerary_events: restrict INSERT to owner/attendee
DROP POLICY IF EXISTS "Service role can insert events" ON public.itinerary_events;

CREATE POLICY "Service role or itinerary members can insert events"
ON public.itinerary_events FOR INSERT
TO public
WITH CHECK (
  auth.role() = 'service_role'
  OR EXISTS (
    SELECT 1 FROM public.itinerary i
    WHERE i.id = itinerary_events.itinerary_id AND i.userid = auth.uid()
  )
  OR public.is_itinerary_attendee(itinerary_id, auth.uid())
);

-- 3) subscribers: remove user-controlled UPDATE (privilege escalation risk)
DROP POLICY IF EXISTS "Users can update their own subscription" ON public.subscribers;

CREATE POLICY "Service role can update subscriptions"
ON public.subscribers FOR UPDATE
TO public
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');
