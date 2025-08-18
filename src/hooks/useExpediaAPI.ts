import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface ExpediaAPIParams {
  endpoint: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  params?: Record<string, string>;
  body?: any;
}

interface ExpediaAPIResponse<T = any> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

export const useExpediaAPI = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const callExpediaAPI = async <T = any>({
    endpoint,
    method = 'GET',
    params = {},
    body = null
  }: ExpediaAPIParams): Promise<ExpediaAPIResponse<T>> => {
    setLoading(true);
    
    try {
      console.log('🏨 Calling Expedia API:', { endpoint, method, params });
      
      const { data, error } = await supabase.functions.invoke('expedia-rapid-api', {
        body: {
          endpoint,
          method,
          params,
          body
        }
      });

      if (error) {
        console.error('🏨 Expedia API error:', error);
        toast({
          title: "API Error",
          description: error.message || "Failed to call Expedia API",
          variant: "destructive",
        });
        return { data: null, error: error.message, loading: false };
      }

      console.log('🏨 Expedia API success:', data);
      return { data, error: null, loading: false };

    } catch (err: any) {
      console.error('🏨 Expedia API hook error:', err);
      const errorMessage = err.message || 'Failed to call Expedia API';
      toast({
        title: "API Error",
        description: errorMessage,
        variant: "destructive",
      });
      return { data: null, error: errorMessage, loading: false };
    } finally {
      setLoading(false);
    }
  };

  // Specific methods for common Expedia endpoints
  const searchHotels = async (params: {
    destination: string;
    checkin: string;
    checkout: string;
    adults?: number;
    children?: number;
    rooms?: number;
  }) => {
    return callExpediaAPI({
      endpoint: 'https://apidojo-booking-v1.p.rapidapi.com/properties/list',
      params: {
        dest_id: params.destination,
        checkin_date: params.checkin,
        checkout_date: params.checkout,
        adults_number: (params.adults || 2).toString(),
        children_number: (params.children || 0).toString(),
        room_number: (params.rooms || 1).toString(),
        units: 'metric',
        locale: 'en-us'
      }
    });
  };

  const searchFlights = async (params: {
    origin: string;
    destination: string;
    departure_date: string;
    return_date?: string;
    adults?: number;
    children?: number;
  }) => {
    // Note: This is a placeholder - actual flight search endpoints may vary
    return callExpediaAPI({
      endpoint: 'https://apidojo-booking-v1.p.rapidapi.com/flights/search',
      params: {
        from: params.origin,
        to: params.destination,
        departure: params.departure_date,
        return: params.return_date || '',
        adults: (params.adults || 1).toString(),
        children: (params.children || 0).toString()
      }
    });
  };

  const getDestinations = async (query: string) => {
    return callExpediaAPI({
      endpoint: 'https://apidojo-booking-v1.p.rapidapi.com/locations/search',
      params: {
        query,
        locale: 'en-us'
      }
    });
  };

  return {
    callExpediaAPI,
    searchHotels,
    searchFlights,
    getDestinations,
    loading
  };
};