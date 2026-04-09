import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface CheckoutItem {
  cart_item_id: string;
  type: string;
  name: string;
  price: number;
  provider: string;
  item_data: Record<string, unknown>;
  guest_details?: Record<string, unknown>;
  service_dates?: Record<string, unknown>;
}

interface CheckoutBreakdown {
  provider_total: number;
  service_fee: number;
  total: number;
}

export const useBookingCheckout = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [breakdown, setBreakdown] = useState<CheckoutBreakdown | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const trackIntent = async (
    eventType: string,
    provider: string,
    itemType: string,
    itemData: Record<string, unknown>,
    extras?: Record<string, unknown>
  ) => {
    if (!user) return;
    try {
      await supabase.functions.invoke('track-booking-event', {
        body: {
          event_type: eventType,
          provider,
          item_type: itemType,
          item_data: itemData,
          ...extras,
        },
      });
    } catch (e) {
      console.error('Failed to track intent:', e);
    }
  };

  const startCheckout = async (items: CheckoutItem[], itineraryId?: number) => {
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Please log in to proceed with booking.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-booking-checkout', {
        body: { items, itinerary_id: itineraryId },
      });

      if (error) throw error;

      if (data?.breakdown) {
        setBreakdown(data.breakdown);
      }

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast({
        title: 'Checkout Failed',
        description: error.message || 'Unable to start checkout. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const confirmBooking = async (sessionId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('booking-webhook', {
        body: { session_id: sessionId },
      });
      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Booking confirmation error:', error);
      throw error;
    }
  };

  return {
    isLoading,
    breakdown,
    trackIntent,
    startCheckout,
    confirmBooking,
  };
};
