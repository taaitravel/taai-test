import { useQuery } from '@tanstack/react-query';
import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { supabase } from '@/integrations/supabase/client';

let stripePromise: Promise<Stripe | null> | null = null;

export function useStripePublishableKey() {
  return useQuery({
    queryKey: ['stripe-publishable-key'],
    staleTime: Infinity,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-stripe-config');
      if (error) throw error;
      const key = (data as { publishable_key?: string })?.publishable_key;
      if (!key) throw new Error('Stripe publishable key not configured');
      if (!stripePromise) stripePromise = loadStripe(key);
      return { key, stripePromise };
    },
  });
}