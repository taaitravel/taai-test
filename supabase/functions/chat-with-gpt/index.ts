import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('CHAT-GPT-TAAI');
const yelpApiKey = Deno.env.get('YELP_API_KEY');

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
  // This would typically call a real flight search API
  return [
    {
      airline: 'Sky Airlines',
      price: 350,
      departure: `${params.origin} 10:30 AM`,
      arrival: `${params.destination} 2:45 PM`,
      duration: '4h 15m',
      stops: 0,
      date: params.departDate,
    },
    {
      airline: 'Global Airways',
      price: 420,
      departure: `${params.origin} 2:15 PM`,
      arrival: `${params.destination} 6:30 PM`,
      duration: '4h 15m',
      stops: 0,
      date: params.departDate,
    },
  ];
}

async function searchActivities(params: any) {
  console.log('Searching activities with params:', params);
  // This would typically call a real activities search API
  return [
    {
      name: `City Tour of ${params.destination}`,
      price: 45,
      duration: '3 hours',
      rating: 4.7,
      category: 'tours',
      description: `Guided walking tour of ${params.destination}`,
    },
    {
      name: `${params.destination} Food Experience`,
      price: 65,
      duration: '2.5 hours',
      rating: 4.9,
      category: 'food',
      description: `Culinary adventure through ${params.destination}`,
    },
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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, context } = await req.json();

    console.log('Received chat request:', { message, context });

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const systemPrompt = `You are TAAI (Travel AI Assistant), an elite travel planning AI assistant built to help users organize and optimize their trips. You specialize in:

- Comprehensive trip planning and itinerary creation
- Budget optimization and cost analysis
- Flight, hotel, and activity recommendations
- Travel logistics and booking assistance
- Destination insights and local recommendations
- Travel safety and document requirements
- Personalized travel experiences based on preferences

You have access to search functions for hotels, flights, and activities. When users ask about travel options, use the appropriate search functions to provide real-time recommendations. Always be helpful, professional, and focus on creating amazing travel experiences.

${context ? `Current Context: ${context}` : ''}`;

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
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});