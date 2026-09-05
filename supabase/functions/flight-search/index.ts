import { createClient } from 'npm:@supabase/supabase-js@2';
import {
  CanonicalFlightOffer,
  FlightSearchError,
  FlightSearchErrorCode,
  FlightSearchResponse,
  isValidCanonicalOffer,
  MAX_RETURNED_OFFERS,
  validateFlightSearchRequest,
} from './contract.ts';
import {
  buildOfferRequestPayload,
  classifyDuffelStatus,
  DUFFEL_API_BASE,
  DUFFEL_API_VERSION,
  DUFFEL_TIMEOUT_MS,
  buildOfferRequestUrl,
  normalizeDuffelOffer,
} from './duffel.ts';

const MODE = 'test' as const;

/**
 * Explicit least-privilege CORS headers. Defined locally rather than imported
 * from the supabase-js package, which does not officially export a `cors`
 * entrypoint for the Edge runtime.
 */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
} as const;

/** QA-grade per-user rate limit: 10 searches per authenticated user per minute. */
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;
const rateLimitBuckets = new Map<string, number[]>();

function rateLimitExceeded(userId: string): boolean {
  const now = Date.now();
  const hits = (rateLimitBuckets.get(userId) ?? []).filter(t => now - t < RATE_LIMIT_WINDOW_MS);
  if (hits.length >= RATE_LIMIT_MAX) {
    rateLimitBuckets.set(userId, hits);
    return true;
  }
  hits.push(now);
  rateLimitBuckets.set(userId, hits);
  if (rateLimitBuckets.size > 5000) {
    for (const [key, stamps] of rateLimitBuckets) {
      if (stamps.every(t => now - t >= RATE_LIMIT_WINDOW_MS)) rateLimitBuckets.delete(key);
    }
  }
  return false;
}

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const statusForCode: Record<FlightSearchErrorCode, number> = {
  VALIDATION_ERROR: 400,
  AUTH_REQUIRED: 401,
  PROVIDER_NOT_CONFIGURED: 503,
  PROVIDER_AUTH_FAILED: 502,
  PROVIDER_RATE_LIMITED: 429,
  PROVIDER_UNAVAILABLE: 503,
  RESPONSE_MAPPING_ERROR: 502,
};

const retryableCodes: FlightSearchErrorCode[] = [
  'PROVIDER_RATE_LIMITED',
  'PROVIDER_UNAVAILABLE',
];

function fail(requestId: string, code: FlightSearchErrorCode, message: string, diagnosticId?: string) {
  const error: FlightSearchError = {
    code,
    message,
    retryable: retryableCodes.includes(code),
    ...(diagnosticId ? { diagnosticId } : {}),
  };
  const body: FlightSearchResponse = {
    requestId,
    status: 'error',
    mode: MODE,
    providersAttempted: ['duffel'],
    offers: [],
    errors: [error],
  };
  return json(body, statusForCode[code]);
}

async function callDuffel(token: string, payload: unknown) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DUFFEL_TIMEOUT_MS);
  try {
    const res = await fetch(buildOfferRequestUrl(DUFFEL_API_BASE), {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Duffel-Version': DUFFEL_API_VERSION,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return { res, timedOut: false as const };
  } catch (_err) {
    return { res: null, timedOut: true as const };
  } finally {
    clearTimeout(timer);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const requestId = crypto.randomUUID();

  // Only the expected methods are permitted.
  if (req.method !== 'POST') {
    return json(
      { requestId, status: 'error', mode: MODE, providersAttempted: [], offers: [], errors: [
        { code: 'VALIDATION_ERROR', message: 'Method not allowed.', retryable: false },
      ] },
      405,
    );
  }

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    if (!authHeader.startsWith('Bearer ')) {
      return fail(requestId, 'AUTH_REQUIRED', 'Please sign in to search flights.');
    }
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const { data: userData, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', ''),
    );
    if (userError || !userData?.user) {
      return fail(requestId, 'AUTH_REQUIRED', 'Please sign in to search flights.');
    }

    if (rateLimitExceeded(userData.user.id)) {
      return fail(
        requestId,
        'PROVIDER_RATE_LIMITED',
        'Too many flight searches. Please wait a moment and try again.',
      );
    }

    let rawBody: unknown = {};
    try {
      rawBody = await req.json();
    } catch {
      rawBody = {};
    }

    const parsed = validateFlightSearchRequest(rawBody);
    if (!parsed.ok || !parsed.value) {
      return fail(requestId, 'VALIDATION_ERROR', parsed.errors.join('; '));
    }
    const request = parsed.value;

    const token = Deno.env.get('DUFFEL_TEST_KEY');
    if (!token) {
      return fail(
        requestId,
        'PROVIDER_NOT_CONFIGURED',
        'Flight search is not available yet. The flight provider is not configured for this environment.',
      );
    }

    const payload = buildOfferRequestPayload(request);
    console.log(`[flight-search ${requestId}] duffel offer_request`, {
      origin: request.origin,
      destination: request.destination,
      departureDate: request.departureDate,
      returnDate: request.returnDate,
      passengers: request.adults + request.children,
      cabinClass: request.cabinClass,
      mode: MODE,
    });

    // One retry, only for timeout / 429 / 5xx.
    let attempt = 0;
    let res: Response | null = null;
    let timedOut = false;
    while (attempt < 2) {
      const outcome = await callDuffel(token, payload);
      res = outcome.res;
      timedOut = outcome.timedOut;
      const shouldRetry = timedOut || (res !== null && (res.status === 429 || res.status >= 500));
      if (!shouldRetry) break;
      attempt += 1;
      if (attempt < 2) await new Promise((r) => setTimeout(r, 600));
    }

    if (timedOut || !res) {
      return fail(
        requestId,
        'PROVIDER_UNAVAILABLE',
        'The flight provider did not respond in time. Please try again in a moment.',
        requestId,
      );
    }

    if (!res.ok) {
      const code = classifyDuffelStatus(res.status);
      // Drain the body so it is not leaked and the connection is released.
      await res.text().catch(() => '');
      console.error(`[flight-search ${requestId}] provider error`, { status: res.status, code });
      const messages: Record<FlightSearchErrorCode, string> = {
        VALIDATION_ERROR: 'Invalid search.',
        AUTH_REQUIRED: 'Please sign in to search flights.',
        PROVIDER_NOT_CONFIGURED: 'Flight search is not available yet.',
        PROVIDER_AUTH_FAILED: 'Flight search is temporarily unavailable. Our team has been notified.',
        PROVIDER_RATE_LIMITED: 'Too many flight searches right now. Please wait a moment and try again.',
        PROVIDER_UNAVAILABLE: 'The flight provider is unavailable right now. Please try again shortly.',
        RESPONSE_MAPPING_ERROR: 'We could not read the flight results.',
      };
      return fail(requestId, code, messages[code], requestId);
    }

    let offers: CanonicalFlightOffer[] = [];
    try {
      const body = await res.json();
      const rawOffers = body?.data?.offers ?? [];
      const observedAt = new Date().toISOString();
      offers = (Array.isArray(rawOffers) ? rawOffers : [])
        .map((o: unknown) => {
          try {
            return normalizeDuffelOffer(o, {
              mode: MODE,
              passengerCount: request.adults + request.children,
              observedAt,
            });
          } catch {
            return null;
          }
        })
        .filter((o): o is CanonicalFlightOffer => o !== null)
        // Reject structurally incomplete offers, then cap the result set.
        .filter(isValidCanonicalOffer)
        .slice(0, MAX_RETURNED_OFFERS);
    } catch (err) {
      console.error(`[flight-search ${requestId}] mapping failure`, (err as Error).message);
      return fail(
        requestId,
        'RESPONSE_MAPPING_ERROR',
        'We could not read the flight results. Please try again.',
        requestId,
      );
    }

    const body: FlightSearchResponse = {
      requestId,
      status: offers.length > 0 ? 'ok' : 'no_results',
      mode: MODE,
      providersAttempted: ['duffel'],
      offers,
      errors: [],
    };
    console.log(`[flight-search ${requestId}] completed`, { status: body.status, offers: offers.length });
    return json(body, 200);
  } catch (err) {
    console.error(`[flight-search ${requestId}] unhandled`, (err as Error).message);
    return fail(
      requestId,
      'PROVIDER_UNAVAILABLE',
      'Flight search failed unexpectedly. Please try again.',
      requestId,
    );
  }
});
