-- Add image and expedia data support to existing itinerary tables
ALTER TABLE public.itinerary 
ADD COLUMN IF NOT EXISTS expedia_data jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS images jsonb DEFAULT '[]';

-- Update existing itineraries with sample Expedia data and images
UPDATE public.itinerary 
SET 
  -- Add sample hotel images and enhanced data
  hotels = (
    SELECT jsonb_agg(
      hotel_item || jsonb_build_object(
        'images', CASE 
          WHEN (hotel_item->>'name') ILIKE '%waldorf%' THEN 
            jsonb_build_array('https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800', 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800', 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800')
          WHEN (hotel_item->>'name') ILIKE '%standard%' THEN
            jsonb_build_array('https://images.unsplash.com/photo-1578874691223-64558a3ca096?w=800', 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800')
          ELSE 
            jsonb_build_array('https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800', 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800')
        END,
        'booking_status', 'confirmed',
        'expedia_property_id', 'prop_' || floor(random() * 100000)::text,
        'location', COALESCE(hotel_item->>'city', 'Miami'),
        'rating', COALESCE((hotel_item->>'rating')::numeric, 4.2),
        'price', hotel_item->>'cost'
      )
    )
    FROM jsonb_array_elements(COALESCE(hotels::jsonb, '[]'::jsonb)) AS hotel_item
    WHERE jsonb_array_length(COALESCE(hotels::jsonb, '[]'::jsonb)) > 0
  ),
  
  -- Add sample activity images and enhanced data
  activities = (
    SELECT jsonb_agg(
      activity_item || jsonb_build_object(
        'images', CASE 
          WHEN (activity_item->>'name') ILIKE '%yoga%' THEN 
            jsonb_build_array('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800', 'https://images.unsplash.com/photo-1593811167562-9cef47bfc4d7?w=800')
          WHEN (activity_item->>'name') ILIKE '%tour%' OR (activity_item->>'name') ILIKE '%museum%' THEN
            jsonb_build_array('https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=800', 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800')
          ELSE 
            jsonb_build_array('https://images.unsplash.com/photo-1539650116574-75c0c6d73c6e?w=800', 'https://images.unsplash.com/photo-1534361960057-19889db9621e?w=800')
        END,
        'booking_status', 'confirmed',
        'location', COALESCE(activity_item->>'city', 'Miami'),
        'rating', CASE 
          WHEN random() > 0.5 THEN 4.5
          ELSE 4.8
        END,
        'price', activity_item->>'cost'
      )
    )
    FROM jsonb_array_elements(COALESCE(activities::jsonb, '[]'::jsonb)) AS activity_item
    WHERE jsonb_array_length(COALESCE(activities::jsonb, '[]'::jsonb)) > 0
  ),
  
  -- Add sample reservation images and enhanced data
  reservations = (
    SELECT jsonb_agg(
      reservation_item || jsonb_build_object(
        'images', CASE 
          WHEN (reservation_item->>'name') ILIKE '%lpm%' THEN 
            jsonb_build_array('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800', 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800')
          ELSE 
            jsonb_build_array('https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800', 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800')
        END,
        'booking_status', 'confirmed',
        'location', COALESCE(reservation_item->>'city', 'Miami'),
        'cuisine', CASE 
          WHEN (reservation_item->>'type') = 'restaurant' THEN 
            CASE 
              WHEN random() > 0.7 THEN 'Italian'
              WHEN random() > 0.4 THEN 'American'
              ELSE 'Mediterranean'
            END
          ELSE 'N/A'
        END
      )
    )
    FROM jsonb_array_elements(COALESCE(reservations::jsonb, '[]'::jsonb)) AS reservation_item
    WHERE jsonb_array_length(COALESCE(reservations::jsonb, '[]'::jsonb)) > 0
  ),
  
  -- Add Expedia metadata
  expedia_data = jsonb_build_object(
    'last_sync', now(),
    'booking_source', 'expedia_rapid_api',
    'commission_rate', 0.10,
    'total_bookings', 
      COALESCE(jsonb_array_length(COALESCE(hotels::jsonb, '[]'::jsonb)), 0) + 
      COALESCE(jsonb_array_length(COALESCE(activities::jsonb, '[]'::jsonb)), 0) + 
      COALESCE(jsonb_array_length(COALESCE(reservations::jsonb, '[]'::jsonb)), 0)
  )
WHERE (expedia_data IS NULL OR expedia_data = '{}') 
  AND (hotels IS NOT NULL OR activities IS NOT NULL OR reservations IS NOT NULL);