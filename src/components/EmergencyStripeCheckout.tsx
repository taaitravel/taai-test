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
    // Create a direct link to your Stripe customer portal or payment link
    // Replace with your actual Stripe payment links
    const stripePaymentLinks: { [key: string]: { [key: string]: string } } = {
      taai_traveler: {
        monthly: "https://buy.stripe.com/test_28o6qu7Bz1i4aBy9AA", // Replace with actual link
        annual: "https://buy.stripe.com/test_bIY9iy8FD5ygeCK000"   // Replace with actual link
      },
      taai_traveler_plus: {
        monthly: "https://buy.stripe.com/test_14k9iy8FD6Ck0g8cMN", // Replace with actual link
        annual: "https://buy.stripe.com/test_aEU8yu6xrbYE8lu8wz"   // Replace with actual link
      },
      corp_taai_traveler_plus: {
        monthly: "https://buy.stripe.com/test_28o3eu5tp2m8fSY9AD", // Replace with actual link
        annual: "https://buy.stripe.com/test_7sI4gy9JH3q8cJGdQT"   // Replace with actual link
      }
    };

    const tierLinks = stripePaymentLinks[tier];
    if (!tierLinks) {
      toast({
        title: "Contact Required",
        description: "Please contact us directly for this subscription tier.",
        variant: "destructive"
      });
      return;
    }

    const paymentLink = tierLinks[billingFrequency];
    if (!paymentLink) {
      toast({
        title: "Billing Option Unavailable",
        description: "This billing frequency is not available. Please try monthly billing.",
        variant: "destructive"
      });
      return;
    }

    // Open Stripe payment link in new tab
    window.open(paymentLink, '_blank');
    
    toast({
      title: "Redirecting to Stripe",
      description: "Opening secure checkout in a new tab...",
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