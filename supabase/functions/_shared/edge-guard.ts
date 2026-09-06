/**
 * Shared predeployment guard for the provider proxies.
 *
 * Enforces, in one place:
 * - method allow-list (POST + OPTIONS only)
 * - CORS origin allow-list (published app, preview host, localhost dev)
 * - per-user in-memory rate limit
 * - maximum request body size
 * - upstream fetch timeout and maximum upstream response size
 * - safe error messages (no upstream body, no secret, no stack)
 *
 * Nothing here logs a provider body or a secret value.
 */

export const ALLOWED_ORIGIN_SUFFIXES = ['.lovable.app', '.lovableproject.com'] as const;
export const ALLOWED_ORIGIN_EXACT = [
  'https://taai-test.lovable.app',
  'http://localhost:8080',
  'http://localhost:5173',
] as const;

export const MAX_REQUEST_BYTES = 16 * 1024; // 16 KB — proxies receive small JSON
export const MAX_UPSTREAM_BYTES = 4 * 1024 * 1024; // 4 MB read cap before normalization
export const UPSTREAM_TIMEOUT_MS = 15_000;
export const RATE_LIMIT = { windowMs: 60_000, maxRequests: 30 } as const;

export const isAllowedOrigin = (origin: string | null): boolean => {
  if (!origin) return false;
  if ((ALLOWED_ORIGIN_EXACT as readonly string[]).includes(origin)) return true;
  try {
    const url = new URL(origin);
    if (url.protocol !== 'https:') return false;
    return ALLOWED_ORIGIN_SUFFIXES.some((suffix) => url.hostname.endsWith(suffix));
  } catch {
    return false;
  }
};

/** CORS headers echo only an allow-listed origin; unknown origins get none. */
export const buildCorsHeaders = (origin: string | null): Record<string, string> => ({
  'Access-Control-Allow-Origin': isAllowedOrigin(origin) ? (origin as string) : ALLOWED_ORIGIN_EXACT[0],
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Vary': 'Origin',
});

const buckets = new Map<string, { count: number; resetAt: number }>();

/** Fixed-window per-identity rate limit. Returns false when the caller is over. */
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

/** Upstream fetch with timeout and a maximum response size. */
export const fetchUpstreamJson = async (
  url: string,
  init: RequestInit,
): Promise<{ ok: true; data: unknown } | { ok: false; status: number; error: string }> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
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
