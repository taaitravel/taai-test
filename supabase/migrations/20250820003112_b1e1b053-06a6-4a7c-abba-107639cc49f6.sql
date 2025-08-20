-- Add image and expedia data support to existing itinerary tables
ALTER TABLE public.itinerary 
ADD COLUMN IF NOT EXISTS expedia_data jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS images jsonb DEFAULT '[]';

-- Update existing itineraries with sample Expedia data
UPDATE public.itinerary 
SET 
  -- Add sample hotel images
  hotels = CASE 
    WHEN hotels IS NOT NULL AND jsonb_array_length(hotels) > 0 THEN
      jsonb_agg(
        hotel || jsonb_build_object(
          'images', CASE 
            WHEN (hotel->>'name') ILIKE '%waldorf%' THEN 
              jsonb_build_array('https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800', 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800', 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800')
            WHEN (hotel->>'name') ILIKE '%standard%' THEN
              jsonb_build_array('https://images.unsplash.com/photo-1578874691223-64558a3ca096?w=800', 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800')
            ELSE 
              jsonb_build_array('https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800', 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800')
          END,
          'booking_status', 'confirmed',
          'expedia_property_id', 'prop_' || floor(random() * 100000)::text,
          'location', hotel->>'city',
          'rating', COALESCE((hotel->>'rating')::numeric, 4.2)
        )
      )
    ELSE hotels
  END,
  -- Add sample activity images
  activities = CASE 
    WHEN activities IS NOT NULL AND jsonb_array_length(activities) > 0 THEN
      jsonb_agg(
        activity || jsonb_build_object(
          'images', CASE 
            WHEN (activity->>'name') ILIKE '%yoga%' THEN 
              jsonb_build_array('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800', 'https://images.unsplash.com/photo-1593811167562-9cef47bfc4d7?w=800')
            WHEN (activity->>'name') ILIKE '%tour%' OR (activity->>'name') ILIKE '%museum%' THEN
              jsonb_build_array('https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=800', 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800')
            ELSE 
              jsonb_build_array('https://images.unsplash.com/photo-1539650116574-75c0c6d73c6e?w=800', 'https://images.unsplash.com/photo-1534361960057-19889db9621e?w=800')
          END,
          'booking_status', 'confirmed',
          'location', activity->>'city',
          'rating', CASE 
            WHEN random() > 0.5 THEN 4.5
            ELSE 4.8
          END
        )
      )
    ELSE activities
  END,
  -- Add sample reservation images  
  reservations = CASE 
    WHEN reservations IS NOT NULL AND jsonb_array_length(reservations) > 0 THEN
      jsonb_agg(
        reservation || jsonb_build_object(
          'images', CASE 
            WHEN (reservation->>'name') ILIKE '%lpm%' THEN 
              jsonb_build_array('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800', 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800')
            ELSE 
              jsonb_build_array('https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800', 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800')
          END,
          'booking_status', 'confirmed',
          'location', reservation->>'city',
          'cuisine', CASE 
            WHEN (reservation->>'type') = 'restaurant' THEN 
              CASE 
                WHEN random() > 0.7 THEN 'Italian'
                WHEN random() > 0.4 THEN 'American'
                ELSE 'Mediterranean'
              END
            ELSE 'N/A'
          END
        )
      )
    ELSE reservations
  END,
  -- Add Expedia metadata
  expedia_data = jsonb_build_object(
    'last_sync', now(),
    'booking_source', 'expedia_rapid_api',
    'commission_rate', 0.10,
    'total_bookings', COALESCE(jsonb_array_length(hotels), 0) + COALESCE(jsonb_array_length(activities), 0) + COALESCE(jsonb_array_length(reservations), 0)
  )
FROM (
  SELECT 
    id,
    CASE 
      WHEN hotels IS NOT NULL AND jsonb_array_length(hotels) > 0 THEN
        (SELECT jsonb_agg(value) FROM jsonb_array_elements(hotels))
      ELSE NULL
    END as hotel_array,
    CASE 
      WHEN activities IS NOT NULL AND jsonb_array_length(activities) > 0 THEN
        (SELECT jsonb_agg(value) FROM jsonb_array_elements(activities))
      ELSE NULL
    END as activity_array,
    CASE 
      WHEN reservations IS NOT NULL AND jsonb_array_length(reservations) > 0 THEN
        (SELECT jsonb_agg(value) FROM jsonb_array_elements(reservations))
      ELSE NULL
    END as reservation_array
  FROM public.itinerary
  WHERE id = itinerary.id
) subquery
WHERE itinerary.expedia_data IS NULL OR itinerary.expedia_data = '{}';