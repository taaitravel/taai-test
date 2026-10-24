import { describe, expect, it } from 'vitest';
import { describeAuthError } from './messages';
import { AUTH_REDIRECT_PATHS, CANONICAL_SITE_ORIGIN, SUPABASE_AUTH_REDIRECT_URLS } from './redirects';

describe('signup error copy', () => {
  it('explains a confirmation-email failure instead of repeating the raw SMTP status', () => {
    const message = describeAuthError({ message: 'Error sending confirmation email', status: 500 });
    expect(message).toMatch(/could not send the confirmation email/i);
    expect(message).toMatch(/Google/);
    expect(message).not.toMatch(/534/);
  });

  it('points confirm, Google, and reset redirects at the live site', () => {
    expect(CANONICAL_SITE_ORIGIN).toBe('https://taai-travel.lovable.app');
    expect(AUTH_REDIRECT_PATHS.confirmEmail).toBe('/terms?fromSignup=true');
    expect(AUTH_REDIRECT_PATHS.google).toBe('/home');
    expect(AUTH_REDIRECT_PATHS.recovery).toBe('/reset-password');
    expect(SUPABASE_AUTH_REDIRECT_URLS[0]).toBe('https://taai-travel.lovable.app/**');
  });
});
