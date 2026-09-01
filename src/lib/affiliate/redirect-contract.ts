/**
 * Travelpayouts redirect contract — TYPED INTERFACE ONLY, DISABLED.
 *
 * No script is loaded, no credentials exist, no outbound URL is produced.
 * This file documents the shape of the future redirect route so downstream
 * code can be written against it without enabling affiliate commerce.
 * Existing Expedia Partnerize and Viator links are untouched by this module.
 */

export type AffiliateProgram = 'travelpayouts';

/** Route shape reserved for the future redirect handler: /r/travelpayouts/:program/:linkId */
export const TRAVELPAYOUTS_REDIRECT_ROUTE_PATTERN = '/r/travelpayouts/:program/:linkId' as const;

export interface AffiliateRedirectRequest {
  program: AffiliateProgram;
  /** Opaque link identifier issued by the affiliate program. */
  linkId: string;
  /** Canonical destination the redirect would resolve to, once enabled. */
  targetUrl: string;
  attribution: {
    surface: string;
    requestId?: string | null;
    providerOfferId?: string | null;
  };
}

export type AffiliateRedirectResult =
  | { enabled: true; redirectUrl: string }
  | { enabled: false; reason: 'program_not_connected' };

export const AFFILIATE_REDIRECT_ENABLED = false;

/**
 * Always returns disabled. Kept as the single call site so enabling the
 * program later is one explicit change with an approval gate.
 */
export const resolveAffiliateRedirect = (
  _request: AffiliateRedirectRequest,
): AffiliateRedirectResult => ({ enabled: false, reason: 'program_not_connected' });
