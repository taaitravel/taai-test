
-- 1. Make chat-attachments bucket private (signed URLs only)
UPDATE storage.buckets SET public = false WHERE id = 'chat-attachments';

-- 2. Add UPDATE policy for chat-attachments objects (owner + chat participant only)
CREATE POLICY "Chat participants can update their chat attachments"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'chat-attachments'
  AND owner = auth.uid()
  AND public.is_chat_participant(
    (NULLIF((storage.foldername(name))[1], ''))::bigint,
    auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'chat-attachments'
  AND owner = auth.uid()
  AND public.is_chat_participant(
    (NULLIF((storage.foldername(name))[1], ''))::bigint,
    auth.uid()
  )
);

-- 3. RLS for realtime.messages - restrict chat-* topics to chat participants
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read realtime messages" ON realtime.messages;
CREATE POLICY "Authenticated can read realtime messages"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  CASE
    WHEN realtime.topic() LIKE 'chat-%' THEN
      public.is_chat_participant(
        NULLIF(SPLIT_PART(realtime.topic(), '-', 2), '')::bigint,
        auth.uid()
      )
    ELSE true
  END
);

DROP POLICY IF EXISTS "Authenticated can send realtime messages" ON realtime.messages;
CREATE POLICY "Authenticated can send realtime messages"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  CASE
    WHEN realtime.topic() LIKE 'chat-%' THEN
      public.is_chat_participant(
        NULLIF(SPLIT_PART(realtime.topic(), '-', 2), '')::bigint,
        auth.uid()
      )
    ELSE true
  END
);
