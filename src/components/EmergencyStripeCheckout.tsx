import React from 'react';
import { Button } from '@/components/ui/button';
import { ExternalLink, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EmergencyStripeCheckoutProps {
  tier: string;
  tierName: string;
  monthlyPrice: number;
  annualPrice?: number;
  billingFrequency: 'monthly' | 'annual';
  loading?: boolean;
  className?: string;
}

export const EmergencyStripeCheckout: React.FC<EmergencyStripeCheckoutProps> = ({
  tier,
  tierName,
  monthlyPrice,
  annualPrice,
  billingFrequency,
  loading = false,
  className = ""
}) => {
  const { toast } = useToast();

  const handleEmergencyCheckout = () => {
    // Skip free tier
    if (tier === 'traveler') {
      toast({
        title: "Free Plan",
        description: "This is a free plan - no payment required!",
      });
      return;
    }

    // Since Stripe functions are having issues, open generic Stripe pricing page
    // You'll need to replace this with your actual Stripe-hosted pricing page URL
    const stripeHostedPricingUrl = "https://billing.stripe.com/p/login/test_9AQ28w8Iy8Yr5ZSeUU"; // Replace with your actual hosted pricing page
    
    // Alternatively, for immediate testing, you can create Payment Links in your Stripe Dashboard:
    // 1. Go to Stripe Dashboard > Payment Links
    // 2. Create a payment link for each product
    // 3. Replace the URL above with your payment link
    
    window.open(stripeHostedPricingUrl, '_blank');
    
    toast({
      title: "Opening Stripe Checkout",
      description: "Redirecting to secure payment page...",
    });
  };

  const getPrice = () => {
    if (billingFrequency === 'annual' && annualPrice) {
      return `$${annualPrice}/year`;
    }
    return `$${monthlyPrice}/month`;
  };

  return (
    <Button
      className={`${className} flex items-center gap-2`}
      onClick={handleEmergencyCheckout}
      disabled={loading}
    >
      <CreditCard className="h-4 w-4" />
      {loading ? 'Processing...' : `Pay ${getPrice()} - ${tierName}`}
      <ExternalLink className="h-4 w-4" />
    </Button>
  );
};