import { afterEach, describe, expect, it } from 'vitest';
import {
  SIGNUP_ATTRIBUTION_METADATA_KEYS,
  SIGNUP_ATTRIBUTION_STORAGE_KEY,
  SIGNUP_ATTRIBUTION_TTL_MS,
  attributionFieldsForEmptyProfile,
  captureFirstTouchAttribution,
  shouldPersistAttributionOnSession,
  toSignupMetadata,
} from './utm';

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
    dump: () => values.get(SIGNUP_ATTRIBUTION_STORAGE_KEY) ?? null,
  };
}

const campaign = [
  'utm_source=newsletter',
  'utm_medium=email',
  'utm_campaign=spring',
  'utm_content=hero',
  'utm_term=flights',
].join('&');

describe('captureFirstTouchAttribution', () => {
  afterEach(() => {
    localStorage.removeItem(SIGNUP_ATTRIBUTION_STORAGE_KEY);
  });

  it('reads utm params, referrer, and landing path on first load', () => {
    const storage = memoryStorage();
    const now = Date.parse('2026-10-14T12:00:00.000Z');

    const attribution = captureFirstTouchAttribution({
      search: `?${campaign}`,
      referrer: 'https://news.example/issue',
      path: `/signup?${campaign}`,
      now,
      storage,
    });

    expect(attribution).toEqual({
      utm_source: 'newsletter',
      utm_medium: 'email',
      utm_campaign: 'spring',
      utm_content: 'hero',
      utm_term: 'flights',
      signup_referrer: 'https://news.example/issue',
      landing_path: `/signup?${campaign}`,
      first_touch_at: '2026-10-14T12:00:00.000Z',
    });
    expect(storage.dump()).toContain('"utm_source":"newsletter"');
  });

  it('keeps the first touch when a later visit has different utm params', () => {
    const storage = memoryStorage();
    const now = Date.parse('2026-10-14T12:00:00.000Z');
    captureFirstTouchAttribution({
      search: '?utm_source=newsletter&utm_medium=email',
      referrer: 'https://news.example/issue',
      path: '/welcome?utm_source=newsletter&utm_medium=email',
      now,
      storage,
    });

    const second = captureFirstTouchAttribution({
      search: '?utm_source=instagram&utm_medium=social&utm_campaign=retarget',
      referrer: 'https://instagram.com/ad',
      path: '/signup?utm_source=instagram',
      now: now + 60_000,
      storage,
    });

    expect(second.utm_source).toBe('newsletter');
    expect(second.utm_medium).toBe('email');
    expect(second.utm_campaign).toBeUndefined();
    expect(second.signup_referrer).toBe('https://news.example/issue');
    expect(second.landing_path).toBe('/welcome?utm_source=newsletter&utm_medium=email');
  });

  it('returns the stored snapshot after the query string is gone', () => {
    const storage = memoryStorage();
    const now = Date.parse('2026-10-14T12:00:00.000Z');
    captureFirstTouchAttribution({
      search: `?${campaign}`,
      referrer: 'https://news.example/issue',
      path: `/signup?${campaign}`,
      now,
      storage,
    });

    const afterNavigation = captureFirstTouchAttribution({
      search: '',
      referrer: 'https://taai.travel/signup',
      path: '/login',
      now: now + 5 * 60_000,
      storage,
    });

    expect(afterNavigation.utm_source).toBe('newsletter');
    expect(afterNavigation.utm_term).toBe('flights');
    expect(afterNavigation.landing_path).toBe(`/signup?${campaign}`);
    expect(toSignupMetadata(afterNavigation).utm_campaign).toBe('spring');
  });

  it('fills utm fields once when the first visit had none', () => {
    const storage = memoryStorage();
    const now = Date.parse('2026-10-01T00:00:00.000Z');
    captureFirstTouchAttribution({
      search: '',
      referrer: 'https://www.google.com/',
      path: '/',
      now,
      storage,
    });

    const upgraded = captureFirstTouchAttribution({
      search: '?utm_source=partner&utm_medium=cpc&utm_campaign=fall',
      referrer: 'https://taai.travel/',
      path: '/signup?utm_source=partner&utm_medium=cpc&utm_campaign=fall',
      now: now + 86_400_000,
      storage,
    });

    expect(upgraded.utm_source).toBe('partner');
    expect(upgraded.utm_medium).toBe('cpc');
    expect(upgraded.utm_campaign).toBe('fall');
    expect(upgraded.signup_referrer).toBe('https://www.google.com/');
    expect(upgraded.landing_path).toBe('/');
    expect(upgraded.first_touch_at).toBe('2026-10-01T00:00:00.000Z');
  });

  it('replaces the snapshot after 30 days', () => {
    const storage = memoryStorage();
    const now = Date.parse('2026-09-01T00:00:00.000Z');
    captureFirstTouchAttribution({
      search: '?utm_source=old',
      referrer: 'https://old.example/',
      path: '/old',
      now,
      storage,
    });

    const refreshed = captureFirstTouchAttribution({
      search: '?utm_source=new&utm_medium=email',
      referrer: 'https://new.example/',
      path: '/signup',
      now: now + SIGNUP_ATTRIBUTION_TTL_MS,
      storage,
    });

    expect(refreshed.utm_source).toBe('new');
    expect(refreshed.utm_medium).toBe('email');
    expect(refreshed.signup_referrer).toBe('https://new.example/');
    expect(refreshed.landing_path).toBe('/signup');
    expect(refreshed.first_touch_at).toBe(new Date(now + SIGNUP_ATTRIBUTION_TTL_MS).toISOString());
  });

  it('ignores blank parameters and trims values', () => {
    const storage = memoryStorage();
    const attribution = captureFirstTouchAttribution({
      search: '?utm_source=%20%20newsletter%20&utm_medium=&utm_campaign=%20',
      referrer: '  https://news.example/issue  ',
      path: '  /signup  ',
      now: Date.parse('2026-10-14T12:00:00.000Z'),
      storage,
    });

    expect(attribution.utm_source).toBe('newsletter');
    expect(attribution.utm_medium).toBeUndefined();
    expect(attribution.utm_campaign).toBeUndefined();
    expect(attribution.signup_referrer).toBe('https://news.example/issue');
    expect(attribution.landing_path).toBe('/signup');
  });

  it('caps oversized values before they are stored', () => {
    const storage = memoryStorage();
    const attribution = captureFirstTouchAttribution({
      search: `?utm_source=${'a'.repeat(600)}`,
      referrer: `https://example.com/${'b'.repeat(3000)}`,
      path: `/${'c'.repeat(3000)}`,
      now: Date.parse('2026-10-14T12:00:00.000Z'),
      storage,
    });

    expect(attribution.utm_source).toHaveLength(512);
    expect(attribution.signup_referrer).toHaveLength(2048);
    expect(attribution.landing_path).toHaveLength(2048);
  });

  it('ignores corrupt storage and captures the current visit', () => {
    const storage = memoryStorage();
    storage.setItem(SIGNUP_ATTRIBUTION_STORAGE_KEY, '{not json');

    const attribution = captureFirstTouchAttribution({
      search: '?utm_source=recovered',
      referrer: '',
      path: '/signup?utm_source=recovered',
      now: Date.parse('2026-10-14T12:00:00.000Z'),
      storage,
    });

    expect(attribution.utm_source).toBe('recovered');
    expect(storage.dump()).toContain('recovered');
  });

  it('still returns the current visit when storage throws', () => {
    const storage = {
      getItem: () => {
        throw new Error('denied');
      },
      setItem: () => {
        throw new Error('quota');
      },
    };

    const attribution = captureFirstTouchAttribution({
      search: '?utm_source=private',
      referrer: 'https://example.com/',
      path: '/signup',
      now: Date.parse('2026-10-14T12:00:00.000Z'),
      storage,
    });

    expect(attribution.utm_source).toBe('private');
    expect(attribution.signup_referrer).toBe('https://example.com/');
  });
});

describe('toSignupMetadata', () => {
  it('includes only the signup metadata keys that have values', () => {
    const metadata = toSignupMetadata({
      utm_source: 'newsletter',
      utm_medium: 'email',
      utm_term: 'flights',
      signup_referrer: 'https://news.example/issue',
      landing_path: '/signup',
      first_touch_at: '2026-10-14T12:00:00.000Z',
    });

    expect(Object.keys(metadata).sort()).toEqual(
      [
        'first_touch_at',
        'landing_path',
        'signup_referrer',
        'utm_medium',
        'utm_source',
        'utm_term',
      ].sort(),
    );
    expect(SIGNUP_ATTRIBUTION_METADATA_KEYS).toEqual([
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_content',
      'utm_term',
      'signup_referrer',
      'landing_path',
      'first_touch_at',
    ]);
    expect(metadata).not.toHaveProperty('utm_campaign');
    expect(metadata).not.toHaveProperty('utm_content');
  });

  it('drops invite tokens, session ids, and emails from the landing path and referrer', () => {
    const storage = memoryStorage();
    const attribution = captureFirstTouchAttribution({
      search: '?utm_source=newsletter&invite_token=secret-token&session_id=cs_test_123&email=a@b.c',
      referrer: 'https://user:pass@news.example/issue?token=secret-token#frag',
      path: '/join?utm_source=newsletter&invite_token=secret-token&session_id=cs_test_123',
      now: Date.parse('2026-10-14T12:00:00.000Z'),
      storage,
    });

    expect(attribution.landing_path).toBe('/join?utm_source=newsletter');
    expect(attribution.signup_referrer).toBeUndefined();
    expect(storage.dump()).not.toContain('secret-token');
    expect(storage.dump()).not.toContain('cs_test_123');
    expect(storage.dump()).not.toContain('a@b.c');
    expect(toSignupMetadata({
      ...attribution,
      landing_path: '/signup?utm_medium=email&token=secret-token',
      signup_referrer: 'https://news.example/issue?token=secret-token',
    })).toMatchObject({
      landing_path: '/signup?utm_medium=email',
      signup_referrer: 'https://news.example/issue',
    });
  });

  it('strips secrets already sitting in localStorage before they can be copied to a profile', () => {
    const storage = memoryStorage();
    const now = Date.parse('2026-10-14T12:00:00.000Z');
    storage.setItem(SIGNUP_ATTRIBUTION_STORAGE_KEY, JSON.stringify({
      expires_at: now + 1000,
      attribution: {
        utm_source: 'newsletter',
        landing_path: '/invite?token=secret-token',
        signup_referrer: 'https://partner.example/ad?email=a@b.c',
        first_touch_at: '2026-10-14T12:00:00.000Z',
      },
    }));

    const attribution = captureFirstTouchAttribution({
      search: '',
      referrer: '',
      path: '/home',
      now,
      storage,
    });

    expect(attribution.utm_source).toBe('newsletter');
    expect(attribution.landing_path).toBe('/invite');
    expect(attribution.signup_referrer).toBe('https://partner.example/ad');
    expect(storage.dump()).not.toContain('secret-token');
    expect(storage.dump()).not.toContain('a@b.c');
  });
});

describe('attribution profile fill', () => {
  const now = Date.parse('2026-10-14T12:00:00.000Z');

  it('fills only empty allowlisted columns and does not overwrite a saved first touch', () => {
    const patch = attributionFieldsForEmptyProfile(
      {
        utm_source: 'newsletter',
        email: 'person@example.com',
        user_type: 'individual',
        utm_medium: '   ',
      },
      {
        utm_source: 'other',
        utm_medium: 'email',
        landing_path: '/signup?utm_campaign=spring&invite_token=secret-token',
      },
    );

    expect(patch).toEqual({
      utm_medium: 'email',
      landing_path: '/signup?utm_campaign=spring',
    });
    expect(patch).not.toHaveProperty('email');
    expect(patch).not.toHaveProperty('user_type');
    expect(patch).not.toHaveProperty('utm_source');
  });

  it('writes attribution only for an account created in this session', () => {
    expect(shouldPersistAttributionOnSession({
      accountCreatedAt: '2026-10-14T11:50:00.000Z',
      now,
    })).toBe(true);
    expect(shouldPersistAttributionOnSession({
      accountCreatedAt: '2026-10-13T12:00:00.000Z',
      now,
    })).toBe(false);
    expect(shouldPersistAttributionOnSession({ accountCreatedAt: null, now })).toBe(false);
    expect(attributionFieldsForEmptyProfile(null, { utm_source: 'newsletter' })).toEqual({});
  });
});
