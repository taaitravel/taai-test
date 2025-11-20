import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export const useAmadeusActivities = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

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

      if (error) throw error;

      return { data, error: null };
    } catch (err: any) {
      console.error('Amadeus activities search error:', err);
      toast({
        title: 'Search Failed',
        description: err.message || 'Failed to search activities',
        variant: 'destructive',
      });
      return { data: null, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return { searchActivities, loading };
};
