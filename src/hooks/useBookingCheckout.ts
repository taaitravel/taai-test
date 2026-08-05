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

export interface ValidationItem {
  cart_item_id: string;
  type: string;
  name: string;
  provider: string;
  external_id: string | null;
  old_price: number;
  new_price: number;
  status: 'available' | 'price_changed' | 'sold_out' | 'expired_date' | 'needs_review';
  reason?: string;
  service_dates: Record<string, unknown> | null;
  occupancy: Record<string, unknown> | null;
  pricing: Record<string, unknown> | null;
  booking_context: Record<string, unknown> | null;
  selected_product: Record<string, unknown> | null;
  policies: Record<string, unknown> | null;
  provider_quote: Record<string, unknown> | null;
  earnings: Record<string, unknown> | null;
}

export interface ValidationResult {
  quote_id: string;
  expires_at: string;
  items: ValidationItem[];
  diffs: Array<{ cart_item_id: string; status: string; reason?: string; old_price: number; new_price: number }>;
  breakdown: { provider_total: number; taxes_and_fees: number; total: number; subscription_tier: string };
  all_available: boolean;
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

  const validateCart = async (
    cartItemIds: string[],
    itineraryId?: number
  ): Promise<ValidationResult | null> => {
    if (!user) {
      toast({ title: 'Login required', variant: 'destructive' });
      return null;
    }
    try {
      const { data, error } = await supabase.functions.invoke('pre-checkout-validate', {
        body: { cart_item_ids: cartItemIds, itinerary_id: itineraryId },
      });
      if (error) throw error;
      return data as ValidationResult;
    } catch (e: any) {
      toast({
        title: 'Could not verify availability',
        description: e.message || 'Please try again.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const startCheckout = async (
    items: CheckoutItem[] | { quote_id: string },
    itineraryId?: number
  ) => {
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
      const body: Record<string, unknown> =
        'quote_id' in items
          ? { quote_id: items.quote_id, itinerary_id: itineraryId }
          : { items, itinerary_id: itineraryId };

      const { data, error } = await supabase.functions.invoke('create-booking-checkout', {
        body,
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
    validateCart,
    startCheckout,
    confirmBooking,
  };
};
