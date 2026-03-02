import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Mail } from 'lucide-react';
import { TierData, BillingFrequency, getAnnualSavings, getStripeCheckoutUrl } from '@/lib/stripeConfig';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useStripePricing } from '@/hooks/useStripePricing';
interface SubscriptionCardProps {
  tier: TierData;
  billingFrequency: BillingFrequency;
  isCurrentTier: boolean;
  loading: boolean;
  onSubscribe: (tierId: string) => void;
}
export const SubscriptionCard: React.FC<SubscriptionCardProps> = ({
  tier,
  billingFrequency,
  isCurrentTier,
  loading,
  onSubscribe
}) => {
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  const { getPrice } = useStripePricing();

  // Get dynamic prices from Stripe
  const currentMonthlyPrice = getPrice(tier.id, 'monthly');
  const currentAnnualPrice = getPrice(tier.id, 'annual');

  // Calculate savings with dynamic pricing
  const dynamicSavings = getAnnualSavings(tier.id, currentMonthlyPrice, currentAnnualPrice);

  const handleSubscribeClick = async () => {
    if (tier.id === 'traveler') return; // Free tier

    // Handle enterprise inquiry
    if (tier.isInquiryOnly) {
      navigate('/contact', {
        state: {
          prefilledData: {
            subject: 'taaiEnterprise+ Account Inquiry',
            message: 'I am interested in learning more about the taaiEnterprise+ account for my organization. Please provide more details about pricing and features.'
          }
        }
      });
      return;
    }

    // Call the edge function instead of using external URLs
    onSubscribe(tier.id);
  };
  
  const canUpgrade = !isCurrentTier;
  return <Card className={`relative p-6 bg-card/80 border-border backdrop-blur-sm hover:shadow-2xl transition-all duration-300 flex flex-col h-full ${isCurrentTier ? 'ring-2 ring-primary shadow-lg shadow-primary/30' : ''} ${tier.isPopular ? 'border-primary/50' : ''}`}>
      {tier.isPopular && <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 gold-gradient text-primary-foreground">
          Most Popular
        </Badge>}
      
      {isCurrentTier && <Badge variant="secondary" className="absolute -top-3 right-4 bg-secondary text-secondary-foreground border-border mx-0 my-[25px]">
          Current Plan
        </Badge>}

      <div className="text-center mb-6">
        <div className="flex justify-center mb-4">
           <div className="w-16 h-16 gold-gradient rounded-full flex items-center justify-center shadow-lg">
            {tier.icon && React.cloneElement(tier.icon, {
            className: "h-8 w-8 text-primary-foreground"
          })}
          </div>
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">{tier.name}</h3>
        <p className="text-muted-foreground text-sm mb-4">{tier.description}</p>
        <div className="text-3xl font-bold text-foreground">
          {billingFrequency === 'monthly' ? `$${currentMonthlyPrice.toFixed(2)}/mo` : `$${currentAnnualPrice.toFixed(2)}/yr`}
        </div>
        {tier.annualPrice && billingFrequency === 'annual' && tier.id !== 'traveler' && tier.id !== 'taai_enterprise_plus' && <div className="text-sm text-green-300 mt-1">
            Save {dynamicSavings}% annually
          </div>}
        {tier.taxNote && <div className="text-sm text-muted-foreground/60 mt-1">
            {tier.taxNote}
          </div>}
      </div>

      <ul className="space-y-3 mb-6 flex-grow">
        {tier.features.map((feature, index) => <li key={index} className="flex items-start text-sm">
            <Check className="h-4 w-4 text-foreground mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-muted-foreground">{feature}</span>
          </li>)}
      </ul>

      <div className="mt-auto">
        {tier.isInquiryOnly ? <Button className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-foreground transition-all duration-300" variant="default" onClick={handleSubscribeClick} disabled={loading}>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Contact Us
            </div>
          </Button> : tier.isPaid ? <Button className={`w-full ${tier.isPopular ? 'gold-gradient hover:opacity-90 text-primary-foreground font-semibold' : 'bg-foreground text-background border-foreground hover:bg-gradient-to-r hover:from-[hsl(351,85%,75%)] hover:via-[hsl(15,80%,70%)] hover:to-[hsl(25,75%,65%)] hover:text-foreground'} transition-all duration-300`} variant={tier.isPopular ? "default" : "outline"} onClick={handleSubscribeClick} disabled={loading || isCurrentTier}>
            {loading ? 'Processing...' : isCurrentTier ? 'Current Plan' : canUpgrade ? 'Subscribe' : 'Change Plan'}
          </Button> : <Button variant="secondary" disabled className="w-full bg-secondary text-muted-foreground border-border cursor-not-allowed">
            {isCurrentTier ? 'Current Plan' : 'Free Plan'}
          </Button>}
      </div>
    </Card>;
};