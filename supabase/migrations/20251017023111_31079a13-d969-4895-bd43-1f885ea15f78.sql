-- Create search_history table for tracking user searches
CREATE TABLE IF NOT EXISTS public.search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  search_type TEXT NOT NULL CHECK (search_type IN ('hotel', 'flight', 'activity', 'package', 'car')),
  search_params JSONB NOT NULL,
  search_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  results_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on search_history
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for search_history
CREATE POLICY "Users can view their own search history"
ON public.search_history
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own search history"
ON public.search_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own search history"
ON public.search_history
FOR DELETE
USING (auth.uid() = user_id);

-- Add index for faster queries
CREATE INDEX idx_search_history_user_date ON public.search_history(user_id, search_date DESC);
CREATE INDEX idx_search_history_type ON public.search_history(search_type);