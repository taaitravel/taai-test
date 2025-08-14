-- Fix incorrect coordinates in itin_map_locations for itinerary ID 1
-- Update Hotel Le Marais coordinates to correct Paris location
UPDATE itinerary 
SET itin_map_locations = jsonb_set(
    itin_map_locations,
    '{3}',
    '{"city": "Hotel Le Marais, Paris", "lat": 48.8566, "lng": 2.3522, "category": "hotel"}'
)
WHERE id = 1;

-- Update Eiffel Tower Tour coordinates to correct Paris location  
UPDATE itinerary 
SET itin_map_locations = jsonb_set(
    itin_map_locations,
    '{4}',
    '{"city": "Eiffel Tower Tour, Paris", "lat": 48.8584, "lng": 2.2945, "category": "activity"}'
)
WHERE id = 1;

-- Update Le Comptoir du Relais coordinates to correct Paris location
UPDATE itinerary 
SET itin_map_locations = jsonb_set(
    itin_map_locations,
    '{5}',
    '{"city": "Le Comptoir du Relais, Paris", "lat": 48.8566, "lng": 2.3522, "category": "reservation"}'
)
WHERE id = 1;

-- Update Colosseum Skip-the-Line coordinates to correct Rome location
UPDATE itinerary 
SET itin_map_locations = jsonb_set(
    itin_map_locations,
    '{6}',
    '{"city": "Colosseum Skip-the-Line, Rome", "lat": 41.8902, "lng": 12.4922, "category": "activity"}'
)
WHERE id = 1;