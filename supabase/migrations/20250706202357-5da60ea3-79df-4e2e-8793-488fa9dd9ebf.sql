-- Create itinerary budget breakdown table
CREATE TABLE public.itinerary_budget_breakdown (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  itinerary_id BIGINT NOT NULL REFERENCES public.itinerary(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  budgeted_amount NUMERIC NOT NULL DEFAULT 0,
  spent_amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.itinerary_budget_breakdown ENABLE ROW LEVEL SECURITY;

-- Create policies for budget breakdown access
CREATE POLICY "Users can view their own itinerary budget breakdown" 
ON public.itinerary_budget_breakdown 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.itinerary 
    WHERE id = itinerary_budget_breakdown.itinerary_id 
    AND userid = auth.uid()
  )
);

CREATE POLICY "Users can create their own itinerary budget breakdown" 
ON public.itinerary_budget_breakdown 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.itinerary 
    WHERE id = itinerary_budget_breakdown.itinerary_id 
    AND userid = auth.uid()
  )
);

CREATE POLICY "Users can update their own itinerary budget breakdown" 
ON public.itinerary_budget_breakdown 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.itinerary 
    WHERE id = itinerary_budget_breakdown.itinerary_id 
    AND userid = auth.uid()
  )
);

CREATE POLICY "Users can delete their own itinerary budget breakdown" 
ON public.itinerary_budget_breakdown 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.itinerary 
    WHERE id = itinerary_budget_breakdown.itinerary_id 
    AND userid = auth.uid()
  )
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_itinerary_budget_breakdown_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_itinerary_budget_breakdown_updated_at
BEFORE UPDATE ON public.itinerary_budget_breakdown
FOR EACH ROW
EXECUTE FUNCTION public.update_itinerary_budget_breakdown_updated_at();

-- Insert default budget categories for existing itineraries
INSERT INTO public.itinerary_budget_breakdown (itinerary_id, category, budgeted_amount, spent_amount)
SELECT 
  id as itinerary_id,
  category,
  CASE 
    WHEN category = 'Flights' AND flights IS NOT NULL THEN 
      COALESCE((
        SELECT SUM((flight_data->>'cost')::numeric) 
        FROM jsonb_array_elements(flights) AS flight_data
      ), 0)
    WHEN category = 'Accommodation' AND hotels IS NOT NULL THEN 
      COALESCE((
        SELECT SUM((hotel_data->>'cost')::numeric) 
        FROM jsonb_array_elements(hotels) AS hotel_data
      ), 0)
    WHEN category = 'Activities' AND activities IS NOT NULL THEN 
      COALESCE((
        SELECT SUM((activity_data->>'cost')::numeric) 
        FROM jsonb_array_elements(activities) AS activity_data
      ), 0)
    ELSE COALESCE(budget, 0) * 0.15
  END as budgeted_amount,
  CASE 
    WHEN category = 'Flights' AND flights IS NOT NULL THEN 
      COALESCE((
        SELECT SUM((flight_data->>'cost')::numeric) 
        FROM jsonb_array_elements(flights) AS flight_data
      ), 0)
    WHEN category = 'Accommodation' AND hotels IS NOT NULL THEN 
      COALESCE((
        SELECT SUM((hotel_data->>'cost')::numeric) 
        FROM jsonb_array_elements(hotels) AS hotel_data
      ), 0)
    WHEN category = 'Activities' AND activities IS NOT NULL THEN 
      COALESCE((
        SELECT SUM((activity_data->>'cost')::numeric) 
        FROM jsonb_array_elements(activities) AS activity_data
      ), 0)
    ELSE 0
  END as spent_amount
FROM public.itinerary
CROSS JOIN (
  VALUES 
    ('Flights'),
    ('Accommodation'), 
    ('Activities'),
    ('Dining'),
    ('Transportation'),
    ('Shopping'),
    ('Miscellaneous')
) AS categories(category)
WHERE EXISTS (SELECT 1 FROM auth.users WHERE id = userid);