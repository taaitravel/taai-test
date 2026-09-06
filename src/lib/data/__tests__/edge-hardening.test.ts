import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  DEV_ORIGINS,
  MAX_NORMALIZED_BYTES,
  MAX_UPSTREAM_BYTES,
  PREVIEW_ORIGIN,
  PRODUCTION_ORIGIN,
  RATE_LIMIT_IS_PROCESS_LOCAL,
  RATE_LIMIT_NOTE,
  allowedOrigins,
  authenticate,
  buildCorsHeaders,
  guardOrigin,
  resolveProviderUrl,
  serializeBounded,
  stripCallerIdentity,
} from '../../../../supabase/functions/_shared/edge-guard';
import { fetchCartItemDetail } from '../cart-loading';
import { clearRequestCache, request, setRequestOwner } from '../request-controller';

const read = (p: string) => readFileSync(resolve(process.cwd(), p), 'utf8');

const withAuth = (token: string | null) =>
  new Request('https://edge.test/fn', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

describe('CORS origin allow-list', () => {
  it('lists exactly the approved production and preview origins in production', () => {
    expect(allowedOrigins('production')).toEqual([PRODUCTION_ORIGIN, PREVIEW_ORIGIN]);
  });

  it('adds local development origins only outside production', () => {
    expect(allowedOrigins('development')).toEqual([PRODUCTION_ORIGIN, PREVIEW_ORIGIN, ...DEV_ORIGINS]);
    expect(allowedOrigins('production')).not.toContain(DEV_ORIGINS[0]);
  });

  it('never emits a wildcard origin', () => {
    for (const origin of [PRODUCTION_ORIGIN, 'https://evil.example', null]) {
      expect(Object.values(buildCorsHeaders(origin, 'production'))).not.toContain('*');
    }
  });

  it('rejects an unapproved origin and omits the allow-origin header', () => {
    const rejected = guardOrigin('https://evil.example', 'production');
    expect(rejected).toEqual({ ok: false, status: 403, error: 'Origin not allowed' });
    expect(buildCorsHeaders('https://evil.example', 'production')['Access-Control-Allow-Origin']).toBeUndefined();
    expect(guardOrigin(PRODUCTION_ORIGIN, 'production').ok).toBe(true);
    expect(guardOrigin(PREVIEW_ORIGIN, 'production').ok).toBe(true);
    // Look-alike suffix must not pass.
    expect(guardOrigin('https://taai-test.lovable.app.evil.com', 'production').ok).toBe(false);
  });

  it('all three functions handle OPTIONS and use the shared guard', () => {
    for (const fn of ['chat-with-gpt', 'expedia-rapid-api', 'booking-com-api']) {
      const src = read(`supabase/functions/${fn}/index.ts`);
      expect(src).toContain("req.method === 'OPTIONS'");
      expect(src).toContain('buildCorsHeaders');
      expect(src).toContain('guardOrigin');
      expect(src).not.toContain("'Access-Control-Allow-Origin': '*'");
    }
  });
});

describe('authentication', () => {
  const verifier = async (token: string) => ({ userId: token === 'good-token' ? 'user-a' : null });

  it('returns 401 without an Authorization header', async () => {
    expect(await authenticate(withAuth(null), verifier)).toEqual({
      ok: false,
      status: 401,
      error: 'Authentication required',
    });
  });

  it('returns 401 for an invalid JWT', async () => {
    expect(await authenticate(withAuth('forged.jwt.value'), verifier)).toEqual({
      ok: false,
      status: 401,
      error: 'Unauthorized',
    });
  });

  it('returns 401 when verification throws', async () => {
    const result = await authenticate(withAuth('boom'), async () => {
      throw new Error('network');
    });
    expect(result).toEqual({ ok: false, status: 401, error: 'Unauthorized' });
  });

  it('derives the user id from the verified token only', async () => {
    expect(await authenticate(withAuth('good-token'), verifier)).toEqual({ ok: true, userId: 'user-a' });
  });

  it('strips a spoofed caller-supplied user id from the payload', () => {
    const cleaned = stripCallerIdentity({
      message: 'hi',
      user_id: 'victim',
      userId: 'victim',
      userid: 'victim',
      sub: 'victim',
      owner_id: 'victim',
    });
    expect(cleaned).toEqual({ message: 'hi' });
  });

  it('each function verifies the token and scopes data access to it', () => {
    for (const fn of ['chat-with-gpt', 'expedia-rapid-api', 'booking-com-api']) {
      const src = read(`supabase/functions/${fn}/index.ts`);
      expect(src).toContain('authenticate(req');
      expect(src).toContain('stripCallerIdentity');
    }
    const chat = read('supabase/functions/chat-with-gpt/index.ts');
    expect(chat).toContain(".eq('userid', userId)");
    expect(chat).not.toMatch(/userId\s*=\s*(validatedData|body|payload)/);
  });
});

describe('rate limiter limitations', () => {
  it('is documented as process-local and best-effort', () => {
    expect(RATE_LIMIT_IS_PROCESS_LOCAL).toBe(true);
    expect(RATE_LIMIT_NOTE).toMatch(/best-effort/);
    expect(RATE_LIMIT_NOTE).toMatch(/process-local/);
    const guard = read('supabase/functions/_shared/edge-guard.ts');
    expect(guard).toContain('does NOT guarantee 30 requests/minute per user globally');
  });

  it('has an unapplied authoritative proposal', () => {
    const sql = read('supabase/schema-proposals/edge-rate-limit-authoritative.sql');
    expect(sql).toContain('UNAPPLIED PROPOSAL');
    expect(sql).toContain('consume_rate_limit');
    expect(sql).toContain('on conflict (scope, user_id, window_start)');
  });
});

describe('provider host and path allow-lists', () => {
  it('rejects a caller-supplied foreign absolute URL', () => {
    for (const url of [
      'https://evil.example/api/v1/hotels/search',
      'http://localhost:8080/api/v1/hotels/search',
      'https://127.0.0.1/api/v1/hotels/search',
      'https://169.254.169.254/latest/meta-data/',
      'https://10.0.0.5/api/v1/hotels/search',
      'https://user:pass@expedia13.p.rapidapi.com/api/v1/hotels/search',
      'https://expedia13.p.rapidapi.com:8443/api/v1/hotels/search',
      'file:///etc/passwd',
    ]) {
      const result = resolveProviderUrl('expedia', url);
      expect(result.ok, url).toBe(false);
    }
  });

  it('rejects a path outside the allow-list and path traversal', () => {
    expect(resolveProviderUrl('expedia', '/api/v1/admin/keys').ok).toBe(false);
    expect(resolveProviderUrl('expedia', '/api/v1/../../secret').ok).toBe(false);
    expect(resolveProviderUrl('booking.com', '/api/v1/hotels/search').ok).toBe(false);
  });

  it('always rebuilds the request from the fixed https host', () => {
    const result = resolveProviderUrl('expedia', 'https://expedia13.p.rapidapi.com/api/v1/hotels/search', {
      destination: 'Lisbon',
      empty: '',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.url.origin).toBe('https://expedia13.p.rapidapi.com');
    expect(result.url.pathname).toBe('/api/v1/hotels/search');
    expect(result.url.searchParams.get('destination')).toBe('Lisbon');
    expect(result.url.searchParams.has('empty')).toBe(false);
  });

  it('never follows an upstream redirect that could escape the allow-list', () => {
    const guard = read('supabase/functions/_shared/edge-guard.ts');
    expect(guard).toContain("redirect: 'manual'");
    expect(guard).toContain('Upstream redirect rejected');
  });
});

describe('normalized response ceiling', () => {
  it('is substantially below the upstream ceiling', () => {
    expect(MAX_NORMALIZED_BYTES).toBeLessThanOrEqual(MAX_UPSTREAM_BYTES / 8);
  });

  it('returns a safe error when a normalized payload is oversized', () => {
    const oversized = serializeBounded({ blob: 'X'.repeat(MAX_NORMALIZED_BYTES + 1) });
    expect(oversized).toEqual({
      ok: false,
      status: 502,
      error: 'Normalized response exceeded size ceiling',
    });
    const fine = serializeBounded({ results: [{ id: 'h1' }] });
    expect(fine.ok).toBe(true);
  });

  it('is applied by both hotel proxies before responding', () => {
    for (const fn of ['expedia-rapid-api', 'booking-com-api']) {
      expect(read(`supabase/functions/${fn}/index.ts`)).toContain('serializeBounded(shaped)');
    }
  });
});

describe('cart detail authorization', () => {
  const makeClient = (row: unknown) => {
    const filters: Array<[string, unknown]> = [];
    let selected = '';
    const chain: any = {
      eq: (col: string, value: unknown) => {
        filters.push([col, value]);
        return chain;
      },
      maybeSingle: () => Promise.resolve({ data: row, error: null }),
    };
    return {
      filters,
      get selected() {
        return selected;
      },
      from: () => ({
        select: (columns: string) => {
          selected = columns;
          return chain;
        },
      }),
    };
  };

  it('queries exactly one id scoped to the authenticated user', async () => {
    const client = makeClient({ id: 'c1', item_data: { name: 'Hotel Arts' } });
    const detail = await fetchCartItemDetail(client as never, 'c1', { userId: 'user-a' });
    expect(detail).toEqual({ name: 'Hotel Arts' });
    expect(client.filters).toEqual([
      ['id', 'c1'],
      ['user_id', 'user-a'],
    ]);
    expect(client.selected).toBe('id, item_data');
  });

  it('scopes a shared trip snapshot to that trip', async () => {
    const client = makeClient({ id: 'c2', item_data: {} });
    await fetchCartItemDetail(client as never, 'c2', { userId: 'user-b', itineraryId: 'trip-9' });
    expect(client.filters).toEqual([
      ['id', 'c2'],
      ['itinerary_id', 'trip-9'],
    ]);
  });

  it('never issues a broad fallback query for an unauthorized item', async () => {
    const client = makeClient(null);
    // Another user's cart item id: the scoped filter returns no row and no
    // second, unscoped query is attempted.
    expect(await fetchCartItemDetail(client as never, 'other-users-item', { userId: 'user-a' })).toBeNull();
    expect(client.filters).toEqual([
      ['id', 'other-users-item'],
      ['user_id', 'user-a'],
    ]);
    // No authenticated user: no query at all.
    const anon = makeClient({ id: 'c1', item_data: {} });
    expect(await fetchCartItemDetail(anon as never, 'c1', { userId: '' })).toBeNull();
    expect(anon.filters).toEqual([]);
  });
});

describe('lazy item_data loading in the workspace', () => {
  const hook = () => read('src/hooks/useAuthenticatedItineraryData.ts');

  it('main itinerary load never selects item_data', () => {
    const src = hook();
    expect(src).toContain('CART_LIST_PROJECTION');
    expect(src).not.toContain('CART_DETAIL_FIELDS');
    expect(src).not.toMatch(/select\([^)]*item_data/);
  });

  it('loads a snapshot only through the scoped on-demand loader', () => {
    const src = hook();
    expect(src).toContain('loadCartItemDetail');
    expect(src).toContain('fetchCartItemDetail(supabase, cartItemId, {');
  });

  it('aborts and clears the snapshot cache on unmount and account change', () => {
    const src = hook();
    expect(src).toContain('detailAbortRef.current?.abort()');
    expect(src).toContain('detailCacheRef.current = { owner: userId, entries: new Map() }');
    expect(src).toContain('useEffect(() => () => {');
  });
});

describe('account-change cache isolation', () => {
  beforeEach(() => {
    setRequestOwner('user-a');
  });
  afterEach(() => {
    clearRequestCache();
  });

  it('drops every cached private response when the account changes', async () => {
    let calls = 0;
    const load = () =>
      request({
        key: 'itinerary:authenticated:x',
        userId: 'user-a',
        run: async () => {
          calls += 1;
          return { secret: 'user-a trip' };
        },
      });

    const first = load();
    await first.promise;
    first.release();
    const cached = load();
    await cached.promise;
    cached.release();
    expect(calls).toBe(1);

    setRequestOwner('user-b');
    const afterSwitch = request({
      key: 'itinerary:authenticated:x',
      userId: 'user-b',
      run: async () => {
        calls += 1;
        return { secret: 'user-b trip' };
      },
    });
    const value = await afterSwitch.promise;
    afterSwitch.release();
    expect(calls).toBe(2);
    expect(value).toEqual({ secret: 'user-b trip' });
  });
});

describe('chat-reaction backfill proposal', () => {
  const sql = () => read('supabase/schema-proposals/chat-reactions-itinerary-scope.sql');

  it('stays unapplied', () => {
    expect(sql()).toContain('UNAPPLIED PROPOSAL');
  });

  it('quarantines ambiguous rows instead of guessing, and fails closed', () => {
    const text = sql();
    expect(text).toContain('itinerary_chat_reactions_quarantine');
    expect(text).toContain('itinerary_count = 1');
    expect(text).toContain('ambiguous itinerary mapping');
    expect(text).toMatch(/raise exception 'aborting: % reaction rows could not be deterministically scoped'/);
    // The old destructive "delete anything unmapped" step is gone.
    expect(text).not.toContain('Orphaned reactions (message deleted) cannot be scoped and are removed.');
  });
});
