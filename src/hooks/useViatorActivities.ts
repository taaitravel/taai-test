import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FunctionsHttpError } from '@supabase/supabase-js';

export type ActivitySearchErrorCode =
  | 'AUTH_REQUIRED'
  | 'VALIDATION_ERROR'
  | 'PROVIDER_NOT_CONFIGURED'
  | 'PROVIDER_AUTH_FAILED'
  | 'PROVIDER_RATE_LIMITED'
  | 'PROVIDER_UNAVAILABLE';

export interface ActivitySearchError {
  code: ActivitySearchErrorCode;
  message: string;
  requestId?: string;
}

export interface ViatorActivity {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  category: string | null;
  rating: number | null;
  reviewCount: number | null;
  price: number | null;
  currency: string | null;
  images: string[];
  duration: string | null;
  groupSize: string | null;
  bookingLink: string | null;
  provider: string;
}

const readFunctionError = async (error: unknown): Promise<ActivitySearchError> => {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.clone().json();
      if (body?.error?.code && body?.error?.message) return body.error as ActivitySearchError;
    } catch {
      // Fall through to the transport-safe message.
    }
  }
  return {
    code: 'PROVIDER_UNAVAILABLE',
    message: 'Activity search could not be reached. Please try again shortly.',
  };
};

/** Live activity inventory from Viator (replaces the retired Amadeus path). */
export const useViatorActivities = () => {
  const [loading, setLoading] = useState(false);

  const searchActivities = async (params: { destination: string; currency?: string }) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke<{
        status: string;
        activities: ViatorActivity[];
      }>('viator-activities', { body: params });

      if (error) return { data: null, error: await readFunctionError(error) };
      return { data, error: null };
    } catch (err) {
      console.error('Viator activities search error:', err);
      return { data: null, error: await readFunctionError(err) };
    } finally {
      setLoading(false);
    }
  };

  return { searchActivities, loading };
};
