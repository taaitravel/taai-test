-- Enable RLS on itinerary table
ALTER TABLE public.itinerary ENABLE ROW LEVEL SECURITY;

-- Create policies for itinerary table
CREATE POLICY "Users can view their own itineraries" 
ON public.itinerary 
FOR SELECT 
USING (auth.uid() = userid);

CREATE POLICY "Users can create their own itineraries" 
ON public.itinerary 
FOR INSERT 
WITH CHECK (auth.uid() = userid);

CREATE POLICY "Users can update their own itineraries" 
ON public.itinerary 
FOR UPDATE 
USING (auth.uid() = userid);

CREATE POLICY "Users can delete their own itineraries" 
ON public.itinerary 
FOR DELETE 
USING (auth.uid() = userid);

-- Insert mock itinerary data for demo purposes
INSERT INTO public.itinerary (
  userid,
  itin_name,
  itin_desc,
  itin_date_start,
  itin_date_end,
  budget,
  spending,
  budget_rate,
  b_efficiency_rate,
  user_type,
  itin_locations,
  itin_map_locations,
  attendees,
  flights,
  hotels,
  activities,
  reservations
) VALUES (
  '7acde04e-5e39-4815-9c29-affc7c4c5937'::uuid,
  'European Adventure',
  'A romantic getaway through Europe''s most beautiful cities including Paris, Rome, and Barcelona',
  '2024-07-15',
  '2024-07-25',
  5000.00,
  4200.00,
  0.84,
  0.92,
  'individual',
  '["Paris, France", "Rome, Italy", "Barcelona, Spain"]'::json,
  '[{"city": "Paris", "lat": 48.8566, "lng": 2.3522}, {"city": "Rome", "lat": 41.9028, "lng": 12.4964}, {"city": "Barcelona", "lat": 41.3851, "lng": 2.1734}]'::json,
  '[{"id": 1, "name": "John Smith", "email": "john@example.com", "avatar": "👨‍💼", "status": "confirmed"}, {"id": 2, "name": "Sarah Johnson", "email": "sarah@example.com", "avatar": "👩‍💼", "status": "confirmed"}]'::json,
  '[{"airline": "Air France", "flight_number": "AF1234", "departure": "2024-07-15T10:00:00Z", "arrival": "2024-07-15T14:30:00Z", "from": "JFK", "to": "CDG", "cost": 650}, {"airline": "Lufthansa", "flight_number": "LH5678", "departure": "2024-07-18T16:00:00Z", "arrival": "2024-07-18T18:45:00Z", "from": "CDG", "to": "FCO", "cost": 320}]'::json,
  '[{"name": "Hotel Le Marais", "city": "Paris", "check_in": "2024-07-15", "check_out": "2024-07-18", "nights": 3, "cost": 450, "rating": 4.5}, {"name": "Hotel Artemide", "city": "Rome", "check_in": "2024-07-18", "check_out": "2024-07-22", "nights": 4, "cost": 600, "rating": 4.7}]'::json,
  '[{"name": "Eiffel Tower Tour", "city": "Paris", "date": "2024-07-16", "cost": 45, "duration": "2 hours"}, {"name": "Colosseum Skip-the-Line", "city": "Rome", "date": "2024-07-19", "cost": 55, "duration": "3 hours"}, {"name": "Sagrada Familia Tour", "city": "Barcelona", "date": "2024-07-23", "cost": 35, "duration": "2.5 hours"}]'::json,
  '[{"type": "restaurant", "name": "Le Comptoir du Relais", "city": "Paris", "date": "2024-07-16", "time": "19:30", "party_size": 2}, {"type": "museum", "name": "Vatican Museums", "city": "Rome", "date": "2024-07-20", "time": "09:00", "party_size": 2}]'::json
),
(
  '7acde04e-5e39-4815-9c29-affc7c4c5937'::uuid,
  'Tokyo Business Trip',
  'Business meetings and cultural exploration in Tokyo with visits to key districts',
  '2024-08-10',
  '2024-08-17',
  3500.00,
  3200.00,
  0.91,
  0.88,
  'business',
  '["Tokyo, Japan", "Osaka, Japan"]'::json,
  '[{"city": "Tokyo", "lat": 35.6762, "lng": 139.6503}, {"city": "Osaka", "lat": 34.6937, "lng": 135.5023}]'::json,
  '[{"id": 1, "name": "Michael Chen", "email": "m.chen@company.com", "avatar": "👨‍💻", "status": "confirmed"}]'::json,
  '[{"airline": "JAL", "flight_number": "JL006", "departure": "2024-08-10T11:30:00Z", "arrival": "2024-08-11T15:45:00Z", "from": "LAX", "to": "NRT", "cost": 1200}]'::json,
  '[{"name": "Park Hyatt Tokyo", "city": "Tokyo", "check_in": "2024-08-11", "check_out": "2024-08-15", "nights": 4, "cost": 800, "rating": 5.0}, {"name": "The Ritz-Carlton Osaka", "city": "Osaka", "check_in": "2024-08-15", "check_out": "2024-08-17", "nights": 2, "cost": 400, "rating": 4.8}]'::json,
  '[{"name": "Tokyo Tower Observation", "city": "Tokyo", "date": "2024-08-12", "cost": 25, "duration": "1.5 hours"}, {"name": "Tsukiji Fish Market Tour", "city": "Tokyo", "date": "2024-08-13", "cost": 40, "duration": "3 hours"}]'::json,
  '[{"type": "business", "name": "Tokyo Tech Conference", "city": "Tokyo", "date": "2024-08-12", "time": "09:00", "party_size": 1}, {"type": "restaurant", "name": "Sukiyabashi Jiro", "city": "Tokyo", "date": "2024-08-13", "time": "20:00", "party_size": 1}]'::json
);