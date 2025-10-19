import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const openAIApiKey = Deno.env.get('CHAT-GPT-TAAI');
const yelpApiKey = Deno.env.get('YELP_API_KEY');
const rapidApiKey = Deno.env.get('RAPID_API_KEY');

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Define available functions for OpenAI function calling
const functions = [
  {
    name: 'searchHotels',
    description: 'Search hotels by destination and date',
    parameters: {
      type: 'object',
      properties: {
        destination: { type: 'string', description: 'Hotel destination city or location' },
        checkIn: { type: 'string', format: 'date', description: 'Check-in date in YYYY-MM-DD format' },
        checkOut: { type: 'string', format: 'date', description: 'Check-out date in YYYY-MM-DD format' },
        guests: { type: 'number', description: 'Number of guests', default: 2 },
        budget: { type: 'number', description: 'Budget range per night in USD' },
      },
      required: ['destination', 'checkIn', 'checkOut'],
    },
  },
  {
    name: 'searchFlights',
    description: 'Search flights between two cities with dates',
    parameters: {
      type: 'object',
      properties: {
        origin: { type: 'string', description: 'Departure city or airport code' },
        destination: { type: 'string', description: 'Arrival city or airport code' },
        departDate: { type: 'string', format: 'date', description: 'Departure date in YYYY-MM-DD format' },
        returnDate: { type: 'string', format: 'date', description: 'Return date in YYYY-MM-DD format (optional for one-way)' },
        passengers: { type: 'number', description: 'Number of passengers', default: 1 },
        class: { type: 'string', enum: ['economy', 'business', 'first'], description: 'Flight class preference' },
      },
      required: ['origin', 'destination', 'departDate'],
    },
  },
  {
    name: 'searchActivities',
    description: 'Search activities and attractions by destination',
    parameters: {
      type: 'object',
      properties: {
        destination: { type: 'string', description: 'Destination city or location' },
        startDate: { type: 'string', format: 'date', description: 'Activity start date in YYYY-MM-DD format' },
        endDate: { type: 'string', format: 'date', description: 'Activity end date in YYYY-MM-DD format' },
        category: { type: 'string', enum: ['tours', 'attractions', 'outdoor', 'cultural', 'food', 'adventure'], description: 'Activity category' },
        budget: { type: 'number', description: 'Budget range per person in USD' },
      },
      required: ['destination'],
    },
  },
  {
    name: 'searchRestaurants',
    description: 'Search restaurants by destination, cuisine, and preferences',
    parameters: {
      type: 'object',
      properties: {
        destination: { type: 'string', description: 'City or area to search in' },
        cuisine: { type: 'string', description: 'Cuisine or keyword (e.g., sushi, pizza)' },
        price: { type: 'string', description: 'Price levels 1-4 as a comma-separated string (e.g., 1,2,3)' },
        limit: { type: 'number', description: 'Max results to return', default: 20 },
        openNow: { type: 'boolean', description: 'Only show places open now' },
      },
      required: ['destination'],
    },
  },
];

// Mock search functions (replace with real API calls)
async function searchHotels(params: any) {
  console.log('Searching hotels with params:', params);
  // This would typically call a real hotel search API
  return [
    {
      id: `expedia#HOTEL_${params.destination.toUpperCase()}_001`,
      name: `Grand Hotel ${params.destination}`,
      price: 150,
      rating: 4.5,
      location: params.destination,
      checkIn: params.checkIn,
      checkOut: params.checkOut,
      amenities: ['WiFi', 'Pool', 'Spa', 'Restaurant'],
      image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=500&h=300&fit=crop',
      description: `Luxury hotel in the heart of ${params.destination} with premium amenities`,
      coordinates: { lat: 40.7589, lng: -73.9851 },
      source: 'expedia'
    },
    {
      id: `booking#HOTEL_${params.destination.toUpperCase()}_002`,
      name: `Budget Inn ${params.destination}`,
      price: 80,
      rating: 3.8,
      location: params.destination,
      checkIn: params.checkIn,
      checkOut: params.checkOut,
      amenities: ['WiFi', 'Breakfast'],
      image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=500&h=300&fit=crop',
      description: `Comfortable and affordable accommodation in ${params.destination}`,
      coordinates: { lat: 40.7505, lng: -73.9934 },
      source: 'booking'
    },
    {
      id: `hotels#HOTEL_${params.destination.toUpperCase()}_003`,
      name: `Boutique ${params.destination} Hotel`,
      price: 200,
      rating: 4.2,
      location: params.destination,
      checkIn: params.checkIn,
      checkOut: params.checkOut,
      amenities: ['WiFi', 'Restaurant', 'Fitness Center', 'Business Center'],
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&h=300&fit=crop',
      description: `Stylish boutique hotel with modern amenities in ${params.destination}`,
      coordinates: { lat: 40.7614, lng: -73.9776 },
      source: 'hotels.com'
    }
  ];
}

async function searchFlights(params: any) {
  console.log('Searching flights with params:', params);
  
  if (!rapidApiKey) {
    console.warn('RapidAPI key not configured, using mock data');
    return getMockFlights(params);
  }

  try {
    const queryParams = new URLSearchParams({
      origin: params.origin,
      destination: params.destination,
      departure_date: params.departDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      adults: params.passengers?.toString() || '1',
      class: params.class || 'economy'
    });

    if (params.returnDate) {
      queryParams.append('return_date', params.returnDate);
    }

    const response = await fetch(`https://expedia13.p.rapidapi.com/api/v1/flights/search?${queryParams}`, {
      headers: {
        'X-RapidAPI-Key': rapidApiKey,
        'X-RapidAPI-Host': 'expedia13.p.rapidapi.com'
      }
    });

    if (!response.ok) {
      console.error('Expedia Flight API error:', response.status, await response.text());
      return getMockFlights(params);
    }

    const data = await response.json();
    const flights = data.flights || data.results || [];
    
    return flights.slice(0, 10).map((flight: any, index: number) => ({
      id: flight.id || `expedia_flight_${index}`,
      airline: flight.airline || flight.carrier || `Airline ${index + 1}`,
      flight_number: flight.flightNumber || flight.number || `FL${1000 + index}`,
      price: parseFloat((flight.price || flight.displayPrice || '300').replace(/[^0-9.]/g, '')) || 300,
      departure: flight.departureTime || flight.departure || '10:00 AM',
      arrival: flight.arrivalTime || flight.arrival || '2:00 PM',
      from: params.origin,
      to: params.destination,
      duration: flight.duration || '4h 0m',
      stops: flight.stops || 0,
      date: params.departDate,
      images: flight.images || ['https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=500&h=300&fit=crop'],
      booking_status: 'available',
      expedia_property_id: flight.bookingId || flight.id,
      cost: parseFloat((flight.price || flight.displayPrice || '300').replace(/[^0-9.]/g, '')) || 300
    }));
  } catch (error) {
    console.error('Error calling Expedia Flights API:', error);
    return getMockFlights(params);
  }
}

function getMockFlights(params: any) {
  return [
    {
      id: `mock_flight_001`,
      airline: 'Sky Airlines',
      flight_number: 'SA1234',
      price: 350,
      departure: '10:30 AM',
      arrival: '2:45 PM',
      from: params.origin,
      to: params.destination,
      duration: '4h 15m',
      stops: 0,
      date: params.departDate,
      images: ['https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=500&h=300&fit=crop'],
      booking_status: 'available',
      expedia_property_id: 'mock_flight_001',
      cost: 350
    },
    {
      id: `mock_flight_002`,
      airline: 'Global Airways',
      flight_number: 'GA5678',
      price: 420,
      departure: '2:15 PM',
      arrival: '6:30 PM',
      from: params.origin,
      to: params.destination,
      duration: '4h 15m',
      stops: 0,
      date: params.departDate,
      images: ['https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=500&h=300&fit=crop'],
      booking_status: 'available',
      expedia_property_id: 'mock_flight_002',
      cost: 420
    }
  ];
}

async function searchActivities(params: any) {
  console.log('Searching activities with params:', params);
  
  // For now, return enhanced mock data with better structure
  return [
    {
      id: `activity_${params.destination}_001`,
      name: `City Tour of ${params.destination}`,
      price: 45,
      duration: '3 hours',
      rating: 4.7,
      category: 'tours',
      location: params.destination,
      images: ['https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=500&h=300&fit=crop'],
      description: `Guided walking tour of ${params.destination}`,
      date: params.startDate || new Date().toISOString().split('T')[0],
      booking_status: 'available',
      expedia_property_id: `activity_001_${params.destination}`,
      cost: 45
    },
    {
      id: `activity_${params.destination}_002`,
      name: `${params.destination} Food Experience`,
      price: 65,
      duration: '2.5 hours',
      rating: 4.9,
      category: 'food',
      location: params.destination,
      images: ['https://images.unsplash.com/photo-1555939594-58e9c029d071?w=500&h=300&fit=crop'],
      description: `Culinary adventure through ${params.destination}`,
      date: params.startDate || new Date().toISOString().split('T')[0],
      booking_status: 'available',
      expedia_property_id: `activity_002_${params.destination}`,
      cost: 65
    },
    {
      id: `activity_${params.destination}_003`,
      name: `${params.destination} Adventure Tour`,
      price: 120,
      duration: '6 hours',
      rating: 4.8,
      category: 'adventure',
      location: params.destination,
      images: ['https://images.unsplash.com/photo-1551632811-561732d1e306?w=500&h=300&fit=crop'],
      description: `Thrilling adventure experience in ${params.destination}`,
      date: params.startDate || new Date().toISOString().split('T')[0],
      booking_status: 'available',
      expedia_property_id: `activity_003_${params.destination}`,
      cost: 120
    }
  ];
}

async function searchRestaurants(params: any) {
  if (!yelpApiKey) {
    throw new Error('Yelp API key not configured');
  }
  const queryParams: Record<string, string> = {
    term: params.cuisine || 'restaurants',
    location: params.destination,
    limit: String(params.limit || 20),
    sort_by: 'best_match',
  };
  if (params.price) queryParams.price = params.price; // e.g., '1,2,3'
  if (params.openNow) queryParams.open_now = 'true';

  const query = new URLSearchParams(queryParams).toString();
  const url = `https://api.yelp.com/v3/businesses/search?${query}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${yelpApiKey}` },
  });
  if (!res.ok) {
    const errText = await res.text();
    console.error('Yelp API error:', res.status, errText);
    throw new Error(`Yelp API error: ${res.status}`);
  }
  const data = await res.json();
  const businesses = data.businesses || [];
  const restaurants = businesses.map((b: any) => ({
    id: b.id,
    name: b.name,
    price: 0,
    image: b.image_url,
    description: b.location?.display_address?.join(', '),
    location: b.location?.address1 || b.location?.city || params.destination,
    city: b.location?.city || params.destination,
    cuisine: (b.categories || []).map((c: any) => c.title).join(', '),
    rating: b.rating,
    priceRange: b.price,
    coordinates: b.coordinates,
    url: b.url,
    source: 'yelp',
  }));
  return restaurants;
}

// Helper function to get user's itineraries
async function getUserItineraries(userId: string) {
  try {
    const { data: itineraries, error } = await supabase
      .from('itinerary')
      .select('id, itin_name, itin_desc, itin_date_start, itin_date_end, itin_locations')
      .eq('userid', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user itineraries:', error);
      return [];
    }

    return itineraries || [];
  } catch (error) {
    console.error('Error in getUserItineraries:', error);
    return [];
  }
}

// Helper function to add items to itinerary
async function addToItinerary(userId: string, itineraryId: string, item: any, type: string) {
  try {
    const { data: itinerary, error: fetchError } = await supabase
      .from('itinerary')
      .select('*')
      .eq('id', itineraryId)
      .eq('userid', userId)
      .single();

    if (fetchError || !itinerary) {
      console.error('Error fetching itinerary:', fetchError);
      return false;
    }

    // Update the appropriate JSON field
    const currentData = itinerary[type + 's'] || [];
    const newData = [...currentData, item];

    const { error: updateError } = await supabase
      .from('itinerary')
      .update({ [type + 's']: newData })
      .eq('id', itineraryId)
      .eq('userid', userId);

    if (updateError) {
      console.error('Error updating itinerary:', updateError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in addToItinerary:', error);
    return false;
  }
}

// Input validation schema
const chatSchema = z.object({
  message: z.string().min(1).max(5000),
  context: z.string().max(2000).optional(),
  userId: z.string().uuid().optional(),
  itineraryId: z.string().uuid().optional()
});

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
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

    // Validate and parse input
    const rawData = await req.json();
    let validatedData;
    
    try {
      validatedData = chatSchema.parse(rawData);
    } catch (validationError) {
      console.error('Validation error:', validationError);
      return new Response(
        JSON.stringify({ error: 'Invalid input parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { message, context, userId, itineraryId } = validatedData;

    console.log('Received chat request:', { message, context, userId, itineraryId });

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Get user's existing itineraries for context
    let userItineraries = [];
    if (userId) {
      userItineraries = await getUserItineraries(userId);
    }

    const itineraryContext = userItineraries.length > 0 
      ? `\n\nUser's existing itineraries:\n${userItineraries.map(it => 
          `- ${it.itin_name} (ID: ${it.id}): ${it.itin_desc || 'No description'} | Dates: ${it.itin_date_start} to ${it.itin_date_end} | Locations: ${Array.isArray(it.itin_locations) ? it.itin_locations.map(loc => loc.name || loc).join(', ') : 'None'}`
        ).join('\n')}`
      : '\n\nUser has no existing itineraries.';

    const systemPrompt = `You are TAAI (Travel AI Assistant), an elite travel planning AI assistant built to help users organize and optimize their trips. You specialize in:

- Comprehensive trip planning and itinerary creation
- Budget optimization and cost analysis
- Flight, hotel, and activity recommendations with real Expedia integration
- Travel logistics and booking assistance
- Destination insights and local recommendations
- Travel safety and document requirements
- Personalized travel experiences based on preferences

IMPORTANT BOOKING FLOW INSTRUCTIONS:
1. When users ask about travel options, use the search functions to get real data from Expedia
2. Always ask for MINIMUM required parameters: destination, dates, and preferences
3. After showing search results, guide users to swipe through options using the card interface
4. When users want to book or add items to itinerary, reference their existing itineraries by name/ID
5. If they want to create a new itinerary, ask for a name and basic details first
6. Always confirm which itinerary they want to modify before making changes

${context ? `Current Context: ${context}` : ''}${itineraryContext}

${itineraryId ? `Currently working with itinerary ID: ${itineraryId}` : 'No specific itinerary selected.'}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        functions: functions,
        function_call: 'auto',
        max_tokens: 1500,
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    console.log('OpenAI response:', data);

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${data.error?.message || 'Unknown error'}`);
    }

    const choice = data.choices[0];

    // Check if OpenAI wants to call a function
    if (choice.finish_reason === 'function_call' && choice.message.function_call) {
      const functionCall = choice.message.function_call;
      const functionName = functionCall.name;
      const functionArgs = JSON.parse(functionCall.arguments || '{}');

      console.log(`Executing function: ${functionName}`, functionArgs);

      let searchResults;
      let resultType;

      // Execute the appropriate search function
      switch (functionName) {
        case 'searchHotels':
          searchResults = await searchHotels(functionArgs);
          resultType = 'hotels';
          break;
        case 'searchFlights':
          searchResults = await searchFlights(functionArgs);
          resultType = 'flights';
          break;
        case 'searchActivities':
          searchResults = await searchActivities(functionArgs);
          resultType = 'activities';
          break;
        case 'searchRestaurants':
          searchResults = await searchRestaurants(functionArgs);
          resultType = 'restaurants';
          break;
        default:
          throw new Error(`Unknown function: ${functionName}`);
      }

      // Generate a follow-up response with the search results
      const followUpResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message },
            { role: 'assistant', content: null, function_call: functionCall },
            { role: 'function', name: functionName, content: JSON.stringify(searchResults) }
          ],
          max_tokens: 1000,
          temperature: 0.7,
        }),
      });

      const followUpData = await followUpResponse.json();
      const aiResponse = followUpData.choices[0].message.content;

      const payload: any = { 
        response: aiResponse,
        searchResults: searchResults,
        resultType: resultType,
        functionUsed: functionName 
      };
      if (resultType === 'hotels') payload.hotels = searchResults;
      if (resultType === 'flights') payload.flights = searchResults;
      if (resultType === 'activities') payload.activities = searchResults;
      if (resultType === 'restaurants') payload.restaurants = searchResults;

      return new Response(JSON.stringify(payload), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // No function call, return regular response
    const aiResponse = choice.message.content;

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in chat-with-gpt function:', error);
    return new Response(
      JSON.stringify({ error: 'Unable to process chat request. Please try again.' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});