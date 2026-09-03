/**
 * Internal request controller — memory-only request coalescing + cancellation.
 *
 * Rules enforced here:
 * - Private records (itineraries, profiles) are cached in memory ONLY. Never
 *   sessionStorage/localStorage. Session storage stays reserved for
 *   non-sensitive reference data (e.g. country coordinates).
 * - Cache entries are owned by a user id. A user change or logout aborts
 *   in-flight work and clears everything, so one account can never read
 *   another account's cache.
 * - Bounded: at most PRIVATE_CACHE_MAX_ENTRIES entries, each valid for at
 *   most PRIVATE_CACHE_TTL_MS. Expired entries are dropped before reuse.
 * - Component cleanup releases its reference; when the last reference goes
 *   away while a request is still in flight, the real network request is
 *   aborted through its AbortSignal.
 * - Callers can invalidate by key prefix or bypass the cache for a manual
 *   refresh.
 */

/** Hard ceiling on cached private responses. */
export const PRIVATE_CACHE_MAX_ENTRIES = 50;
/** Private data is never reused for longer than this. */
export const PRIVATE_CACHE_TTL_MS = 30_000;

type Entry<T = unknown> = {
  key: string;
  owner: string | null;
  refs: number;
  settled: boolean;
  settledAt: number;
  value?: T;
  promise: Promise<T>;
  controller: AbortController;
};

const cache = new Map<string, Entry>();
let owner: string | null | undefined;

export interface RequestHandle<T> {
  promise: Promise<T>;
  /** Release this consumer's reference; aborts the network call if it was the last one in flight. */
  release: () => void;
  /** True when the value came from the in-memory cache. */
  fromCache: boolean;
}

const drop = (entry: Entry) => {
  if (cache.get(entry.key) === entry) cache.delete(entry.key);
};

const isExpired = (entry: Entry): boolean =>
  entry.settled && Date.now() - entry.settledAt > PRIVATE_CACHE_TTL_MS;

/** Drops every settled entry whose TTL has elapsed. */
const pruneExpired = (): void => {
  cache.forEach(entry => {
    if (isExpired(entry)) cache.delete(entry.key);
  });
};

/**
 * Keeps the cache bounded. Insertion-ordered Map: the oldest entries are
 * evicted first, preferring settled ones so in-flight work is not cancelled.
 */
const enforceMaxEntries = (): void => {
  if (cache.size <= PRIVATE_CACHE_MAX_ENTRIES) return;
  for (const entry of Array.from(cache.values())) {
    if (cache.size <= PRIVATE_CACHE_MAX_ENTRIES) return;
    if (entry.settled) cache.delete(entry.key);
  }
  for (const entry of Array.from(cache.values())) {
    if (cache.size <= PRIVATE_CACHE_MAX_ENTRIES) return;
    entry.controller.abort();
    cache.delete(entry.key);
  }
};

/**
 * Declares the current cache owner. Any change (login, account switch,
 * logout) wipes every cached private response and aborts in-flight work.
 */
export const setRequestOwner = (userId: string | null): void => {
  if (owner === userId) return;
  owner = userId;
  clearRequestCache();
};

export const invalidateRequests = (prefix: string): void => {
  cache.forEach(entry => {
    if (entry.key.startsWith(prefix)) {
      if (!entry.settled) entry.controller.abort();
      cache.delete(entry.key);
    }
  });
};

export const clearRequestCache = (): void => {
  cache.forEach(entry => {
    if (!entry.settled) entry.controller.abort();
  });
  cache.clear();
};

/** Test/diagnostic helper. */
export const __requestControllerState = () => ({
  size: cache.size,
  keys: Array.from(cache.keys()),
  owner: owner ?? null,
});

export const resetRequestController = (): void => {
  clearRequestCache();
  owner = undefined;
};

export function request<T>(opts: {
  key: string;
  userId: string | null;
  bypassCache?: boolean;
  run: (signal: AbortSignal) => Promise<T>;
}): RequestHandle<T> {
  const { key, userId, bypassCache = false, run } = opts;
  setRequestOwner(userId);
  pruneExpired();

  const existing = cache.get(key) as Entry<T> | undefined;

  if (existing && existing.owner === userId && !bypassCache && !isExpired(existing)) {
    existing.refs += 1;
    return {
      promise: existing.promise,
      fromCache: existing.settled,
      release: () => releaseEntry(existing),
    };
  }

  if (existing) {
    if (!existing.settled) existing.controller.abort();
    cache.delete(key);
  }

  const controller = new AbortController();
  const entry: Entry<T> = {
    key,
    owner: userId,
    refs: 1,
    settled: false,
    settledAt: 0,
    promise: undefined as unknown as Promise<T>,
    controller,
  };

  entry.promise = run(controller.signal).then(
    value => {
      entry.settled = true;
      entry.settledAt = Date.now();
      entry.value = value;
      return value;
    },
    error => {
      drop(entry);
      throw error;
    }
  );

  cache.set(key, entry as Entry);
  enforceMaxEntries();
  return { promise: entry.promise, fromCache: false, release: () => releaseEntry(entry) };
}

const releaseEntry = (entry: Entry): void => {
  entry.refs = Math.max(0, entry.refs - 1);
  if (entry.refs === 0 && !entry.settled) {
    entry.controller.abort();
    drop(entry);
  }
};

/** Applies an AbortSignal to a Supabase query builder when supported. */
export const withAbort = <Q>(query: Q, signal: AbortSignal): Q => {
  const candidate = query as unknown as { abortSignal?: (s: AbortSignal) => Q };
  return typeof candidate.abortSignal === 'function' ? candidate.abortSignal(signal) : query;
};
