import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Input validation schema
const searchSchema = z.object({
  type: z.enum(['flights', 'hotels', 'activities']),
  origin: z.string().min(2).max(100).optional(),
  destination: z.string().min(2).max(100),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD'),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD'),
  guests: z.number().min(1).max(20),
  budget: z.number().min(0).max(1000000).optional()
});

interface SearchRequest {
  type: 'flights' | 'hotels' | 'activities';
  origin?: string;
  destination: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  budget?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      console.error('Authentication failed:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User authenticated:', user.id);

    // Validate input
    const rawData = await req.json();
    let validatedData: SearchRequest;
    
    try {
      validatedData = searchSchema.parse(rawData);
    } catch (validationError) {
      console.error('Validation error:', validationError);
      return new Response(
        JSON.stringify({ error: 'Invalid input parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { type, origin, destination, checkIn, checkOut, guests, budget } = validatedData;

    console.log(`Searching for ${type}:`, { origin, destination, checkIn, checkOut, guests, budget });

    // Mock data for now - replace with real API calls
    let results;

    switch (type) {
      case 'flights':
        results = await searchFlights(origin!, destination, checkIn, checkOut, guests);
        break;
      case 'hotels':
        results = await searchHotels(destination, checkIn, checkOut, guests, budget);
        break;
      case 'activities':
        results = await searchActivities(destination, checkIn, checkOut);
        break;
      default:
        throw new Error('Invalid search type');
    }

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in search-travel-options function:', error);
    return new Response(
      JSON.stringify({ error: 'Unable to process search request. Please try again.' }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// Mock flight search - replace with real API integration
async function searchFlights(origin: string, destination: string, departDate: string, returnDate: string, passengers: number) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    flights: [
      {
        id: 'flight-1',
        airline: 'Premium Airways',
        flight_number: 'PA123',
        origin,
        destination,
        departure_time: '08:30',
        arrival_time: '12:45',
        price: 450,
        duration: '4h 15m',
        stops: 0,
        aircraft: 'Boeing 737',
        available_seats: 12
      },
      {
        id: 'flight-2',
        airline: 'Sky Connect',
        flight_number: 'SC456',
        origin,
        destination,
        departure_time: '14:20',
        arrival_time: '18:55',
        price: 380,
        duration: '4h 35m',
        stops: 1,
        aircraft: 'Airbus A320',
        available_seats: 8
      },
      {
        id: 'flight-3',
        airline: 'Luxury Jets',
        flight_number: 'LJ789',
        origin,
        destination,
        departure_time: '19:15',
        arrival_time: '23:30',
        price: 650,
        duration: '4h 15m',
        stops: 0,
        aircraft: 'Boeing 787',
        available_seats: 6,
        class: 'Business'
      }
    ]
  };
}

// Mock hotel search - replace with real API integration
async function searchHotels(destination: string, checkIn: string, checkOut: string, guests: number, budget?: number) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1200));
  
  return {
    hotels: [
      {
        id: 'hotel-1',
        name: 'Grand Palace Hotel',
        address: `123 Luxury Ave, ${destination}`,
        rating: 4.8,
        price_per_night: 280,
        total_price: 840, // 3 nights
        amenities: ['WiFi', 'Pool', 'Spa', 'Restaurant', 'Gym'],
        images: ['/api/placeholder/300/200'],
        room_type: 'Deluxe Suite',
        cancellation: 'Free cancellation until 24h before',
        breakfast_included: true
      },
      {
        id: 'hotel-2',
        name: 'Urban Boutique Inn',
        address: `456 Downtown St, ${destination}`,
        rating: 4.5,
        price_per_night: 180,
        total_price: 540, // 3 nights
        amenities: ['WiFi', 'Restaurant', 'Bar', 'Concierge'],
        images: ['/api/placeholder/300/200'],
        room_type: 'Premium Room',
        cancellation: 'Free cancellation until 48h before',
        breakfast_included: false
      },
      {
        id: 'hotel-3',
        name: 'Luxury Resort & Spa',
        address: `789 Beachfront Blvd, ${destination}`,
        rating: 5.0,
        price_per_night: 450,
        total_price: 1350, // 3 nights
        amenities: ['WiFi', 'Private Beach', 'Multiple Pools', 'Full Spa', 'Fine Dining', 'Golf Course'],
        images: ['/api/placeholder/300/200'],
        room_type: 'Ocean View Villa',
        cancellation: 'Free cancellation until 7 days before',
        breakfast_included: true,
        all_inclusive: true
      }
    ]
  };
}

// Mock activities search - replace with real API integration
async function searchActivities(destination: string, startDate: string, endDate: string) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  return {
    activities: [
      {
        id: 'activity-1',
        name: 'City Walking Tour',
        description: 'Explore the historic downtown area with a local guide',
        price: 45,
        duration: '3 hours',
        rating: 4.7,
        category: 'Sightseeing',
        includes: ['Professional guide', 'Small group (max 12)', 'Photo stops']
      },
      {
        id: 'activity-2',
        name: 'Helicopter Sunset Tour',
        description: 'Breathtaking aerial views of the city skyline',
        price: 280,
        duration: '45 minutes',
        rating: 4.9,
        category: 'Adventure',
        includes: ['Professional pilot', 'Safety briefing', 'Photos included']
      },
      {
        id: 'activity-3',
        name: 'Wine Tasting Experience',
        description: 'Sample premium local wines with cheese pairings',
        price: 85,
        duration: '2.5 hours',
        rating: 4.6,
        category: 'Food & Drink',
        includes: ['6 wine tastings', 'Artisan cheese board', 'Sommelier guide']
      }
    ]
  };
}