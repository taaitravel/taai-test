import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface FlightSearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults?: number;
  children?: number;
  cabinClass?: string;
}

export const useAmadeusFlights = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchFlights = async (params: FlightSearchParams) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('amadeus-flights', {
        body: params,
      });

      if (functionError) {
        throw functionError;
      }

      return { data, error: null };
    } catch (err: any) {
      console.error('Amadeus flights error:', err);
      const errorMessage = err.message || 'Failed to search flights';
      setError(errorMessage);
      return { data: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return { searchFlights, loading, error };
};
