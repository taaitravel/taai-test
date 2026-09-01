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

export const useAmadeusActivities = () => {
  const [loading, setLoading] = useState(false);

  const searchActivities = async (params: {
    latitude: number;
    longitude: number;
    radius?: number;
  }) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('amadeus-activities', {
        body: params,
      });

      if (error) return { data: null, error: await readFunctionError(error) };

      return { data, error: null };
    } catch (err) {
      console.error('Amadeus activities search error:', err);
      return { data: null, error: await readFunctionError(err) };
    } finally {
      setLoading(false);
    }
  };

  return { searchActivities, loading };
};
