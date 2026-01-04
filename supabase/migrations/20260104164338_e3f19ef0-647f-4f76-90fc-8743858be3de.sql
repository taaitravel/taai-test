-- Create itinerary_events audit table for tracking AI changes
CREATE TABLE public.itinerary_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_id BIGINT NOT NULL REFERENCES public.itinerary(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  item_type TEXT,
  item_id TEXT,
  before_state JSONB,
  after_state JSONB,
  ai_request_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.itinerary_events ENABLE ROW LEVEL SECURITY;

-- Users can view events for their own itineraries
CREATE POLICY "Users can view events for their itineraries"
ON public.itinerary_events
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.itinerary i 
    WHERE i.id = itinerary_events.itinerary_id 
    AND i.userid = auth.uid()
  )
  OR public.is_itinerary_attendee(itinerary_events.itinerary_id, auth.uid())
);

-- Allow service role to insert events (used by edge functions)
CREATE POLICY "Service role can insert events"
ON public.itinerary_events
FOR INSERT
WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_itinerary_events_itinerary_id ON public.itinerary_events(itinerary_id);
CREATE INDEX idx_itinerary_events_created_at ON public.itinerary_events(created_at DESC);