import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2.50.3';
import { z } from 'npm:zod@4.4.3';

/**
 * Viator Partner API activity search.
 *
 * Replaces the previous Amadeus activities path: Amadeus only ever returned
 * deep links (and its host was unreachable from this runtime), while Viator
 * returns real, bookable tour inventory with prices and product links.
 *
 * Egress containment: only the fields the activity cards render are relayed.
 * No raw provider body is logged, returned or persisted.
 */

const VIATOR_API_BASE = 'https://api.viator.com/partner';
const VIATOR_TIMEOUT_MS = 15_000;
const MAX_ACTIVITIES = 20;
const MAX_IMAGES = 5;
const DESCRIPTION_CHARS = 400;

const RequestSchema = z.object({
  destination: z.string().trim().min(2).max(120),
  currency: z.string().trim().length(3).optional().default('USD'),
});

type ErrorCode =
  | 'AUTH_REQUIRED'
  | 'VALIDATION_ERROR'
  | 'PROVIDER_NOT_CONFIGURED'
  | 'PROVIDER_AUTH_FAILED'
  | 'PROVIDER_RATE_LIMITED'
  | 'PROVIDER_UNAVAILABLE';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const fail = (requestId: string, code: ErrorCode, message: string, status: number) =>
  json({ status: 'error', requestId, activities: [], error: { code, message, requestId } }, status);

const cleanText = (value: unknown, max = DESCRIPTION_CHARS): string | null => {
  if (typeof value !== 'string') return null;
  const text = value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();
  if (!text) return null;
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
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

const numOrNull = (value: unknown): number | null => {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
};

/** Picks the largest available variant URL for each product image. */
const imageUrls = (images: unknown): string[] => {
  if (!Array.isArray(images)) return [];
  const out: string[] = [];
  for (const image of images) {
    const variants = (image as Record<string, unknown> | null)?.variants;
    if (!Array.isArray(variants)) continue;
    let best: string | null = null;
    let bestWidth = -1;
    for (const variant of variants) {
      const url = safeUrl((variant as Record<string, unknown>)?.url);
      const width = numOrNull((variant as Record<string, unknown>)?.width) ?? 0;
      if (url && width > bestWidth) {
        best = url;
        bestWidth = width;
      }
    }
    if (best) out.push(best);
    if (out.length >= MAX_IMAGES) break;
  }
  return out;
};

const minutesFromDuration = (duration: unknown): string | null => {
  const record = duration as Record<string, unknown> | null;
  const fixed = numOrNull(record?.fixedDurationInMinutes);
  if (fixed) return fixed >= 60 ? `${Math.round((fixed / 60) * 10) / 10} hours` : `${fixed} minutes`;
  const from = numOrNull(record?.variableDurationFromMinutes);
  const to = numOrNull(record?.variableDurationToMinutes);
  if (from && to) return `${Math.round(from / 60)}–${Math.round(to / 60)} hours`;
  return null;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const requestId = crypto.randomUUID();

  if (req.method !== 'POST') {
    return fail(requestId, 'VALIDATION_ERROR', 'Method not allowed.', 405);
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return fail(requestId, 'AUTH_REQUIRED', 'Please sign in to search activities.', 401);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) {
      return fail(requestId, 'PROVIDER_UNAVAILABLE', 'Activity search is temporarily unavailable.', 503);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: userData, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', ''),
    );
    if (userError || !userData?.user) {
      return fail(requestId, 'AUTH_REQUIRED', 'Please sign in to search activities.', 401);
    }

    const parsed = RequestSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return fail(requestId, 'VALIDATION_ERROR', 'Choose a destination and try again.', 400);
    }
    const { destination, currency } = parsed.data;

    const apiKey = Deno.env.get('VIATOR_API_KEY');
    if (!apiKey) {
      return fail(
        requestId,
        'PROVIDER_NOT_CONFIGURED',
        'Activity search is not connected yet. The activity provider key is missing.',
        503,
      );
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), VIATOR_TIMEOUT_MS);
    let upstream: Response;
    try {
      upstream = await fetch(`${VIATOR_API_BASE}/search/freetext`, {
        method: 'POST',
        signal: controller.signal,
        redirect: 'manual',
        headers: {
          'exp-api-key': apiKey,
          'Accept': 'application/json;version=2.0',
          'Accept-Language': 'en-US',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          searchTerm: destination,
          currency,
          productFiltering: { rating: { from: 3 } },
          searchTypes: [
            { searchType: 'PRODUCTS', pagination: { start: 1, count: MAX_ACTIVITIES } },
          ],
        }),
      });
    } catch (networkError) {
      console.error(`[viator-activities ${requestId}] provider unreachable`, String(networkError));
      return fail(
        requestId,
        'PROVIDER_UNAVAILABLE',
        'Activity search cannot reach its provider right now. Please try again shortly.',
        503,
      );
    } finally {
      clearTimeout(timer);
    }

    if (!upstream.ok) {
      await upstream.text().catch(() => '');
      const status = upstream.status;
      console.error(`[viator-activities ${requestId}] provider request failed`, status);
      if (status === 401 || status === 403) {
        return fail(
          requestId,
          'PROVIDER_AUTH_FAILED',
          'The activity provider rejected our credentials. The key or its access level needs review.',
          502,
        );
      }
      if (status === 429) {
        return fail(
          requestId,
          'PROVIDER_RATE_LIMITED',
          'Activity search is busy. Please wait a moment and try again.',
          429,
        );
      }
      return fail(
        requestId,
        'PROVIDER_UNAVAILABLE',
        `The activity provider is unavailable right now (status ${status}). Please try again shortly.`,
        503,
      );
    }

    const body = await upstream.json().catch(() => null);
    const results = Array.isArray(body?.products?.results) ? body.products.results : [];

    const activities = results.slice(0, MAX_ACTIVITIES).map((product: Record<string, any>) => {
      const price = product?.pricing?.summary ?? {};
      return {
        id: String(product?.productCode ?? crypto.randomUUID()),
        name: cleanText(product?.title, 140) || 'Activity',
        description: cleanText(product?.description),
        location: cleanText(product?.destinations?.[0]?.name, 120) || destination,
        city: destination,
        latitude: null,
        longitude: null,
        category: cleanText(product?.tags?.[0], 60),
        rating: numOrNull(product?.reviews?.combinedAverageRating),
        reviewCount: numOrNull(product?.reviews?.totalReviews),
        price: numOrNull(price?.fromPrice),
        currency: typeof product?.pricing?.currency === 'string' ? product.pricing.currency : currency,
        images: imageUrls(product?.images),
        duration: minutesFromDuration(product?.duration),
        groupSize: null,
        bookingLink: safeUrl(product?.productUrl),
        provider: 'Viator',
      };
    });

    console.log(`[viator-activities ${requestId}] completed`, { count: activities.length });
    return json({
      status: activities.length > 0 ? 'ok' : 'no_results',
      requestId,
      activities,
    });
  } catch (error) {
    console.error(`[viator-activities ${requestId}] unhandled`, (error as Error)?.message);
    return fail(
      requestId,
      'PROVIDER_UNAVAILABLE',
      'Activity search failed unexpectedly. Please try again.',
      503,
    );
  }
});
