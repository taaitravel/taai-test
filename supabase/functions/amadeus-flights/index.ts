import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { origin, destination, departureDate, returnDate, adults = 1, children = 0, cabinClass = 'ECONOMY' } = await req.json();

    console.log('Amadeus flight search:', { origin, destination, departureDate, returnDate, adults, children, cabinClass });

    if (!origin || !destination || !departureDate) {
      throw new Error('Origin, destination, and departure date are required');
    }

    const AMADEUS_API_KEY = Deno.env.get('AMADEUS_API_KEY');
    const AMADEUS_API_SECRET = Deno.env.get('AMADEUS_API_SECRET');

    if (!AMADEUS_API_KEY || !AMADEUS_API_SECRET) {
      throw new Error('Amadeus API credentials not configured');
    }

    // Get access token
    const tokenResponse = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `grant_type=client_credentials&client_id=${AMADEUS_API_KEY}&client_secret=${AMADEUS_API_SECRET}`,
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('Amadeus token error:', error);
      throw new Error('Failed to authenticate with Amadeus');
    }

    const { access_token } = await tokenResponse.json();

    // Build search URL
    const params = new URLSearchParams({
      originLocationCode: origin.toUpperCase(),
      destinationLocationCode: destination.toUpperCase(),
      departureDate,
      adults: String(adults),
      travelClass: cabinClass.toUpperCase(),
      currencyCode: 'USD',
      max: '20',
    });

    if (returnDate) {
      params.append('returnDate', returnDate);
    }

    if (children > 0) {
      params.append('children', String(children));
    }

    const searchUrl = `https://test.api.amadeus.com/v2/shopping/flight-offers?${params.toString()}`;
    
    console.log('Searching flights at:', searchUrl);

    const flightsResponse = await fetch(searchUrl, {
      headers: {
        'Authorization': `Bearer ${access_token}`,
      },
    });

    if (!flightsResponse.ok) {
      const error = await flightsResponse.text();
      console.error('Amadeus flights error:', error);
      throw new Error('Failed to fetch flights');
    }

    const flightsData = await flightsResponse.json();
    console.log('Found flights:', flightsData.data?.length || 0);

    // Transform Amadeus response to match our format
    const flights = (flightsData.data || []).map((offer: any) => {
      const outbound = offer.itineraries[0];
      const inbound = offer.itineraries[1];
      const firstSegment = outbound.segments[0];
      const lastSegment = outbound.segments[outbound.segments.length - 1];
      
      const price = parseFloat(offer.price.total);
      const stops = outbound.segments.length - 1;
      
      // Calculate duration in hours and minutes
      const durationMatch = outbound.duration.match(/PT(\d+)H(\d+)?M?/);
      const hours = durationMatch ? parseInt(durationMatch[1]) : 0;
      const minutes = durationMatch && durationMatch[2] ? parseInt(durationMatch[2]) : 0;
      const duration = `${hours}h ${minutes}m`;

      return {
        id: `amadeus-${offer.id}`,
        airline: firstSegment.carrierCode,
        airlineName: firstSegment.operating?.carrierCode || firstSegment.carrierCode,
        flight_number: firstSegment.number,
        departure: firstSegment.departure.at,
        arrival: lastSegment.arrival.at,
        from: firstSegment.departure.iataCode,
        to: lastSegment.arrival.iataCode,
        duration,
        stops,
        price,
        totalPrice: price,
        priceDisplay: `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        pricePerPerson: price / (adults + children),
        source: 'Amadeus',
        bookingUrl: '#',
        class: cabinClass.toLowerCase(),
        aircraft: firstSegment.aircraft?.code || '',
        segments: outbound.segments.length,
        cabinClass: offer.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.cabin || cabinClass,
        returnFlight: inbound ? {
          departure: inbound.segments[0].departure.at,
          arrival: inbound.segments[inbound.segments.length - 1].arrival.at,
          duration: inbound.duration,
          segments: inbound.segments.length,
        } : null,
        validatingAirlineCodes: offer.validatingAirlineCodes,
        rawData: offer, // Store complete offer for booking
      };
    });

    return new Response(
      JSON.stringify({ flights, dictionaries: flightsData.dictionaries }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in amadeus-flights:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
