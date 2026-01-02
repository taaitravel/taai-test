-- Create itinerary_collections table
CREATE TABLE public.itinerary_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create junction table for collection-itinerary relationships
CREATE TABLE public.collection_itineraries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id uuid NOT NULL REFERENCES public.itinerary_collections(id) ON DELETE CASCADE,
  itinerary_id bigint NOT NULL REFERENCES public.itinerary(id) ON DELETE CASCADE,
  added_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(collection_id, itinerary_id)
);

-- Enable RLS
ALTER TABLE public.itinerary_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_itineraries ENABLE ROW LEVEL SECURITY;

-- RLS policies for itinerary_collections
CREATE POLICY "Users can view their own collections"
ON public.itinerary_collections FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own collections"
ON public.itinerary_collections FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own collections"
ON public.itinerary_collections FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own collections"
ON public.itinerary_collections FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for collection_itineraries
CREATE POLICY "Users can view their collection items"
ON public.collection_itineraries FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.itinerary_collections
  WHERE id = collection_id AND user_id = auth.uid()
));

CREATE POLICY "Users can add items to their collections"
ON public.collection_itineraries FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.itinerary_collections
  WHERE id = collection_id AND user_id = auth.uid()
));

CREATE POLICY "Users can remove items from their collections"
ON public.collection_itineraries FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.itinerary_collections
  WHERE id = collection_id AND user_id = auth.uid()
));

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_itinerary_collections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

CREATE TRIGGER update_itinerary_collections_updated_at
BEFORE UPDATE ON public.itinerary_collections
FOR EACH ROW EXECUTE FUNCTION public.update_itinerary_collections_updated_at();