/** Canonical production origin. Preview and localhost keep their own origin at runtime. */
export const CANONICAL_SITE_ORIGIN = 'https://taai-travel.lovable.app';

export const AUTH_REDIRECT_PATHS = {
  confirmEmail: '/terms?fromSignup=true',
  google: '/home',
  recovery: '/reset-password',
} as const;

export const authRedirect = (path: string): string => {
  const origin = typeof window !== 'undefined' && window.location?.origin
    ? window.location.origin
    : CANONICAL_SITE_ORIGIN;
  return `${origin}${path}`;
};

/**
 * Dashboard values that must match this list. Supabase ignores redirect
 * URLs that are not saved under Authentication → URL configuration.
 */
export const SUPABASE_AUTH_REDIRECT_URLS = [
  'https://taai-travel.lovable.app/**',
  'https://taai-test.lovable.app/**',
  'https://id-preview--f8b1d397-680f-4f30-95f9-82a6b0a9eafd.lovable.app/**',
  'https://f8b1d397-680f-4f30-95f9-82a6b0a9eafd.lovableproject.com/**',
  'http://localhost:5173/**',
  'http://localhost:8080/**',
];
