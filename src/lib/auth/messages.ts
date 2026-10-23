const CONFIRMATION = /confirmation email|error sending email|error sending confirmation/i;
const SMTP = /application-specific password|535|534/i;

/** Turns a Supabase auth error into a sentence a traveler can act on. */
export const describeAuthError = (error: unknown, fallback = 'Something went wrong. Please try again.'): string => {
  const message = error && typeof error === 'object' && 'message' in error
    ? String((error as { message?: unknown }).message || '')
    : error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : '';
  const status = error && typeof error === 'object' && 'status' in error
    ? Number((error as { status?: unknown }).status)
    : NaN;

  if (!message && !Number.isFinite(status)) return fallback;
  if (CONFIRMATION.test(message) || SMTP.test(message) || status === 500 && /email/i.test(message)) {
    return 'We could not send the confirmation email. Try again in a few minutes, or continue with Google. If this keeps happening, the sending mailbox needs a Google app password in Supabase Auth SMTP.';
  }
  if (/already registered|already been registered|user already/i.test(message)) {
    return 'An account with that email already exists. Sign in, or reset the password if you do not remember it.';
  }
  if (/password/i.test(message) && /weak|short|least/i.test(message)) {
    return 'Use 8 or more characters with an uppercase letter, a lowercase letter, a number, and a symbol.';
  }
  if (/redirect/i.test(message) && /not allowed|invalid/i.test(message)) {
    return 'This site is not on the sign-in allow list yet. Open taai from taai-travel.lovable.app, or ask for that address to be added in Supabase Auth redirect URLs.';
  }
  if (/email not confirmed/i.test(message)) {
    return 'Confirm your email before signing in. Check the inbox and spam folder for the taai message.';
  }
  if (/invalid login|invalid credentials|invalid email or password/i.test(message)) {
    return 'That email and password did not match. Try again, or reset the password.';
  }
  if (/rate limit|too many/i.test(message)) {
    return 'Too many attempts. Wait a minute and try again.';
  }
  return message || fallback;
};
