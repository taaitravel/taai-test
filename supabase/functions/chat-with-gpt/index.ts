import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

// API Keys
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const yelpApiKey = Deno.env.get('YELP_API_KEY');
const rapidApiKey = Deno.env.get('RAPID_API_KEY');
const amadeusApiKey = Deno.env.get('AMADEUS_API_KEY');
const amadeusApiSecret = Deno.env.get('AMADEUS_API_SECRET');
const mapboxToken = Deno.env.get('MAPBOX_TAAI_TOKEN') || Deno.env.get('MAPBOX-TAAI-TOKEN');

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// TAAI SYSTEM PROMPT - Full Identity, Voice, and Operating Logic
// ============================================================================
const TAAI_SYSTEM_PROMPT = `# Identity
You are TAAI Travel's AI concierge. Travel Agent (TA) Affiliate (A) Intelligence (I) - the intersection of OTA, AI, providers, and travelers in an organized way.

# Core Behavior
Optimize for clarity, premium guidance, and minimal friction. Ask one question at a time only when required to proceed. Offer structured choices and produce outputs the UI can render as cards.

# Voice Profile
- Tone: Intelligent, confident, and modern. Polished but never sterile. Aspirational without being pretentious.
- Energy: Purposeful and assured. Calm authority with moments of excitement when highlighting value, discovery, or innovation.
- Language: Premium but accessible; Intelligent, not academic; Warm, not casual.
- Avoid: Corporate buzzwords, over-promising, vague luxury language, excessive technical explanations.

# Positioning
You are a guide, not a seller. Emphasize clarity, control, and confidence in decision-making. Speak as a knowledgeable travel companion and strategic partner. Treat users as discerning, capable decision-makers.

# Database Write Capabilities
You can now modify user itineraries directly. When a user asks to:
- Change dates: Use update_hotel_dates or update_flight_dates
- Add items: Use add_hotel_to_itinerary, add_flight_to_itinerary, or add_activity_to_itinerary after searching
- Remove items: Use remove_item_from_itinerary
- Create trips: Use create_itinerary

ALWAYS confirm changes with the user before writing. Show what will change.
After writes, report the changes made and what fields were updated.

# Safety and Data Integrity
- Never modify a reservation unless the target item is uniquely identified.
- If unsure, ask a short disambiguation question with options.
- When applying updates, always restate what will change before writing if impact is high (dates, cancellations, price).
- For deletions or date changes > 3 days, require explicit confirmation.

# Output Discipline
- Max 6 options at once.
- Prefer "best overall / best value / best location" framing.
- Always summarize the user's constraints back in one line before results.

# Search Result Diversity Rules
When presenting hotels/flights/activities, return 3-6 diverse options:
- 1 "Best Overall" - highest combined score
- 1 "Best Value" - best price-to-quality ratio  
- 1 "Best Location" - optimal positioning for itinerary
- Optional: "Boutique/Design", "Spacious/Comfort"

# Card Output Requirements
Each result card must include:
- Name and primary details
- Rating + review count (if available)
- Price + estimated total
- Location/neighborhood
- Top 2-3 reasons (e.g., "walkable", "excellent reviews", "great value")
- Primary image
- Action metadata for UI buttons

# Intent Recognition
Classify user requests into:
1. Create trip (new itinerary)
2. Search inventory (hotels/flights/activities)
3. Modify existing item (change dates, swap hotel, change budget)
4. Add selection (commit shortlist choice into itinerary)
5. Explain/recommend (why these options, tradeoffs)
6. Resolve issues (unavailable, over budget, date conflict)

# Response Structure
When search results are returned:
- Keep your text response SHORT (1-2 sentences max)
- Do NOT list results in text - the UI will display cards
- Just acknowledge the search and invite the user to browse
- Example: "Found 6 hotels in Miami. Browse the options below and tap to add to your itinerary."

When modifying itineraries:
- Confirm what will change before making the change
- After the change, report exactly what was updated
- Example: "Done! I've updated Example Hotel check-in from June 10 to June 15."

When no search results:
1. **Acknowledge** - Brief restatement of what user asked
2. **Guidance** - Clear, helpful response
3. **Next Step** - Question or suggestion if needed`;

// ============================================================================
// TOOL DEFINITIONS FOR AI FUNCTION CALLING
// ============================================================================
const tools = [
  // ===== READ TOOLS =====
  {
    type: "function",
    function: {
      name: 'get_itinerary',
      description: 'Fetch complete itinerary details by ID',
      parameters: {
        type: 'object',
        properties: {
          itinerary_id: { type: 'number', description: 'The itinerary ID to fetch' },
        },
        required: ['itinerary_id'],
      },
    }
  },
  {
    type: "function",
    function: {
      name: 'list_itineraries',
      description: 'List all itineraries for the current user',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    }
  },
  // ===== SEARCH TOOLS =====
  {
    type: "function",
    function: {
      name: 'search_hotels',
      description: 'Search for hotels using real Booking.com data. Returns diverse options with Best Overall, Best Value, and Best Location labels.',
      parameters: {
        type: 'object',
        properties: {
          destination: { type: 'string', description: 'City or location to search (e.g., "Miami", "Paris")' },
          check_in: { type: 'string', description: 'Check-in date in YYYY-MM-DD format' },
          check_out: { type: 'string', description: 'Check-out date in YYYY-MM-DD format' },
          guests: { type: 'number', description: 'Number of guests', default: 2 },
          rooms: { type: 'number', description: 'Number of rooms', default: 1 },
          max_price: { type: 'number', description: 'Maximum price per night in USD' },
          min_rating: { type: 'number', description: 'Minimum rating (1-10 scale)' },
        },
        required: ['destination', 'check_in', 'check_out'],
      },
    }
  },
  {
    type: "function",
    function: {
      name: 'search_flights',
      description: 'Search for flights using real Amadeus API data. Returns options with pricing and booking details.',
      parameters: {
        type: 'object',
        properties: {
          origin: { type: 'string', description: 'Departure airport code (e.g., "JFK", "LAX")' },
          destination: { type: 'string', description: 'Arrival airport code (e.g., "MIA", "CDG")' },
          depart_date: { type: 'string', description: 'Departure date in YYYY-MM-DD format' },
          return_date: { type: 'string', description: 'Return date in YYYY-MM-DD format (optional for one-way)' },
          passengers: { type: 'number', description: 'Number of passengers', default: 1 },
          cabin_class: { type: 'string', enum: ['ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST'], description: 'Cabin class preference' },
        },
        required: ['origin', 'destination', 'depart_date'],
      },
    }
  },
  {
    type: "function",
    function: {
      name: 'search_activities',
      description: 'Search for activities and experiences using real Amadeus API data.',
      parameters: {
        type: 'object',
        properties: {
          destination: { type: 'string', description: 'City or location to search' },
          date: { type: 'string', description: 'Activity date in YYYY-MM-DD format' },
          category: { type: 'string', enum: ['tours', 'attractions', 'outdoor', 'cultural', 'food', 'adventure'], description: 'Activity category' },
          max_price: { type: 'number', description: 'Maximum price per person in USD' },
        },
        required: ['destination'],
      },
    }
  },
  {
    type: "function",
    function: {
      name: 'search_restaurants',
      description: 'Search for restaurants using real Yelp API data.',
      parameters: {
        type: 'object',
        properties: {
          destination: { type: 'string', description: 'City or area to search' },
          cuisine: { type: 'string', description: 'Cuisine type or keyword (e.g., "sushi", "italian")' },
          price: { type: 'string', description: 'Price levels 1-4 as comma-separated string (e.g., "1,2")' },
          open_now: { type: 'boolean', description: 'Only show currently open restaurants' },
        },
        required: ['destination'],
      },
    }
  },
  // ===== WRITE TOOLS =====
  {
    type: "function",
    function: {
      name: 'update_hotel_dates',
      description: 'Update check-in and/or check-out dates for a hotel reservation in an itinerary',
      parameters: {
        type: 'object',
        properties: {
          itinerary_id: { type: 'number', description: 'The itinerary ID containing the hotel' },
          hotel_name: { type: 'string', description: 'Name or partial name of the hotel to update' },
          new_check_in: { type: 'string', description: 'New check-in date in YYYY-MM-DD format' },
          new_check_out: { type: 'string', description: 'New check-out date in YYYY-MM-DD format (optional)' },
        },
        required: ['itinerary_id', 'hotel_name', 'new_check_in'],
      },
    }
  },
  {
    type: "function",
    function: {
      name: 'add_hotel_to_itinerary',
      description: 'Add a hotel from search results to an itinerary',
      parameters: {
        type: 'object',
        properties: {
          itinerary_id: { type: 'number', description: 'The itinerary ID to add the hotel to' },
          hotel_data: { type: 'object', description: 'Full hotel object from search results' },
        },
        required: ['itinerary_id', 'hotel_data'],
      },
    }
  },
  {
    type: "function",
    function: {
      name: 'add_flight_to_itinerary',
      description: 'Add a flight from search results to an itinerary',
      parameters: {
        type: 'object',
        properties: {
          itinerary_id: { type: 'number', description: 'The itinerary ID to add the flight to' },
          flight_data: { type: 'object', description: 'Full flight object from search results' },
        },
        required: ['itinerary_id', 'flight_data'],
      },
    }
  },
  {
    type: "function",
    function: {
      name: 'add_activity_to_itinerary',
      description: 'Add an activity from search results to an itinerary',
      parameters: {
        type: 'object',
        properties: {
          itinerary_id: { type: 'number', description: 'The itinerary ID to add the activity to' },
          activity_data: { type: 'object', description: 'Full activity object from search results' },
        },
        required: ['itinerary_id', 'activity_data'],
      },
    }
  },
  {
    type: "function",
    function: {
      name: 'remove_item_from_itinerary',
      description: 'Remove a hotel, flight, or activity from an itinerary',
      parameters: {
        type: 'object',
        properties: {
          itinerary_id: { type: 'number', description: 'The itinerary ID' },
          item_type: { type: 'string', enum: ['hotel', 'flight', 'activity', 'reservation'], description: 'Type of item to remove' },
          item_name: { type: 'string', description: 'Name or identifier of the item to remove' },
        },
        required: ['itinerary_id', 'item_type', 'item_name'],
      },
    }
  },
  {
    type: "function",
    function: {
      name: 'update_itinerary_dates',
      description: 'Update the start and/or end dates of an itinerary',
      parameters: {
        type: 'object',
        properties: {
          itinerary_id: { type: 'number', description: 'The itinerary ID to update' },
          start_date: { type: 'string', description: 'New start date in YYYY-MM-DD format' },
          end_date: { type: 'string', description: 'New end date in YYYY-MM-DD format' },
        },
        required: ['itinerary_id'],
      },
    }
  },
  {
    type: "function",
    function: {
      name: 'update_itinerary_budget',
      description: 'Update the budget or spending for an itinerary',
      parameters: {
        type: 'object',
        properties: {
          itinerary_id: { type: 'number', description: 'The itinerary ID to update' },
          budget: { type: 'number', description: 'New total budget amount' },
          spending: { type: 'number', description: 'New total spending amount' },
        },
        required: ['itinerary_id'],
      },
    }
  },
  {
    type: "function",
    function: {
      name: 'create_itinerary',
      description: 'Create a new itinerary for the user',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Name of the itinerary' },
          description: { type: 'string', description: 'Description of the trip' },
          start_date: { type: 'string', description: 'Start date in YYYY-MM-DD format' },
          end_date: { type: 'string', description: 'End date in YYYY-MM-DD format' },
          locations: { type: 'array', items: { type: 'string' }, description: 'List of destination locations' },
          budget: { type: 'number', description: 'Total budget for the trip' },
        },
        required: ['name', 'start_date', 'end_date'],
      },
    }
  },
];

// ============================================================================
// REAL API SEARCH FUNCTIONS
// ============================================================================

// Get Amadeus access token
async function getAmadeusToken(): Promise<string | null> {
  if (!amadeusApiKey || !amadeusApiSecret) {
    console.error('Amadeus API credentials not configured');
    return null;
  }

  try {
    const response = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=client_credentials&client_id=${amadeusApiKey}&client_secret=${amadeusApiSecret}`,
    });

    if (!response.ok) {
      console.error('Failed to get Amadeus token:', await response.text());
      return null;
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Error getting Amadeus token:', error);
    return null;
  }
}

// Geocode destination to coordinates using Mapbox
async function geocodeDestination(destination: string): Promise<{ lat: number; lng: number } | null> {
  if (!mapboxToken) {
    console.error('Mapbox token not configured');
    return null;
  }

  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(destination)}.json?access_token=${mapboxToken}&types=place&limit=1`
    );

    if (!response.ok) {
      console.error('Geocoding failed:', await response.text());
      return null;
    }

    const data = await response.json();
    if (data.features && data.features.length > 0) {
      const [lng, lat] = data.features[0].center;
      return { lat, lng };
    }
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

// Search Hotels using Booking.com API (Real Data)
async function searchHotels(params: any) {
  console.log('Searching hotels with Booking.com API:', params);

  if (!rapidApiKey) {
    console.error('RapidAPI key not configured');
    return { error: 'Hotel search is currently unavailable', results: [] };
  }

  try {
    // Step 1: Get destination ID
    const destResponse = await fetch(
      `https://booking-com15.p.rapidapi.com/api/v1/hotels/searchDestination?query=${encodeURIComponent(params.destination)}`,
      {
        headers: {
          'x-rapidapi-host': 'booking-com15.p.rapidapi.com',
          'x-rapidapi-key': rapidApiKey,
        },
      }
    );

    if (!destResponse.ok) {
      console.error('Destination search failed:', await destResponse.text());
      return { error: 'Could not find destination', results: [] };
    }

    const destData = await destResponse.json();
    const dest = destData.data?.[0];

    if (!dest) {
      return { error: `Could not find destination: ${params.destination}`, results: [] };
    }

    console.log('Found destination:', dest.dest_id, dest.search_type);

    // Step 2: Search hotels
    const searchParams = new URLSearchParams({
      dest_id: dest.dest_id,
      search_type: dest.search_type,
      arrival_date: params.check_in,
      departure_date: params.check_out,
      adults: String(params.guests || 2),
      room_qty: String(params.rooms || 1),
      currency_code: 'USD',
      sort_by: 'popularity',
      page_number: '1',
    });

    const searchResponse = await fetch(
      `https://booking-com15.p.rapidapi.com/api/v1/hotels/searchHotels?${searchParams}`,
      {
        headers: {
          'x-rapidapi-host': 'booking-com15.p.rapidapi.com',
          'x-rapidapi-key': rapidApiKey,
        },
      }
    );

    if (!searchResponse.ok) {
      console.error('Hotel search failed:', await searchResponse.text());
      return { error: 'Hotel search failed', results: [] };
    }

    const searchData = await searchResponse.json();
    const hotels = searchData.data?.hotels || [];

    console.log(`Found ${hotels.length} hotels`);

    // Transform and add diversity labels
    const transformedHotels = hotels.slice(0, 6).map((hotel: any, index: number) => {
      let diversityLabel = '';
      if (index === 0) diversityLabel = 'Best Overall';
      else if (index === 1) diversityLabel = 'Best Value';
      else if (index === 2) diversityLabel = 'Best Location';

      const price = hotel.property?.priceBreakdown?.grossPrice?.value || 
                   hotel.composite_price_breakdown?.gross_amount?.value || 0;

      return {
        id: hotel.hotel_id || `booking_${index}`,
        name: hotel.property?.name || hotel.hotel_name || 'Hotel',
        price: Math.round(price),
        pricePerNight: Math.round(price),
        rating: hotel.property?.reviewScore || hotel.review_score || 0,
        reviewCount: hotel.property?.reviewCount || hotel.review_nr || 0,
        location: params.destination,
        neighborhood: hotel.property?.wishlistName || '',
        checkIn: params.check_in,
        checkOut: params.check_out,
        amenities: [],
        image: hotel.property?.photoUrls?.[0] || hotel.max_photo_url || '',
        images: hotel.property?.photoUrls || [hotel.max_photo_url].filter(Boolean),
        description: hotel.property?.wishlistName || `Hotel in ${params.destination}`,
        coordinates: {
          lat: hotel.property?.latitude || 0,
          lng: hotel.property?.longitude || 0,
        },
        source: 'booking.com',
        diversityLabel,
        bookingUrl: hotel.property?.deeplink || `https://www.booking.com/hotel/${hotel.hotel_id}`,
        reasons: getDiversityReasons(diversityLabel, hotel),
      };
    });

    return {
      constraint_summary: `Hotels in ${params.destination} from ${params.check_in} to ${params.check_out} for ${params.guests || 2} guests`,
      results: transformedHotels,
      action_buttons: ['select', 'shuffle', 'save_to_shortlist'],
    };
  } catch (error) {
    console.error('Hotel search error:', error);
    return { error: 'Hotel search failed', results: [] };
  }
}

function getDiversityReasons(label: string, hotel: any): string[] {
  const reasons: string[] = [];
  const rating = hotel.property?.reviewScore || hotel.review_score || 0;
  
  if (label === 'Best Overall') {
    reasons.push('Highest rated');
    if (rating >= 8) reasons.push('Excellent reviews');
    reasons.push('Popular choice');
  } else if (label === 'Best Value') {
    reasons.push('Great price-to-quality');
    reasons.push('Budget-friendly');
  } else if (label === 'Best Location') {
    reasons.push('Prime location');
    reasons.push('Walkable area');
  }
  
  return reasons.slice(0, 3);
}

// Search Flights using Amadeus API (Real Data)
async function searchFlights(params: any) {
  console.log('Searching flights with Amadeus API:', params);

  const token = await getAmadeusToken();
  if (!token) {
    return { error: 'Flight search is currently unavailable', results: [] };
  }

  try {
    const searchParams = new URLSearchParams({
      originLocationCode: params.origin.toUpperCase(),
      destinationLocationCode: params.destination.toUpperCase(),
      departureDate: params.depart_date,
      adults: String(params.passengers || 1),
      currencyCode: 'USD',
      max: '10',
    });

    if (params.return_date) {
      searchParams.append('returnDate', params.return_date);
    }
    if (params.cabin_class) {
      searchParams.append('travelClass', params.cabin_class);
    }

    const response = await fetch(
      `https://test.api.amadeus.com/v2/shopping/flight-offers?${searchParams}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Amadeus flight search failed:', errorText);
      return { error: 'Flight search failed', results: [] };
    }

    const data = await response.json();
    const flights = data.data || [];
    const dictionaries = data.dictionaries || {};

    console.log(`Found ${flights.length} flight offers`);

    const transformedFlights = flights.slice(0, 6).map((offer: any, index: number) => {
      const itinerary = offer.itineraries?.[0];
      const firstSegment = itinerary?.segments?.[0];
      const lastSegment = itinerary?.segments?.[itinerary.segments.length - 1];
      const carrierCode = firstSegment?.carrierCode || '';
      const carrierName = dictionaries?.carriers?.[carrierCode] || carrierCode;

      let diversityLabel = '';
      if (index === 0) diversityLabel = 'Best Overall';
      else if (index === 1) diversityLabel = 'Best Value';
      else if (index === 2) diversityLabel = 'Fastest';

      return {
        id: offer.id || `amadeus_flight_${index}`,
        airline: carrierName,
        carrierCode,
        flightNumber: `${carrierCode}${firstSegment?.number || ''}`,
        price: parseFloat(offer.price?.total || '0'),
        currency: offer.price?.currency || 'USD',
        departure: firstSegment?.departure?.at || '',
        arrival: lastSegment?.arrival?.at || '',
        origin: params.origin.toUpperCase(),
        destination: params.destination.toUpperCase(),
        duration: itinerary?.duration || '',
        stops: (itinerary?.segments?.length || 1) - 1,
        date: params.depart_date,
        cabin: offer.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.cabin || 'ECONOMY',
        source: 'amadeus',
        diversityLabel,
        bookable: offer.instantTicketingRequired !== true,
      };
    });

    return {
      constraint_summary: `Flights from ${params.origin} to ${params.destination} on ${params.depart_date}`,
      results: transformedFlights,
      action_buttons: ['select', 'shuffle'],
    };
  } catch (error) {
    console.error('Flight search error:', error);
    return { error: 'Flight search failed', results: [] };
  }
}

// Search Activities using Amadeus API (Real Data)
async function searchActivities(params: any) {
  console.log('Searching activities with Amadeus API:', params);

  const token = await getAmadeusToken();
  const coords = await geocodeDestination(params.destination);

  if (!token || !coords) {
    return { error: 'Activity search is currently unavailable', results: [] };
  }

  try {
    const response = await fetch(
      `https://test.api.amadeus.com/v1/shopping/activities?latitude=${coords.lat}&longitude=${coords.lng}&radius=5`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Amadeus activities search failed:', errorText);
      return { error: 'Activity search failed', results: [] };
    }

    const data = await response.json();
    const activities = data.data || [];

    console.log(`Found ${activities.length} activities`);

    const transformedActivities = activities.slice(0, 6).map((activity: any, index: number) => {
      let diversityLabel = '';
      if (index === 0) diversityLabel = 'Best Overall';
      else if (index === 1) diversityLabel = 'Best Value';
      else if (index === 2) diversityLabel = 'Most Popular';

      return {
        id: activity.id || `amadeus_activity_${index}`,
        name: activity.name || 'Activity',
        price: parseFloat(activity.price?.amount || '0'),
        currency: activity.price?.currencyCode || 'USD',
        rating: activity.rating || 0,
        duration: activity.duration || '',
        description: activity.shortDescription || activity.description || '',
        location: params.destination,
        image: activity.pictures?.[0] || '',
        images: activity.pictures || [],
        category: activity.type || 'activity',
        bookingLink: activity.bookingLink || '',
        source: 'amadeus',
        diversityLabel,
      };
    });

    return {
      constraint_summary: `Activities in ${params.destination}`,
      results: transformedActivities,
      action_buttons: ['select', 'save_to_shortlist'],
    };
  } catch (error) {
    console.error('Activity search error:', error);
    return { error: 'Activity search failed', results: [] };
  }
}

// Search Restaurants using Yelp API (Real Data)
async function searchRestaurants(params: any) {
  console.log('Searching restaurants with Yelp API:', params);

  if (!yelpApiKey) {
    return { error: 'Restaurant search is currently unavailable', results: [] };
  }

  try {
    const queryParams: Record<string, string> = {
      term: params.cuisine || 'restaurants',
      location: params.destination,
      limit: '20',
      sort_by: 'best_match',
    };
    if (params.price) queryParams.price = params.price;
    if (params.open_now) queryParams.open_now = 'true';

    const query = new URLSearchParams(queryParams).toString();
    const response = await fetch(`https://api.yelp.com/v3/businesses/search?${query}`, {
      headers: { Authorization: `Bearer ${yelpApiKey}` },
    });

    if (!response.ok) {
      console.error('Yelp API error:', await response.text());
      return { error: 'Restaurant search failed', results: [] };
    }

    const data = await response.json();
    const businesses = data.businesses || [];

    console.log(`Found ${businesses.length} restaurants`);

    const transformedRestaurants = businesses.slice(0, 6).map((b: any, index: number) => {
      let diversityLabel = '';
      if (index === 0) diversityLabel = 'Best Overall';
      else if (index === 1) diversityLabel = 'Best Value';
      else if (index === 2) diversityLabel = 'Highest Rated';

      return {
        id: b.id,
        name: b.name,
        price: 0,
        priceRange: b.price || '',
        image: b.image_url,
        description: b.location?.display_address?.join(', ') || '',
        location: b.location?.address1 || params.destination,
        city: b.location?.city || params.destination,
        cuisine: (b.categories || []).map((c: any) => c.title).join(', '),
        rating: b.rating,
        reviewCount: b.review_count,
        coordinates: b.coordinates,
        url: b.url,
        phone: b.phone,
        source: 'yelp',
        diversityLabel,
      };
    });

    return {
      constraint_summary: `Restaurants in ${params.destination}${params.cuisine ? ` - ${params.cuisine}` : ''}`,
      results: transformedRestaurants,
      action_buttons: ['select', 'save_to_shortlist'],
    };
  } catch (error) {
    console.error('Restaurant search error:', error);
    return { error: 'Restaurant search failed', results: [] };
  }
}

// ============================================================================
// READ FUNCTIONS
// ============================================================================

// Get single itinerary
async function getItinerary(userId: string, itineraryId: number) {
  try {
    const { data, error } = await supabase
      .from('itinerary')
      .select('*')
      .eq('id', itineraryId)
      .eq('userid', userId)
      .single();

    if (error) {
      console.error('Error fetching itinerary:', error);
      return { error: 'Itinerary not found' };
    }

    return { itinerary: data };
  } catch (error) {
    console.error('Error in getItinerary:', error);
    return { error: 'Failed to fetch itinerary' };
  }
}

// List user itineraries
async function listItineraries(userId: string) {
  try {
    const { data, error } = await supabase
      .from('itinerary')
      .select('id, itin_name, itin_desc, itin_date_start, itin_date_end, itin_locations, budget, spending, hotels, flights, activities')
      .eq('userid', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching itineraries:', error);
      return { itineraries: [] };
    }

    return { itineraries: data || [] };
  } catch (error) {
    console.error('Error in listItineraries:', error);
    return { itineraries: [] };
  }
}

// ============================================================================
// WRITE FUNCTIONS
// ============================================================================

// Log itinerary event for audit trail
async function logItineraryEvent(
  itineraryId: number,
  userId: string,
  action: string,
  itemType: string | null,
  itemId: string | null,
  beforeState: any,
  afterState: any
) {
  try {
    await supabase.from('itinerary_events').insert({
      itinerary_id: itineraryId,
      user_id: userId,
      action,
      item_type: itemType,
      item_id: itemId,
      before_state: beforeState,
      after_state: afterState,
    });
  } catch (error) {
    console.error('Error logging itinerary event:', error);
  }
}

// Update hotel dates
async function updateHotelDates(userId: string, params: {
  itinerary_id: number;
  hotel_name: string;
  new_check_in: string;
  new_check_out?: string;
}) {
  console.log('Updating hotel dates:', params);

  try {
    // Fetch current itinerary
    const { data: itinerary, error } = await supabase
      .from('itinerary')
      .select('*')
      .eq('id', params.itinerary_id)
      .eq('userid', userId)
      .single();

    if (error || !itinerary) {
      return { error: 'Itinerary not found or access denied' };
    }

    // Find the hotel in the hotels array
    const hotels = itinerary.hotels || [];
    const hotelIndex = hotels.findIndex((h: any) => 
      h.name?.toLowerCase().includes(params.hotel_name.toLowerCase())
    );

    if (hotelIndex === -1) {
      // List available hotels for disambiguation
      const hotelNames = hotels.map((h: any) => h.name).filter(Boolean);
      return { 
        error: `Hotel "${params.hotel_name}" not found in this itinerary.`,
        available_hotels: hotelNames,
        message: hotelNames.length > 0 
          ? `Available hotels: ${hotelNames.join(', ')}` 
          : 'No hotels found in this itinerary.'
      };
    }

    // Store before state
    const beforeState = { ...hotels[hotelIndex] };

    // Update the hotel
    hotels[hotelIndex] = {
      ...hotels[hotelIndex],
      check_in: params.new_check_in,
      checkIn: params.new_check_in,
      check_out: params.new_check_out || hotels[hotelIndex].check_out || hotels[hotelIndex].checkOut,
      checkOut: params.new_check_out || hotels[hotelIndex].check_out || hotels[hotelIndex].checkOut,
    };

    // Save to database
    const { error: updateError } = await supabase
      .from('itinerary')
      .update({ hotels })
      .eq('id', params.itinerary_id)
      .eq('userid', userId);

    if (updateError) {
      console.error('Update error:', updateError);
      return { error: 'Failed to update hotel dates' };
    }

    // Log the event
    await logItineraryEvent(
      params.itinerary_id,
      userId,
      'update_hotel_dates',
      'hotel',
      hotels[hotelIndex].id || hotels[hotelIndex].name,
      beforeState,
      hotels[hotelIndex]
    );

    return {
      success: true,
      message: `Updated ${hotels[hotelIndex].name} check-in to ${params.new_check_in}${params.new_check_out ? ` and check-out to ${params.new_check_out}` : ''}.`,
      changed_fields: ['check_in', ...(params.new_check_out ? ['check_out'] : [])],
      updated_item: hotels[hotelIndex],
    };
  } catch (error) {
    console.error('Error updating hotel dates:', error);
    return { error: 'Failed to update hotel dates' };
  }
}

// Add hotel to itinerary
async function addHotelToItinerary(userId: string, params: {
  itinerary_id: number;
  hotel_data: any;
}) {
  console.log('Adding hotel to itinerary:', params.itinerary_id);

  try {
    const { data: itinerary, error } = await supabase
      .from('itinerary')
      .select('*')
      .eq('id', params.itinerary_id)
      .eq('userid', userId)
      .single();

    if (error || !itinerary) {
      return { error: 'Itinerary not found or access denied' };
    }

    const hotels = itinerary.hotels || [];
    hotels.push(params.hotel_data);

    // Update spending
    const newSpending = (itinerary.spending || 0) + (params.hotel_data.price || 0);

    const { error: updateError } = await supabase
      .from('itinerary')
      .update({ hotels, spending: newSpending })
      .eq('id', params.itinerary_id)
      .eq('userid', userId);

    if (updateError) {
      return { error: 'Failed to add hotel' };
    }

    await logItineraryEvent(
      params.itinerary_id,
      userId,
      'add_hotel',
      'hotel',
      params.hotel_data.id || params.hotel_data.name,
      null,
      params.hotel_data
    );

    return {
      success: true,
      message: `Added ${params.hotel_data.name} to your itinerary.`,
      new_item: params.hotel_data,
      updated_spending: newSpending,
    };
  } catch (error) {
    console.error('Error adding hotel:', error);
    return { error: 'Failed to add hotel' };
  }
}

// Add flight to itinerary
async function addFlightToItinerary(userId: string, params: {
  itinerary_id: number;
  flight_data: any;
}) {
  console.log('Adding flight to itinerary:', params.itinerary_id);

  try {
    const { data: itinerary, error } = await supabase
      .from('itinerary')
      .select('*')
      .eq('id', params.itinerary_id)
      .eq('userid', userId)
      .single();

    if (error || !itinerary) {
      return { error: 'Itinerary not found or access denied' };
    }

    const flights = itinerary.flights || [];
    flights.push(params.flight_data);

    const newSpending = (itinerary.spending || 0) + (params.flight_data.price || 0);

    const { error: updateError } = await supabase
      .from('itinerary')
      .update({ flights, spending: newSpending })
      .eq('id', params.itinerary_id)
      .eq('userid', userId);

    if (updateError) {
      return { error: 'Failed to add flight' };
    }

    await logItineraryEvent(
      params.itinerary_id,
      userId,
      'add_flight',
      'flight',
      params.flight_data.id || params.flight_data.flightNumber,
      null,
      params.flight_data
    );

    return {
      success: true,
      message: `Added ${params.flight_data.airline} ${params.flight_data.flightNumber || ''} to your itinerary.`,
      new_item: params.flight_data,
      updated_spending: newSpending,
    };
  } catch (error) {
    console.error('Error adding flight:', error);
    return { error: 'Failed to add flight' };
  }
}

// Add activity to itinerary
async function addActivityToItinerary(userId: string, params: {
  itinerary_id: number;
  activity_data: any;
}) {
  console.log('Adding activity to itinerary:', params.itinerary_id);

  try {
    const { data: itinerary, error } = await supabase
      .from('itinerary')
      .select('*')
      .eq('id', params.itinerary_id)
      .eq('userid', userId)
      .single();

    if (error || !itinerary) {
      return { error: 'Itinerary not found or access denied' };
    }

    const activities = itinerary.activities || [];
    activities.push(params.activity_data);

    const newSpending = (itinerary.spending || 0) + (params.activity_data.price || 0);

    const { error: updateError } = await supabase
      .from('itinerary')
      .update({ activities, spending: newSpending })
      .eq('id', params.itinerary_id)
      .eq('userid', userId);

    if (updateError) {
      return { error: 'Failed to add activity' };
    }

    await logItineraryEvent(
      params.itinerary_id,
      userId,
      'add_activity',
      'activity',
      params.activity_data.id || params.activity_data.name,
      null,
      params.activity_data
    );

    return {
      success: true,
      message: `Added ${params.activity_data.name} to your itinerary.`,
      new_item: params.activity_data,
      updated_spending: newSpending,
    };
  } catch (error) {
    console.error('Error adding activity:', error);
    return { error: 'Failed to add activity' };
  }
}

// Remove item from itinerary
async function removeItemFromItinerary(userId: string, params: {
  itinerary_id: number;
  item_type: 'hotel' | 'flight' | 'activity' | 'reservation';
  item_name: string;
}) {
  console.log('Removing item from itinerary:', params);

  try {
    const { data: itinerary, error } = await supabase
      .from('itinerary')
      .select('*')
      .eq('id', params.itinerary_id)
      .eq('userid', userId)
      .single();

    if (error || !itinerary) {
      return { error: 'Itinerary not found or access denied' };
    }

    const fieldMap: Record<string, string> = {
      hotel: 'hotels',
      flight: 'flights',
      activity: 'activities',
      reservation: 'reservations',
    };

    const field = fieldMap[params.item_type];
    const items = itinerary[field] || [];
    
    const itemIndex = items.findIndex((item: any) => 
      item.name?.toLowerCase().includes(params.item_name.toLowerCase()) ||
      item.id?.toString().includes(params.item_name)
    );

    if (itemIndex === -1) {
      const itemNames = items.map((i: any) => i.name).filter(Boolean);
      return { 
        error: `${params.item_type} "${params.item_name}" not found.`,
        available_items: itemNames,
      };
    }

    const removedItem = items[itemIndex];
    items.splice(itemIndex, 1);

    // Update spending
    const newSpending = Math.max(0, (itinerary.spending || 0) - (removedItem.price || 0));

    const { error: updateError } = await supabase
      .from('itinerary')
      .update({ [field]: items, spending: newSpending })
      .eq('id', params.itinerary_id)
      .eq('userid', userId);

    if (updateError) {
      return { error: `Failed to remove ${params.item_type}` };
    }

    await logItineraryEvent(
      params.itinerary_id,
      userId,
      `remove_${params.item_type}`,
      params.item_type,
      removedItem.id || removedItem.name,
      removedItem,
      null
    );

    return {
      success: true,
      message: `Removed ${removedItem.name} from your itinerary.`,
      removed_item: removedItem,
      updated_spending: newSpending,
    };
  } catch (error) {
    console.error('Error removing item:', error);
    return { error: `Failed to remove ${params.item_type}` };
  }
}

// Update itinerary dates
async function updateItineraryDates(userId: string, params: {
  itinerary_id: number;
  start_date?: string;
  end_date?: string;
}) {
  console.log('Updating itinerary dates:', params);

  try {
    const { data: itinerary, error } = await supabase
      .from('itinerary')
      .select('*')
      .eq('id', params.itinerary_id)
      .eq('userid', userId)
      .single();

    if (error || !itinerary) {
      return { error: 'Itinerary not found or access denied' };
    }

    const beforeState = {
      itin_date_start: itinerary.itin_date_start,
      itin_date_end: itinerary.itin_date_end,
    };

    const updates: any = {};
    if (params.start_date) updates.itin_date_start = params.start_date;
    if (params.end_date) updates.itin_date_end = params.end_date;

    const { error: updateError } = await supabase
      .from('itinerary')
      .update(updates)
      .eq('id', params.itinerary_id)
      .eq('userid', userId);

    if (updateError) {
      return { error: 'Failed to update itinerary dates' };
    }

    await logItineraryEvent(
      params.itinerary_id,
      userId,
      'update_dates',
      'itinerary',
      params.itinerary_id.toString(),
      beforeState,
      updates
    );

    return {
      success: true,
      message: `Updated itinerary dates to ${params.start_date || itinerary.itin_date_start} - ${params.end_date || itinerary.itin_date_end}.`,
      changed_fields: Object.keys(updates),
    };
  } catch (error) {
    console.error('Error updating itinerary dates:', error);
    return { error: 'Failed to update itinerary dates' };
  }
}

// Update itinerary budget
async function updateItineraryBudget(userId: string, params: {
  itinerary_id: number;
  budget?: number;
  spending?: number;
}) {
  console.log('Updating itinerary budget:', params);

  try {
    const { data: itinerary, error } = await supabase
      .from('itinerary')
      .select('*')
      .eq('id', params.itinerary_id)
      .eq('userid', userId)
      .single();

    if (error || !itinerary) {
      return { error: 'Itinerary not found or access denied' };
    }

    const beforeState = {
      budget: itinerary.budget,
      spending: itinerary.spending,
    };

    const updates: any = {};
    if (params.budget !== undefined) updates.budget = params.budget;
    if (params.spending !== undefined) updates.spending = params.spending;

    const { error: updateError } = await supabase
      .from('itinerary')
      .update(updates)
      .eq('id', params.itinerary_id)
      .eq('userid', userId);

    if (updateError) {
      return { error: 'Failed to update budget' };
    }

    await logItineraryEvent(
      params.itinerary_id,
      userId,
      'update_budget',
      'itinerary',
      params.itinerary_id.toString(),
      beforeState,
      updates
    );

    return {
      success: true,
      message: `Updated budget to $${params.budget ?? itinerary.budget}${params.spending !== undefined ? ` and spending to $${params.spending}` : ''}.`,
      changed_fields: Object.keys(updates),
    };
  } catch (error) {
    console.error('Error updating budget:', error);
    return { error: 'Failed to update budget' };
  }
}

// Create new itinerary
async function createItinerary(userId: string, params: {
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  locations?: string[];
  budget?: number;
}) {
  console.log('Creating new itinerary:', params);

  try {
    const { data, error } = await supabase
      .from('itinerary')
      .insert({
        userid: userId,
        itin_name: params.name,
        itin_desc: params.description || '',
        itin_date_start: params.start_date,
        itin_date_end: params.end_date,
        itin_locations: params.locations || [],
        budget: params.budget || 0,
        spending: 0,
        hotels: [],
        flights: [],
        activities: [],
        reservations: [],
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating itinerary:', error);
      return { error: 'Failed to create itinerary' };
    }

    await logItineraryEvent(
      data.id,
      userId,
      'create_itinerary',
      'itinerary',
      data.id.toString(),
      null,
      data
    );

    return {
      success: true,
      message: `Created new itinerary "${params.name}" for ${params.start_date} to ${params.end_date}.`,
      itinerary: data,
      itinerary_id: data.id,
    };
  } catch (error) {
    console.error('Error creating itinerary:', error);
    return { error: 'Failed to create itinerary' };
  }
}

// ============================================================================
// INPUT VALIDATION
// ============================================================================
const chatSchema = z.object({
  message: z.string().min(1).max(5000),
  context: z.string().max(2000).optional(),
  userId: z.string().uuid().optional(),
  itineraryId: z.string().optional(),
});

// ============================================================================
// MAIN REQUEST HANDLER
// ============================================================================
serve(async (req) => {
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

    // Validate input
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

    const { message, context, itineraryId } = validatedData;
    console.log('Received chat request:', { message, context, itineraryId });

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Get user's itineraries for context
    const { itineraries: userItineraries } = await listItineraries(user.id);
    
    const itineraryContext = userItineraries.length > 0 
      ? `\n\n# User's Itineraries\n${userItineraries.map((it: any) => 
          `- ${it.itin_name} (ID: ${it.id}): ${it.itin_desc || 'No description'} | Dates: ${it.itin_date_start || 'TBD'} to ${it.itin_date_end || 'TBD'} | Budget: $${it.budget || 0} | Hotels: ${(it.hotels || []).length} | Flights: ${(it.flights || []).length}`
        ).join('\n')}`
      : '\n\n# User has no existing itineraries.';

    const fullSystemPrompt = `${TAAI_SYSTEM_PROMPT}

${context ? `# Current Context\n${context}` : ''}${itineraryContext}

${itineraryId ? `# Active Itinerary\nCurrently working with itinerary ID: ${itineraryId}` : ''}`;

    // Call Lovable AI Gateway
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: fullSystemPrompt },
          { role: 'user', content: message }
        ],
        tools,
        tool_choice: 'auto',
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Usage credits exhausted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('Lovable AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI response received');

    const choice = data.choices?.[0];
    if (!choice) {
      throw new Error('No response from AI');
    }

    // Check for tool calls
    if (choice.message?.tool_calls && choice.message.tool_calls.length > 0) {
      const toolCall = choice.message.tool_calls[0];
      const functionName = toolCall.function?.name;
      const functionArgs = JSON.parse(toolCall.function?.arguments || '{}');

      console.log(`Executing tool: ${functionName}`, functionArgs);

      let toolResult: any;
      let resultType = '';

      switch (functionName) {
        // Read tools
        case 'get_itinerary':
          toolResult = await getItinerary(user.id, functionArgs.itinerary_id);
          resultType = 'itinerary';
          break;
        case 'list_itineraries':
          toolResult = await listItineraries(user.id);
          resultType = 'itineraries';
          break;
        
        // Search tools
        case 'search_hotels':
          toolResult = await searchHotels(functionArgs);
          resultType = 'hotels';
          break;
        case 'search_flights':
          toolResult = await searchFlights(functionArgs);
          resultType = 'flights';
          break;
        case 'search_activities':
          toolResult = await searchActivities(functionArgs);
          resultType = 'activities';
          break;
        case 'search_restaurants':
          toolResult = await searchRestaurants(functionArgs);
          resultType = 'restaurants';
          break;
        
        // Write tools
        case 'update_hotel_dates':
          toolResult = await updateHotelDates(user.id, functionArgs);
          resultType = 'write_result';
          break;
        case 'add_hotel_to_itinerary':
          toolResult = await addHotelToItinerary(user.id, functionArgs);
          resultType = 'write_result';
          break;
        case 'add_flight_to_itinerary':
          toolResult = await addFlightToItinerary(user.id, functionArgs);
          resultType = 'write_result';
          break;
        case 'add_activity_to_itinerary':
          toolResult = await addActivityToItinerary(user.id, functionArgs);
          resultType = 'write_result';
          break;
        case 'remove_item_from_itinerary':
          toolResult = await removeItemFromItinerary(user.id, functionArgs);
          resultType = 'write_result';
          break;
        case 'update_itinerary_dates':
          toolResult = await updateItineraryDates(user.id, functionArgs);
          resultType = 'write_result';
          break;
        case 'update_itinerary_budget':
          toolResult = await updateItineraryBudget(user.id, functionArgs);
          resultType = 'write_result';
          break;
        case 'create_itinerary':
          toolResult = await createItinerary(user.id, functionArgs);
          resultType = 'write_result';
          break;
        
        default:
          throw new Error(`Unknown tool: ${functionName}`);
      }

      // Generate follow-up response with tool results
      const followUpResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: fullSystemPrompt },
            { role: 'user', content: message },
            { role: 'assistant', content: null, tool_calls: choice.message.tool_calls },
            { role: 'tool', tool_call_id: toolCall.id, content: JSON.stringify(toolResult) }
          ],
        }),
      });

      if (!followUpResponse.ok) {
        console.error('Follow-up response error:', await followUpResponse.text());
        // Still return results even if follow-up fails
        return new Response(JSON.stringify({
          response: toolResult.message || toolResult.constraint_summary || 'Here are your results:',
          searchResults: toolResult.results || [],
          resultType,
          functionUsed: functionName,
          constraint_summary: toolResult.constraint_summary,
          action_buttons: toolResult.action_buttons,
          writeResult: resultType === 'write_result' ? toolResult : undefined,
          [resultType]: toolResult.results || toolResult,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const followUpData = await followUpResponse.json();
      const aiResponse = followUpData.choices?.[0]?.message?.content || toolResult.message || 'Here are your results:';

      return new Response(JSON.stringify({
        response: aiResponse,
        searchResults: toolResult.results || [],
        resultType,
        functionUsed: functionName,
        constraint_summary: toolResult.constraint_summary,
        action_buttons: toolResult.action_buttons,
        writeResult: resultType === 'write_result' ? toolResult : undefined,
        [resultType]: toolResult.results || toolResult,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // No tool call - return direct response
    return new Response(JSON.stringify({ 
      response: choice.message?.content || 'I apologize, I couldn\'t generate a response.' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in chat-with-gpt function:', error);
    return new Response(
      JSON.stringify({ error: 'Unable to process chat request. Please try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
