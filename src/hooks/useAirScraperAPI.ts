import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface FlightSearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  adults?: number;
  children?: number;
  cabinClass?: string;
}

export const useAirScraperAPI = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const searchFlights = async (params: FlightSearchParams) => {
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Authentication required');
      }

      const { data, error: functionError } = await supabase.functions.invoke('air-scraper-api', {
        body: params,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (functionError) {
        throw functionError;
      }

      return { data, error: null };
    } catch (err: any) {
      console.error('AirScraper API error:', err);
      setError(err.message || 'Failed to search flights');
      return { data: null, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return { searchFlights, loading, error };
};
