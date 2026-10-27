import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DISPLAY_PLAN_PRICES } from '@/lib/plans/display-prices';

interface StripePricing {
  priceMapping: Record<string, any>;
  tierMapping: Record<string, any>;
  timestamp: string;
}

export const useStripePricing = () => {
  const [pricing, setPricing] = useState<StripePricing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPricing = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: functionError } = await supabase.functions.invoke('get-stripe-prices');
      
      if (functionError) {
        throw new Error(functionError.message);
      }
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setPricing(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch pricing';
      setError(errorMessage);
      console.error('Error fetching Stripe pricing:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPricing();
  }, []);

  // Helper function to get price for a specific tier and billing frequency
  const getPrice = (tier: string, billing: 'monthly' | 'annual'): number => {
    // Canonical prices — always use these as the source of truth
    return DISPLAY_PLAN_PRICES[tier as keyof typeof DISPLAY_PLAN_PRICES]?.[billing] || 0;
  };

  // Helper function to get price ID for a specific tier and billing frequency
  const getPriceId = (tier: string, billing: 'monthly' | 'annual'): string => {
    return pricing?.tierMapping[tier]?.prices[billing]?.priceId || '';
  };

  return {
    pricing,
    loading,
    error,
    refetch: fetchPricing,
    getPrice,
    getPriceId
  };
};