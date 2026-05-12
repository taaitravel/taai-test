import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    const { data: u, error: ue } = await supabaseAuth.auth.getUser(authHeader.replace('Bearer ', ''));
    if (ue || !u?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { latitude, longitude, radius = 5 } = await req.json();

    console.log('Amadeus activities search:', { latitude, longitude, radius });

    if (!latitude || !longitude) {
      throw new Error('Latitude and longitude are required');
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

    // Search points of interest
    const searchUrl = `https://test.api.amadeus.com/v1/shopping/activities?latitude=${latitude}&longitude=${longitude}&radius=${radius}`;
    
    console.log('Searching activities at:', searchUrl);

    const activitiesResponse = await fetch(searchUrl, {
      headers: {
        'Authorization': `Bearer ${access_token}`,
      },
    });

    if (!activitiesResponse.ok) {
      const error = await activitiesResponse.text();
      console.error('Amadeus activities error:', error);
      throw new Error('Failed to fetch activities');
    }

    const activitiesData = await activitiesResponse.json();
    console.log('Found activities:', activitiesData.data?.length || 0);

    // Transform Amadeus response to match our format
    const activities = (activitiesData.data || []).map((activity: any) => ({
      id: activity.id,
      name: activity.name,
      description: activity.shortDescription || activity.description,
      location: `${activity.geoCode?.latitude}, ${activity.geoCode?.longitude}`,
      city: activity.name.split(',')[0], // Extract city from name
      latitude: activity.geoCode?.latitude,
      longitude: activity.geoCode?.longitude,
      category: activity.category || 'Activity',
      rating: activity.rating || 4.5,
      price: activity.price?.amount ? parseFloat(activity.price.amount) : 75,
      currency: activity.price?.currencyCode || 'USD',
      images: activity.pictures || [],
      duration: activity.duration || '3 hours',
      groupSize: 'Small group',
      bookingLink: activity.bookingLink,
    }));

    return new Response(
      JSON.stringify({ activities }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in amadeus-activities:', error);
    return new Response(
      JSON.stringify({ error: 'Unable to process activity search. Please try again.' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
