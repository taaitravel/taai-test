/**
 * Shared predeployment guard for the Edge Functions.
 *
 * Enforces, in one place:
 * - explicit CORS origin allow-list (no wildcard); unapproved origins rejected
 * - method allow-list (POST + OPTIONS only)
 * - server-side JWT verification; the user id always comes from the token
 * - best-effort per-user rate limit (see RATE_LIMIT_NOTE)
 * - maximum request body size
 * - fixed provider host + path allow-lists (no caller-supplied absolute URL)
 * - upstream fetch timeout, no redirect following, maximum upstream size
 * - normalized outbound response ceiling well below the upstream ceiling
 * - safe error messages (no upstream body, no secret, no stack)
 *
 * Nothing here logs a provider body or a secret value.
 */

/** Exact approved production origin. */
export const PRODUCTION_ORIGIN = 'https://taai-test.lovable.app';
/** Exact approved preview origin. */
export const PREVIEW_ORIGIN = 'https://id-preview--f8b1d397-680f-4f30-95f9-82a6b0a9eafd.lovable.app';
/** Local development origins — allowed only outside production. */
export const DEV_ORIGINS = ['http://localhost:8080', 'http://localhost:5173'] as const;

/** True when the isolate runs in the production deployment. */
export const isProductionEnv = (env?: string | null): boolean =>
  (env ?? 'production').toLowerCase() === 'production';

const readEnv = (name: string): string | null => {
  try {
    // deno-lint-ignore no-explicit-any
    return (globalThis as any).Deno?.env?.get(name) ?? null;
  } catch {
    return null;
  }
};

/** The exact list of origins this deployment accepts. */
export const allowedOrigins = (env: string | null = readEnv('TAAI_ENV')): string[] =>
  isProductionEnv(env)
    ? [PRODUCTION_ORIGIN, PREVIEW_ORIGIN]
    : [PRODUCTION_ORIGIN, PREVIEW_ORIGIN, ...DEV_ORIGINS];

export const isAllowedOrigin = (origin: string | null, env?: string | null): boolean =>
  !!origin && allowedOrigins(env ?? readEnv('TAAI_ENV')).includes(origin);

/**
 * CORS headers for an approved origin. Never returns a wildcard: unapproved
 * origins get no `Access-Control-Allow-Origin` at all and the request is
 * rejected by `guardOrigin`.
 */
export const buildCorsHeaders = (origin: string | null, env?: string | null): Record<string, string> => {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
  if (isAllowedOrigin(origin, env)) headers['Access-Control-Allow-Origin'] = origin as string;
  return headers;
};

/**
 * Rejects unapproved origins. A missing Origin header (server-to-server,
 * curl, Supabase function invoke without a browser) is allowed through, since
 * CORS only protects browser callers.
 */
export const guardOrigin = (
  origin: string | null,
  env?: string | null,
): { ok: true } | { ok: false; status: number; error: string } =>
  origin === null || isAllowedOrigin(origin, env)
    ? { ok: true }
    : { ok: false, status: 403, error: 'Origin not allowed' };

export const MAX_REQUEST_BYTES = 16 * 1024; // 16 KB — proxies receive small JSON
export const MAX_UPSTREAM_BYTES = 4 * 1024 * 1024; // 4 MB read cap before normalization
/** Outbound ceiling for the NORMALIZED payload — far below the upstream cap. */
export const MAX_NORMALIZED_BYTES = 256 * 1024; // 256 KB
export const UPSTREAM_TIMEOUT_MS = 15_000;
export const RATE_LIMIT = { windowMs: 60_000, maxRequests: 30 } as const;

/**
 * RATE LIMITER LIMITATION — read before relying on this.
 *
 * The limiter below is PROCESS-LOCAL: its counters live in the memory of a
 * single Deno isolate. Supabase runs many isolates and recycles them, so the
 * effective global rate is `30 * (number of live isolates)` per minute, and a
 * cold start resets a caller's counter. It is BEST-EFFORT abuse damping only
 * and does NOT guarantee 30 requests/minute per user globally.
 *
 * An atomic, authoritative limiter is prepared (unapplied) in
 * `supabase/schema-proposals/edge-rate-limit-authoritative.sql`.
 */
export const RATE_LIMIT_NOTE =
  'best-effort, process-local per-isolate limiter; not a global guarantee' as const;
export const RATE_LIMIT_IS_PROCESS_LOCAL = true;

const buckets = new Map<string, { count: number; resetAt: number }>();

/** Fixed-window per-identity, per-isolate limit. Returns false when over. */
export const allowRequest = (identity: string, now = Date.now()): boolean => {
  const bucket = buckets.get(identity);
  if (!bucket || now >= bucket.resetAt) {
    buckets.set(identity, { count: 1, resetAt: now + RATE_LIMIT.windowMs });
    return true;
  }
  if (bucket.count >= RATE_LIMIT.maxRequests) return false;
  bucket.count += 1;
  return true;
};

/** Test-only reset so the limiter never leaks state between cases. */
export const resetRateLimits = () => buckets.clear();

/** Reads a request body with a hard size cap. */
export const readBoundedJson = async (req: Request): Promise<{ ok: true; value: unknown } | { ok: false; error: string }> => {
  const declared = Number(req.headers.get('content-length') ?? '0');
  if (Number.isFinite(declared) && declared > MAX_REQUEST_BYTES) {
    return { ok: false, error: 'Request body too large' };
  }
  const text = await req.text();
  if (text.length > MAX_REQUEST_BYTES) return { ok: false, error: 'Request body too large' };
  try {
    return { ok: true, value: JSON.parse(text || '{}') };
  } catch {
    return { ok: false, error: 'Invalid JSON body' };
  }
};

// ---------------------------------------------------------------------------
// Authentication
// ---------------------------------------------------------------------------

export type TokenVerifier = (token: string) => Promise<{ userId: string | null }>;

/**
 * Verifies the bearer token server-side and returns the user id FROM THE
 * TOKEN. A caller-supplied `user_id`/`userId` in the body is never trusted:
 * callers only receive the verified identity from here.
 */
export const authenticate = async (
  req: Request,
  verify: TokenVerifier,
): Promise<{ ok: true; userId: string } | { ok: false; status: number; error: string }> => {
  const header = req.headers.get('Authorization');
  if (!header || !header.startsWith('Bearer ')) {
    return { ok: false, status: 401, error: 'Authentication required' };
  }
  const token = header.slice('Bearer '.length).trim();
  if (!token) return { ok: false, status: 401, error: 'Authentication required' };
  try {
    const { userId } = await verify(token);
    if (!userId) return { ok: false, status: 401, error: 'Unauthorized' };
    return { ok: true, userId };
  } catch {
    return { ok: false, status: 401, error: 'Unauthorized' };
  }
};

/** Strips any caller-supplied identity field from a request payload. */
export const stripCallerIdentity = <T extends Record<string, unknown>>(payload: T): T => {
  const clone = { ...payload };
  for (const key of ['user_id', 'userId', 'userid', 'uid', 'owner_id', 'sub']) delete clone[key];
  return clone;
};

// ---------------------------------------------------------------------------
// Provider host + path allow-lists (SSRF containment)
// ---------------------------------------------------------------------------

export const PROVIDER_ALLOW_LIST = {
  expedia: {
    host: 'expedia13.p.rapidapi.com',
    paths: [
      '/api/v1/test',
      '/api/v1/hotels/search',
      '/api/v1/hotels/details',
      '/api/v1/flights/search',
      '/api/v1/flights/details',
      '/api/v1/activities/search',
      '/api/v1/destinations/search',
    ],
  },
  'booking.com': {
    host: 'booking-com15.p.rapidapi.com',
    paths: [
      '/api/v1/hotels/searchHotels',
      '/api/v1/hotels/searchDestination',
      '/api/v1/hotels/getRoomListWithAvailability',
      '/api/v1/hotels/getHotelDetails',
      '/api/v1/cars/searchCarRentals',
    ],
  },
} as const;

export type ProviderKey = keyof typeof PROVIDER_ALLOW_LIST;

/**
 * Turns a caller value into a provider URL built from the FIXED https host.
 * The caller can only choose a path from the allow-list: host, scheme, port,
 * credentials and any absolute URL it supplies are discarded, so localhost,
 * private-network and metadata-service targets are unreachable.
 */
export const resolveProviderUrl = (
  provider: ProviderKey,
  endpointOrPath: unknown,
  params: Record<string, unknown> = {},
): { ok: true; url: URL; path: string } | { ok: false; status: number; error: string } => {
  const entry = PROVIDER_ALLOW_LIST[provider];
  if (typeof endpointOrPath !== 'string' || !endpointOrPath.trim()) {
    return { ok: false, status: 400, error: 'Invalid endpoint' };
  }
  const raw = endpointOrPath.trim();
  let path: string;
  if (/^[a-z][a-z0-9+.-]*:/i.test(raw)) {
    // An absolute URL is not trusted; only its pathname is considered, and it
    // must be an https URL for the allow-listed host.
    let parsed: URL;
    try {
      parsed = new URL(raw);
    } catch {
      return { ok: false, status: 400, error: 'Invalid endpoint' };
    }
    if (parsed.protocol !== 'https:' || parsed.hostname !== entry.host || parsed.port || parsed.username || parsed.password) {
      return { ok: false, status: 403, error: 'Forbidden host' };
    }
    path = parsed.pathname;
  } else {
    path = raw.startsWith('/') ? raw : `/${raw}`;
  }
  if (path.includes('..') || path.includes('//') || !(entry.paths as readonly string[]).includes(path)) {
    return { ok: false, status: 403, error: 'Forbidden endpoint' };
  }
  const url = new URL(`https://${entry.host}${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && value !== '') url.searchParams.append(key, String(value));
  }
  return { ok: true, url, path };
};

/** Upstream fetch with timeout, no redirect following, and a size cap. */
export const fetchUpstreamJson = async (
  url: string,
  init: RequestInit,
): Promise<{ ok: true; data: unknown } | { ok: false; status: number; error: string }> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
  try {
    // `redirect: 'manual'` — a provider redirect could escape the allow-listed
    // host, so redirects are never followed.
    const response = await fetch(url, { ...init, redirect: 'manual', signal: controller.signal });
    if (response.status >= 300 && response.status < 400) {
      return { ok: false, status: 502, error: 'Upstream redirect rejected' };
    }
    if (!response.ok) {
      // Upstream body is intentionally NOT logged or relayed.
      return { ok: false, status: response.status, error: `Upstream request failed (${response.status})` };
    }
    const text = await response.text();
    if (text.length > MAX_UPSTREAM_BYTES) {
      return { ok: false, status: 502, error: 'Upstream response too large' };
    }
    try {
      return { ok: true, data: JSON.parse(text) };
    } catch {
      return { ok: false, status: 502, error: 'Upstream returned invalid JSON' };
    }
  } catch (error) {
    const aborted = error instanceof DOMException && error.name === 'AbortError';
    return { ok: false, status: aborted ? 504 : 502, error: aborted ? 'Upstream request timed out' : 'Upstream request failed' };
  } finally {
    clearTimeout(timer);
  }
};

/**
 * Final outbound guard: the normalized payload must stay under
 * MAX_NORMALIZED_BYTES. If normalization unexpectedly produces more, a safe
 * error is returned instead of the payload.
 */
export const serializeBounded = (
  payload: unknown,
): { ok: true; body: string; bytes: number } | { ok: false; status: number; error: string } => {
  let body: string;
  try {
    body = JSON.stringify(payload ?? null);
  } catch {
    return { ok: false, status: 500, error: 'Unable to serialize response' };
  }
  const bytes = new TextEncoder().encode(body).length;
  if (bytes > MAX_NORMALIZED_BYTES) {
    return { ok: false, status: 502, error: 'Normalized response exceeded size ceiling' };
  }
  return { ok: true, body, bytes };
};
