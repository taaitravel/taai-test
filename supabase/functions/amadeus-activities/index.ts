import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from "npm:@supabase/supabase-js@2.50.3";
import { z } from 'npm:zod@4.4.3';

const RequestSchema = z.object({
  latitude: z.number().finite().min(-90).max(90),
  longitude: z.number().finite().min(-180).max(180),
  radius: z.number().finite().min(1).max(20).optional().default(5),
});

type ErrorCode =
  | 'AUTH_REQUIRED'
  | 'VALIDATION_ERROR'
  | 'PROVIDER_NOT_CONFIGURED'
  | 'PROVIDER_AUTH_FAILED'
  | 'PROVIDER_RATE_LIMITED'
  | 'PROVIDER_UNAVAILABLE';

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});

const fail = (requestId: string, code: ErrorCode, message: string, status: number) =>
  json({ status: 'error', requestId, activities: [], error: { code, message, requestId } }, status);

const cleanText = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  return value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim() || null;
};

const safeUrl = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestId = crypto.randomUUID();
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return fail(requestId, 'AUTH_REQUIRED', 'Please sign in to search activities.', 401);
    }
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) {
      return fail(requestId, 'PROVIDER_UNAVAILABLE', 'Activity search is temporarily unavailable.', 503);
    }
    const supabaseAuth = createClient(
      supabaseUrl,
      serviceRoleKey,
    );
    const { data: u, error: ue } = await supabaseAuth.auth.getUser(authHeader.replace('Bearer ', ''));
    if (ue || !u?.user) {
      return fail(requestId, 'AUTH_REQUIRED', 'Please sign in to search activities.', 401);
    }

    const parsed = RequestSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return fail(requestId, 'VALIDATION_ERROR', 'Choose a valid destination and try again.', 400);
    }
    const { latitude, longitude, radius } = parsed.data;

    console.log('Amadeus activities search:', { latitude, longitude, radius });

    const AMADEUS_API_KEY = Deno.env.get('AMADEUS_API_KEY');
    const AMADEUS_API_SECRET = Deno.env.get('AMADEUS_API_SECRET');

    if (!AMADEUS_API_KEY || !AMADEUS_API_SECRET) {
      return fail(requestId, 'PROVIDER_NOT_CONFIGURED', 'Activity search is not configured for this environment.', 503);
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
      await tokenResponse.text().catch(() => '');
      console.error(`[amadeus-activities ${requestId}] provider authentication failed`, tokenResponse.status);
      return fail(requestId, 'PROVIDER_AUTH_FAILED', 'Activity search is temporarily unavailable.', 502);
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
      await activitiesResponse.text().catch(() => '');
      const status = activitiesResponse.status;
      const code: ErrorCode = status === 429 ? 'PROVIDER_RATE_LIMITED' : 'PROVIDER_UNAVAILABLE';
      const message = status === 429
        ? 'Activity search is busy. Please wait a moment and try again.'
        : 'The activity provider is unavailable right now. Please try again shortly.';
      console.error(`[amadeus-activities ${requestId}] provider request failed`, status);
      return fail(requestId, code, message, status === 429 ? 429 : 503);
    }

    const activitiesData = await activitiesResponse.json();
    console.log('Found activities:', activitiesData.data?.length || 0);

    // Transform Amadeus response to match our format
    const activities = (activitiesData.data || []).map((activity: any) => ({
      id: String(activity.id ?? ''),
      name: cleanText(activity.name) || 'Activity',
      description: cleanText(activity.shortDescription || activity.description),
      location: cleanText(activity.location?.name),
      city: cleanText(activity.location?.name),
      latitude: activity.geoCode?.latitude,
      longitude: activity.geoCode?.longitude,
      category: cleanText(activity.category),
      rating: typeof activity.rating === 'number' ? activity.rating : null,
      price: activity.price?.amount && Number.isFinite(Number(activity.price.amount))
        ? Number(activity.price.amount)
        : null,
      currency: typeof activity.price?.currencyCode === 'string' ? activity.price.currencyCode : null,
      images: Array.isArray(activity.pictures) ? activity.pictures.map(safeUrl).filter(Boolean) : [],
      duration: cleanText(activity.duration),
      groupSize: cleanText(activity.groupSize),
      bookingLink: safeUrl(activity.bookingLink),
    }));

    return json({ status: activities.length > 0 ? 'ok' : 'no_results', requestId, activities });

  } catch (error: any) {
    console.error('Error in amadeus-activities:', error);
    return json({
      status: 'error',
      activities: [],
      error: { code: 'PROVIDER_UNAVAILABLE', message: 'Unable to process activity search. Please try again.' },
    }, 503);
  }
});
