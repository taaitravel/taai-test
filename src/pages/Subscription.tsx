import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleLeft, ToggleRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { type BillingFrequency } from '@/lib/stripeConfig';
import { SubscriptionCard } from '@/components/subscription/SubscriptionCard';
import { individualTiers, corporateTiers } from '@/components/subscription/TierDefinitions';
import { MobileNavigation } from '@/components/shared/MobileNavigation';

interface SubscriptionData {
  subscribed: boolean;
  subscription_tier: string;
  subscription_end: string | null;
  credits_remaining: number;
  max_itineraries: number;
  max_shared_friends: number;
}

const Subscription = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { subscriptionData, loading: checkingSubscription, createCheckout, openCustomerPortal } = useSubscription();
  const [loading, setLoading] = useState(false);
  const [billingFrequency, setBillingFrequency] = useState<BillingFrequency>('monthly');


  const handleSubscribe = async (tierId: string) => {
    setLoading(true);
    try {
      const checkoutUrl = await createCheckout(tierId, billingFrequency);
      if (checkoutUrl) {
        window.open(checkoutUrl, '_blank');
        toast({
          title: "Redirecting to Stripe",
          description: "Opening secure checkout in a new tab...",
        });
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast({
        title: "Error",
        description: "Failed to start checkout process. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const portalUrl = await openCustomerPortal();
      if (portalUrl) {
        // Open customer portal in a new tab
        window.open(portalUrl, '_blank');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
    } finally {
      setLoading(false);
    }
  };

  const allTiers = [...individualTiers, ...corporateTiers];

  const isCurrentTier = (tierId: string) => {
    return subscriptionData?.subscription_tier === tierId;
  };

  if (checkingSubscription) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading subscription information...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#171821]">
      <MobileNavigation 
        showBackButton={true}
        backPath="/home"
        backLabel="← Back"
        showTripButtons={false}
      />
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <Badge className="mb-6 bg-white/20 text-white hover:bg-white/30 border-white/30" variant="secondary">
            Choose Your Plan
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">Choose Your Travel Plan</h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            Unlock the full potential of your travel planning with our subscription tiers
          </p>
          
          {/* Billing Frequency Toggle */}
          <div className="mt-8 flex items-center justify-center gap-4">
            <span className={`text-sm ${billingFrequency === 'monthly' ? 'text-white' : 'text-white/60'}`}>
              Monthly
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setBillingFrequency(billingFrequency === 'monthly' ? 'annual' : 'monthly')}
              className="p-1 h-auto bg-transparent hover:bg-transparent"
            >
              {billingFrequency === 'monthly' ? (
                <ToggleLeft className="h-8 w-8 text-white/60 hover:text-white transition-colors" />
              ) : (
                <ToggleRight className="h-8 w-8 text-white hover:text-white/80 transition-colors" />
              )}
            </Button>
            <span className={`text-sm ${billingFrequency === 'annual' ? 'text-white' : 'text-white/60'}`}>
              Annual
            </span>
            {billingFrequency === 'annual' && (
              <Badge className="ml-2 bg-green-500/20 text-green-300 border-green-500/30">
                Save up to 17%
              </Badge>
            )}
          </div>
          
          {user && subscriptionData && (
            <div className="mt-6">
              <Badge variant="secondary" className="text-sm bg-white/20 text-white border-white/30">
                Current Plan: {allTiers.find(t => t.id === subscriptionData.subscription_tier)?.name}
              </Badge>
              {subscriptionData.subscribed && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="ml-4 bg-white text-[#171821] border-white hover:bg-gradient-to-r hover:from-[hsl(351,85%,75%)] hover:via-[hsl(15,80%,70%)] hover:to-[hsl(25,75%,65%)] hover:text-white active:bg-gradient-to-r active:from-[hsl(351,85%,75%)] active:via-[hsl(15,80%,70%)] active:to-[hsl(25,75%,65%)] active:text-white transition-all duration-300"
                  onClick={handleManageSubscription}
                  disabled={loading}
                >
                  Manage Subscription
                </Button>
              )}
            </div>
          )}
        </div>

        <Tabs defaultValue="individual" className="max-w-7xl mx-auto">
          <TabsList className="grid w-full grid-cols-2 mb-8 bg-[#171821]/60 border-white/20">
            <TabsTrigger value="individual" className="text-white data-[state=active]:bg-white/20 data-[state=active]:text-white">Individual Plans</TabsTrigger>
            <TabsTrigger value="corporate" className="text-white data-[state=active]:bg-white/20 data-[state=active]:text-white">Corporate Plans</TabsTrigger>
          </TabsList>
          
          <TabsContent value="individual">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {individualTiers.map((tier) => (
                <SubscriptionCard
                  key={tier.id}
                  tier={tier}
                  billingFrequency={billingFrequency}
                  isCurrentTier={isCurrentTier(tier.id)}
                  loading={loading}
                  onSubscribe={handleSubscribe}
                />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="corporate">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {corporateTiers.map((tier) => (
                <SubscriptionCard
                  key={tier.id}
                  tier={tier}
                  billingFrequency={billingFrequency}
                  isCurrentTier={isCurrentTier(tier.id)}
                  loading={loading}
                  onSubscribe={handleSubscribe}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {user && subscriptionData && (
          <div className="mt-12 max-w-2xl mx-auto">
            <Card className="p-6 bg-[#171821]/60 border-white/30">
              <h3 className="text-xl font-bold text-white mb-4">Your Current Usage</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-white">{subscriptionData.credits_remaining}</div>
                  <div className="text-sm text-white/70">Credits Remaining</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">
                    {subscriptionData.max_itineraries === -1 ? '∞' : subscriptionData.max_itineraries}
                  </div>
                  <div className="text-sm text-white/70">Max Itineraries</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">
                    {subscriptionData.max_shared_friends === -1 ? '∞' : subscriptionData.max_shared_friends}
                  </div>
                  <div className="text-sm text-white/70">Sharing Limit</div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Subscription;