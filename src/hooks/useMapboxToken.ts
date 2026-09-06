import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Lazy, session-cached Mapbox token loader.
 *
 * - one in-flight request per browser session (shared promise)
 * - a configuration failure is cached as "unavailable" and never retried,
 *   so a missing token can never turn into a retry loop or a blank screen
 * - only ever called from a visible map component
 * - the token value is never logged; only one sanitized diagnostic line
 */
type TokenState = { token: string | null; unavailable: boolean };

let cached: TokenState | null = null;
let inFlight: Promise<TokenState> | null = null;
let warned = false;

const loadToken = async (): Promise<TokenState> => {
  if (cached) return cached;
  if (inFlight) return inFlight;

  inFlight = (async () => {
    let state: TokenState = { token: null, unavailable: true };
    try {
      const { data, error } = await supabase.functions.invoke('get-mapbox-token');
      if (!error && typeof data?.token === 'string' && data.token.length > 0) {
        state = { token: data.token, unavailable: false };
      }
    } catch {
      state = { token: null, unavailable: true };
    }
    if (state.unavailable && !warned) {
      warned = true;
      // Sanitized: no token, no headers, no coordinates, no user data.
      console.info('[map] configuration unavailable — showing map fallback');
    }
    cached = state;
    inFlight = null;
    return state;
  })();

  return inFlight;
};

/** Test/维护 helper — clears the session cache. */
export const resetMapboxTokenCache = () => {
  cached = null;
  inFlight = null;
  warned = false;
};

export const useMapboxToken = (enabled = true) => {
  const [state, setState] = useState<TokenState | null>(enabled ? cached : null);
  const [loading, setLoading] = useState(enabled && !cached);

  useEffect(() => {
    if (!enabled) return;
    if (cached) {
      setState(cached);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    loadToken().then(result => {
      if (!active) return;
      setState(result);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [enabled]);

  return {
    token: state?.token ?? null,
    unavailable: state?.unavailable ?? false,
    loading,
  };
};
