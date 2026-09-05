import { useState } from 'react';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type {
  CanonicalFlightOffer,
  FlightSearchError,
  FlightSearchResponse,
  FlightSearchStatus,
} from '@/types/flight-offer';
import { trackFlightSearchCompleted, trackFlightSearchSubmitted } from '@/lib/taai/minerva/flight-events';

export interface FlightSearchInput {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string | null;
  adults?: number;
  children?: number;
  cabinClass?: string;
}

export interface FlightSearchOutcome {
  status: FlightSearchStatus;
  requestId: string | null;
  offers: CanonicalFlightOffer[];
  error: FlightSearchError | null;
}

const CABIN_MAP: Record<string, string> = {
  ECONOMY: 'economy',
  PREMIUM: 'premium_economy',
  PREMIUM_ECONOMY: 'premium_economy',
  BUSINESS: 'business',
  FIRST: 'first',
};

const fallbackError = (message: string): FlightSearchError => ({
  code: 'PROVIDER_UNAVAILABLE',
  message,
  retryable: true,
});

const readErrorEnvelope = async (error: unknown): Promise<FlightSearchResponse | null> => {
  if (!(error instanceof FunctionsHttpError)) return null;
  try {
    const body = await error.context.clone().json();
    return body && Array.isArray(body.offers) && Array.isArray(body.errors)
      ? body as FlightSearchResponse
      : null;
  } catch {
    return null;
  }
};

export const useFlightSearch = () => {
  const [loading, setLoading] = useState(false);
  const [lastOutcome, setLastOutcome] = useState<FlightSearchOutcome | null>(null);

  const searchFlights = async (input: FlightSearchInput): Promise<FlightSearchOutcome> => {
    setLoading(true);
    const startedAt = Date.now();
    const cabinRaw = (input.cabinClass ?? 'economy').toString();
    const cabinClass = CABIN_MAP[cabinRaw.toUpperCase()] ?? cabinRaw.toLowerCase();
    const adults = input.adults ?? 1;
    const children = input.children ?? 0;

    trackFlightSearchSubmitted({
      origin: (input.origin || '').toUpperCase(),
      destination: (input.destination || '').toUpperCase(),
      departureDate: input.departureDate,
      returnDate: input.returnDate ?? null,
      passengers: adults + children,
      cabinClass,
    });

    try {
      const { data, error } = await supabase.functions.invoke<FlightSearchResponse>('flight-search', {
        body: {
          origin: (input.origin || '').trim().toUpperCase(),
          destination: (input.destination || '').trim().toUpperCase(),
          departureDate: input.departureDate,
          returnDate: input.returnDate || null,
          adults,
          children,
          cabinClass,
        },
      });

      // Non-2xx function responses live in FunctionsHttpError.context.
      const envelope = data ?? await readErrorEnvelope(error);

      let outcome: FlightSearchOutcome;
      if (envelope && Array.isArray(envelope.offers)) {
        outcome = {
          status: envelope.status,
          requestId: envelope.requestId ?? null,
          offers: envelope.offers,
          error: envelope.errors?.[0] ?? null,
        };
      } else if (error) {
        outcome = {
          status: 'error',
          requestId: null,
          offers: [],
          error: fallbackError('Flight search could not be reached. Please try again shortly.'),
        };
      } else {
        outcome = {
          status: 'error',
          requestId: null,
          offers: [],
          error: fallbackError('We could not read the flight results. Please try again.'),
        };
      }

      trackFlightSearchCompleted({
        requestId: outcome.requestId,
        status: outcome.status,
        offerCount: outcome.offers.length,
        errorCode: outcome.error?.code ?? null,
        durationMs: Date.now() - startedAt,
      });

      setLastOutcome(outcome);
      return outcome;
    } catch (err) {
      const outcome: FlightSearchOutcome = {
        status: 'error',
        requestId: null,
        offers: [],
        error: fallbackError((err as Error)?.message || 'Flight search failed. Please try again.'),
      };
      trackFlightSearchCompleted({
        requestId: null,
        status: 'error',
        offerCount: 0,
        errorCode: outcome.error?.code ?? null,
        durationMs: Date.now() - startedAt,
      });
      setLastOutcome(outcome);
      return outcome;
    } finally {
      setLoading(false);
    }
  };

  return { searchFlights, loading, lastOutcome };
};
