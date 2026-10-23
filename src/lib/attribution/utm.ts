/**
 * First-touch signup attribution.
 *
 * On the first page load, UTM parameters, document.referrer, and the landing
 * path are stored in localStorage for 30 days. Later visits do not replace
 * that snapshot. If the first visit had no UTM parameters, the first later
 * visit that does fills those fields in and leaves the original referrer,
 * landing path, and timestamp alone.
 */

export const SIGNUP_ATTRIBUTION_STORAGE_KEY = 'taai.signup_attribution';
export const SIGNUP_ATTRIBUTION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const UTM_MAX_LENGTH = 512;
const CONTEXT_MAX_LENGTH = 2048;

export const UTM_PARAM_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
] as const;

export const SIGNUP_ATTRIBUTION_METADATA_KEYS = [
  ...UTM_PARAM_KEYS,
  'signup_referrer',
  'landing_path',
  'first_touch_at',
] as const;

export type UtmParamKey = (typeof UTM_PARAM_KEYS)[number];
export type SignupAttributionKey = (typeof SIGNUP_ATTRIBUTION_METADATA_KEYS)[number];

export interface SignupAttribution {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  signup_referrer?: string;
  landing_path?: string;
  first_touch_at?: string;
}

export interface AttributionEnvironment {
  search?: string;
  referrer?: string;
  path?: string;
  now?: number;
  storage?: Pick<Storage, 'getItem' | 'setItem'>;
}

interface StoredSignupAttribution {
  attribution: SignupAttribution;
  expires_at: number;
}

function clean(value: string | null | undefined, maxLength: number): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim().replace(/[\u0000-\u001F\u007F]/g, '');
  if (!trimmed) return undefined;
  return trimmed.slice(0, maxLength);
}

function hasUtm(attribution: SignupAttribution): boolean {
  return UTM_PARAM_KEYS.some((key) => Boolean(attribution[key]));
}

function sanitizeAttribution(value: unknown): SignupAttribution {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const record = value as Record<string, unknown>;
  const attribution: SignupAttribution = {};

  for (const key of UTM_PARAM_KEYS) {
    const cleaned = clean(typeof record[key] === 'string' ? record[key] : undefined, UTM_MAX_LENGTH);
    if (cleaned) attribution[key] = cleaned;
  }

  const referrer = clean(
    typeof record.signup_referrer === 'string' ? record.signup_referrer : undefined,
    CONTEXT_MAX_LENGTH,
  );
  if (referrer) attribution.signup_referrer = referrer;

  const landingPath = clean(
    typeof record.landing_path === 'string' ? record.landing_path : undefined,
    CONTEXT_MAX_LENGTH,
  );
  if (landingPath) attribution.landing_path = landingPath;

  const touchedAt = clean(
    typeof record.first_touch_at === 'string' ? record.first_touch_at : undefined,
    64,
  );
  if (touchedAt && !Number.isNaN(Date.parse(touchedAt))) {
    attribution.first_touch_at = touchedAt;
  }

  return attribution;
}

function readStored(
  storage: Pick<Storage, 'getItem'>,
  now: number,
): StoredSignupAttribution | null {
  try {
    const raw = storage.getItem(SIGNUP_ATTRIBUTION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredSignupAttribution>;
    if (!parsed || typeof parsed.expires_at !== 'number' || parsed.expires_at <= now) {
      return null;
    }
    return {
      expires_at: parsed.expires_at,
      attribution: sanitizeAttribution(parsed.attribution),
    };
  } catch {
    return null;
  }
}

function writeStored(
  storage: Pick<Storage, 'setItem'>,
  record: StoredSignupAttribution,
): void {
  try {
    storage.setItem(SIGNUP_ATTRIBUTION_STORAGE_KEY, JSON.stringify(record));
  } catch {
    // Private mode and quota failures still return the in-memory snapshot.
  }
}

function resolveEnvironment(env: AttributionEnvironment): Required<
  Pick<AttributionEnvironment, 'search' | 'referrer' | 'path' | 'now' | 'storage'>
> {
  const search = env.search ?? (typeof window !== 'undefined' ? window.location.search : '');
  const referrer = env.referrer ?? (typeof document !== 'undefined' ? document.referrer : '');
  const path = env.path ?? (
    typeof window !== 'undefined' ? `${window.location.pathname}${window.location.search}` : ''
  );

  let storage = env.storage;
  if (!storage) {
    try {
      storage = typeof localStorage !== 'undefined' ? localStorage : undefined;
    } catch {
      storage = undefined;
    }
  }

  return {
    search,
    referrer,
    path,
    now: env.now ?? Date.now(),
    storage: storage ?? { getItem: () => null, setItem: () => undefined },
  };
}

function attributionFromLocation(
  search: string,
  referrer: string,
  path: string,
  now: number,
): SignupAttribution {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const attribution: SignupAttribution = {};

  for (const key of UTM_PARAM_KEYS) {
    const value = clean(params.get(key), UTM_MAX_LENGTH);
    if (value) attribution[key] = value;
  }

  const cleanedReferrer = clean(referrer, CONTEXT_MAX_LENGTH);
  if (cleanedReferrer) attribution.signup_referrer = cleanedReferrer;

  const landingPath = clean(path, CONTEXT_MAX_LENGTH);
  if (landingPath) attribution.landing_path = landingPath;

  attribution.first_touch_at = new Date(now).toISOString();
  return attribution;
}

function pickUtms(attribution: SignupAttribution): Pick<SignupAttribution, UtmParamKey> {
  const utms: Pick<SignupAttribution, UtmParamKey> = {};
  for (const key of UTM_PARAM_KEYS) {
    if (attribution[key]) utms[key] = attribution[key];
  }
  return utms;
}

/**
 * Read the current URL once and keep the first snapshot for 30 days.
 * Safe to call on every page load and again at signup.
 */
export function captureFirstTouchAttribution(
  env: AttributionEnvironment = {},
): SignupAttribution {
  const resolved = resolveEnvironment(env);
  const current = attributionFromLocation(
    resolved.search,
    resolved.referrer,
    resolved.path,
    resolved.now,
  );
  const stored = readStored(resolved.storage, resolved.now);

  if (!stored) {
    writeStored(resolved.storage, {
      attribution: current,
      expires_at: resolved.now + SIGNUP_ATTRIBUTION_TTL_MS,
    });
    return current;
  }

  if (hasUtm(stored.attribution) || !hasUtm(current)) {
    return stored.attribution;
  }

  const upgraded: SignupAttribution = {
    ...stored.attribution,
    ...pickUtms(current),
    signup_referrer: stored.attribution.signup_referrer ?? current.signup_referrer,
    landing_path: stored.attribution.landing_path ?? current.landing_path,
    first_touch_at: stored.attribution.first_touch_at ?? current.first_touch_at,
  };

  writeStored(resolved.storage, {
    attribution: upgraded,
    expires_at: stored.expires_at,
  });
  return upgraded;
}

/** Metadata fragment merged into the signup request. Omits empty fields. */
export function toSignupMetadata(attribution: SignupAttribution): SignupAttribution {
  const metadata: SignupAttribution = {};
  for (const key of SIGNUP_ATTRIBUTION_METADATA_KEYS) {
    const value = attribution[key];
    if (value) metadata[key] = value;
  }
  return metadata;
}
