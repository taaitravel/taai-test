-- Fix incorrect coordinates in itin_map_locations for itinerary ID 1
-- First, let's check the current data structure
SELECT itin_map_locations FROM itinerary WHERE id = 1;

-- Update the entire itin_map_locations array with corrected coordinates
UPDATE itinerary 
SET itin_map_locations = '[
  {"city": "Paris, France", "lat": 48.8566, "lng": 2.3522},
  {"city": "Rome, Italy", "lat": 41.9028, "lng": 12.4964},
  {"city": "Barcelona, Spain", "lat": 41.3851, "lng": 2.1734},
  {"city": "Hotel Le Marais, Paris", "lat": 48.8566, "lng": 2.3522, "category": "hotel"},
  {"city": "Eiffel Tower Tour, Paris", "lat": 48.8584, "lng": 2.2945, "category": "activity"},
  {"city": "Le Comptoir du Relais, Paris", "lat": 48.8566, "lng": 2.3522, "category": "reservation"},
  {"city": "Colosseum Skip-the-Line, Rome", "lat": 41.8902, "lng": 12.4922, "category": "activity"}
]'::json
WHERE id = 1;