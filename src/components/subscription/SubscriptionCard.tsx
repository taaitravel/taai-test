import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Mail } from 'lucide-react';
import { TierData, BillingFrequency, getAnnualSavings, getStripeCheckoutUrl } from '@/lib/stripeConfig';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

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
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubscribeClick = () => {
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

    // Use external Stripe checkout URL
    const checkoutUrl = getStripeCheckoutUrl(tier.id, billingFrequency);
    if (checkoutUrl) {
      window.open(checkoutUrl, '_blank');
      toast({
        title: "Redirecting to Stripe",
        description: "Opening secure checkout in a new tab...",
      });
    } else {
      onSubscribe(tier.id);
    }
  };

  const canUpgrade = !isCurrentTier;

  return (
    <Card 
      className={`relative p-6 bg-[#171821]/80 border-white/30 backdrop-blur-sm hover:shadow-2xl hover:shadow-white/20 transition-all duration-300 flex flex-col h-full ${
        isCurrentTier ? 'ring-2 ring-white shadow-lg shadow-white/30' : ''
      } ${tier.isPopular ? 'border-white/50' : ''}`}
    >
      {tier.isPopular && (
        <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 gold-gradient text-[#171821]">
          Most Popular
        </Badge>
      )}
      
      {isCurrentTier && (
        <Badge variant="secondary" className="absolute -top-3 right-4 bg-white/20 text-white border-white/30">
          Current Plan
        </Badge>
      )}

      <div className="text-center mb-6">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 gold-gradient rounded-full flex items-center justify-center shadow-lg">
            {tier.icon && React.cloneElement(tier.icon, { className: "h-8 w-8 text-[#171821]" })}
          </div>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">{tier.name}</h3>
        <p className="text-white/70 text-sm mb-4">{tier.description}</p>
        <div className="text-3xl font-bold text-white">
          {tier.priceText[billingFrequency] || tier.priceText.monthly}
        </div>
        {tier.annualPrice && billingFrequency === 'annual' && tier.id !== 'traveler' && tier.id !== 'taai_enterprise_plus' && (
          <div className="text-sm text-green-300 mt-1">
            Save {getAnnualSavings(tier.id)}% annually
          </div>
        )}
        {tier.taxNote && (
          <div className="text-sm text-white/60 mt-1">
            {tier.taxNote}
          </div>
        )}
      </div>

      <ul className="space-y-3 mb-6 flex-grow">
        {tier.features.map((feature, index) => (
          <li key={index} className="flex items-start text-sm">
            <Check className="h-4 w-4 text-white mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-white/70">{feature}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto">
        {tier.isInquiryOnly ? (
          <Button
            className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white transition-all duration-300"
            variant="default"
            onClick={handleSubscribeClick}
            disabled={loading}
          >
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Contact Us
            </div>
          </Button>
        ) : tier.isPaid ? (
          <Button
            className={`w-full ${
              tier.isPopular 
                ? 'gold-gradient hover:opacity-90 text-[#171821] font-semibold' 
                : 'bg-white text-[#171821] border-white hover:bg-gradient-to-r hover:from-[hsl(351,85%,75%)] hover:via-[hsl(15,80%,70%)] hover:to-[hsl(25,75%,65%)] hover:text-white'
            } transition-all duration-300`}
            variant={tier.isPopular ? "default" : "outline"}
            onClick={handleSubscribeClick}
            disabled={loading || isCurrentTier}
          >
            {loading ? 'Processing...' : isCurrentTier ? 'Current Plan' : canUpgrade ? 'Subscribe' : 'Change Plan'}
          </Button>
        ) : (
          <Button 
            variant="secondary" 
            disabled 
            className="w-full bg-white/10 text-white/70 border-white/20 cursor-not-allowed"
          >
            {isCurrentTier ? 'Current Plan' : 'Free Plan'}
          </Button>
        )}
      </div>
    </Card>
  );
};