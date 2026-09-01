/**
 * Development-only safeguards against runaway Supabase reads (egress containment).
 *
 * - `trackRead` warns when the same logical read fires more than
 *   MAX_READS_PER_WINDOW times inside WINDOW_MS.
 * - Helpers here build *stable* dependency keys so effects stop re-firing on
 *   object/array identity changes.
 *
 * The warning only ever contains the caller-provided logical key. Never pass
 * secrets, tokens, emails or payload data into `key`.
 */

const WINDOW_MS = 10_000;
const MAX_READS_PER_WINDOW = 5;

type Bucket = { timestamps: number[]; warned: boolean };

const buckets = new Map<string, Bucket>();

export const isDev = (): boolean => {
  try {
    return Boolean((import.meta as { env?: { DEV?: boolean } }).env?.DEV);
  } catch {
    return false;
  }
};

/** Records a read. Returns the number of reads in the current window. */
export const trackRead = (key: string): number => {
  const now = Date.now();
  const bucket = buckets.get(key) ?? { timestamps: [], warned: false };
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < WINDOW_MS);
  bucket.timestamps.push(now);

  if (bucket.timestamps.length > MAX_READS_PER_WINDOW && !bucket.warned) {
    bucket.warned = true;
    // eslint-disable-next-line no-console
    console.warn(
      `[read-guard] "${key}" ran ${bucket.timestamps.length} times in ${WINDOW_MS / 1000}s. ` +
        'Likely an unstable effect dependency — check hook deps and projections.'
    );
  } else if (bucket.timestamps.length <= MAX_READS_PER_WINDOW) {
    bucket.warned = false;
  }

  buckets.set(key, bucket);
  return bucket.timestamps.length;
};

export const guardRead = (key: string): void => {
  if (isDev()) trackRead(key);
};

export const __resetReadGuard = (): void => buckets.clear();

/** Stable, order-insensitive, deduplicated key for a string list. */
export const stableListKey = (values: readonly (string | null | undefined)[] | null | undefined): string => {
  const cleaned = Array.from(
    new Set((values ?? []).filter((v): v is string => typeof v === 'string' && v.trim().length > 0).map((v) => v.trim()))
  ).sort();
  return cleaned.join('|');
};

export const parseListKey = (key: string): string[] => (key ? key.split('|') : []);
