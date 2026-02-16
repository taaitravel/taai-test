import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { type BillingFrequency } from '@/lib/stripeConfig';
import { SubscriptionCard } from '@/components/subscription/SubscriptionCard';
import { individualTiers, corporateTiers } from '@/components/subscription/TierDefinitions';
import { MobileNavigation } from '@/components/shared/MobileNavigation';
import UsageDashboard from '@/components/subscription/UsageDashboard';

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
        toast({ title: "Redirecting to Stripe", description: "Opening secure checkout in a new tab..." });
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast({ title: "Error", description: "Failed to start checkout process. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const portalUrl = await openCustomerPortal();
      if (portalUrl) window.open(portalUrl, '_blank');
    } catch (error) {
      console.error('Error opening customer portal:', error);
    } finally {
      setLoading(false);
    }
  };

  const allTiers = [...individualTiers, ...corporateTiers];

  const isCurrentTier = (tierId: string) => subscriptionData?.subscription_tier === tierId;

  if (checkingSubscription) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading subscription information...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <MobileNavigation showBackButton={true} backPath="/home" backLabel="← Back" showTripButtons={false} />
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <Badge className="mb-6 bg-secondary text-foreground hover:bg-secondary/80 border-border" variant="secondary">
            Choose Your Plan
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4">Choose Your Travel Plan</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Unlock the full potential of your travel planning with our subscription tiers
          </p>

          {/* Large Billing Toggle */}
          <div className="mt-8 flex items-center justify-center gap-4">
            <div className="inline-flex rounded-full bg-secondary/60 p-1 border border-border">
              <button
                onClick={() => setBillingFrequency('monthly')}
                className={`px-8 py-3 rounded-full text-base font-semibold transition-all duration-200 ${
                  billingFrequency === 'monthly'
                    ? 'gold-gradient text-background shadow-md'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingFrequency('annual')}
                className={`px-8 py-3 rounded-full text-base font-semibold transition-all duration-200 ${
                  billingFrequency === 'annual'
                    ? 'gold-gradient text-background shadow-md'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Annual
              </button>
            </div>
            {billingFrequency === 'annual' && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                Save up to 19%
              </Badge>
            )}
          </div>

          {user && subscriptionData && (
            <div className="mt-6">
              <Badge variant="secondary" className="text-sm bg-secondary text-foreground border-border">
                Current Plan: {allTiers.find(t => t.id === subscriptionData.subscription_tier)?.name}
              </Badge>
              {subscriptionData.subscribed && (
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-4 transition-all duration-300"
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
          <TabsList className="grid w-full grid-cols-2 mb-8 bg-secondary/60 border-border">
            <TabsTrigger value="individual" className="data-[state=active]:gold-gradient data-[state=active]:text-background">Individual Plans</TabsTrigger>
            <TabsTrigger value="corporate" className="data-[state=active]:gold-gradient data-[state=active]:text-background">Corporate Plans</TabsTrigger>
          </TabsList>

          <TabsContent value="individual">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {individualTiers.map((tier) => (
                <SubscriptionCard key={tier.id} tier={tier} billingFrequency={billingFrequency} isCurrentTier={isCurrentTier(tier.id)} loading={loading} onSubscribe={handleSubscribe} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="corporate">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {corporateTiers.map((tier) => (
                <SubscriptionCard key={tier.id} tier={tier} billingFrequency={billingFrequency} isCurrentTier={isCurrentTier(tier.id)} loading={loading} onSubscribe={handleSubscribe} />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {user && subscriptionData && (
          <div className="mt-12 max-w-2xl mx-auto">
            <UsageDashboard userId={user.id} subscriptionData={subscriptionData} openCustomerPortal={openCustomerPortal} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Subscription;