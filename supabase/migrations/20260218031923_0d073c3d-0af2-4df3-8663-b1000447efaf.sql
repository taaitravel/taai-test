
-- Create table for tracking event completions within itineraries
CREATE TABLE public.itinerary_event_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_id bigint NOT NULL REFERENCES public.itinerary(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  event_type text NOT NULL,
  event_index integer NOT NULL,
  event_date date,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (itinerary_id, user_id, event_type, event_index)
);

-- Enable RLS
ALTER TABLE public.itinerary_event_completions ENABLE ROW LEVEL SECURITY;

-- Users can view their own completions
CREATE POLICY "Users can view their own event completions"
ON public.itinerary_event_completions FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own completions
CREATE POLICY "Users can insert their own event completions"
ON public.itinerary_event_completions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own completions
CREATE POLICY "Users can update their own event completions"
ON public.itinerary_event_completions FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own completions
CREATE POLICY "Users can delete their own event completions"
ON public.itinerary_event_completions FOR DELETE
USING (auth.uid() = user_id);

-- Index for fast lookups by itinerary
CREATE INDEX idx_event_completions_itinerary ON public.itinerary_event_completions(itinerary_id, user_id);
