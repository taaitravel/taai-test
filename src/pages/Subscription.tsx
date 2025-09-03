import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, Star, Users, Building, Crown, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface SubscriptionData {
  subscribed: boolean;
  subscription_tier: string;
  subscription_end: string | null;
  credits_remaining: number;
  max_itineraries: number;
  max_shared_friends: number;
}

interface TierData {
  id: string;
  name: string;
  price: number;
  priceText: string;
  taxNote?: string;
  description: string;
  icon: React.ReactElement;
  features: string[];
  isPaid: boolean;
  isPopular: boolean;
}

const Subscription = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { subscriptionData, loading: checkingSubscription, createCheckout, openCustomerPortal } = useSubscription();
  const [loading, setLoading] = useState(false);

  const individualTiers = [
    {
      id: 'traveler',
      name: 'Traveler',
      price: 0,
      priceText: 'Free',
      description: 'Perfect for casual travelers',
      icon: <Users className="h-6 w-6" />,
      features: [
        '5 credits for AI/API calls',
        'Up to 3 itineraries',
        'Share with up to 10 friends',
        'Basic support'
      ],
      isPaid: false,
      isPopular: false
    },
    {
      id: 'taai_traveler',
      name: 'taaiTraveler',
      price: 7.99,
      priceText: '$7.99/mo',
      taxNote: '+ applicable taxes',
      description: 'For regular travelers',
      icon: <Star className="h-6 w-6" />,
      features: [
        '50 credits per month',
        'Up to 25 itineraries',
        'Share with up to 20 friends',
        'Priority support',
        'Advanced trip planning'
      ],
      isPaid: true,
      isPopular: true
    },
    {
      id: 'taai_traveler_plus',
      name: 'taaiTraveler+',
      price: 19.99,
      priceText: '$19.99/mo',
      taxNote: '+ applicable taxes',
      description: 'For travel enthusiasts',
      icon: <Crown className="h-6 w-6" />,
      features: [
        '100 credits per month',
        'Up to 50 itineraries',
        'Unlimited friend sharing',
        'Premium support',
        'Advanced analytics',
        'Custom itinerary templates'
      ],
      isPaid: true,
      isPopular: false
    }
  ];

  const corporateTiers = [
    {
      id: 'corp_taai_traveler_plus',
      name: 'Corp. taaiTraveler+',
      price: 49.99,
      priceText: '$49.99/mo',
      taxNote: '+ applicable taxes',
      description: 'For business teams',
      icon: <Building className="h-6 w-6" />,
      features: [
        '200 credits per month',
        'Up to 100 itineraries',
        'Share with up to 50 team members',
        'Business support',
        'Team management tools',
        'Expense tracking'
      ],
      isPaid: true,
      isPopular: true
    },
    {
      id: 'taai_enterprise_plus',
      name: 'taaiEnterprise+',
      price: null,
      priceText: 'Contact Us',
      taxNote: 'Custom pricing available',
      description: 'For large enterprises',
      icon: <Crown className="h-6 w-6" />,
      features: [
        'Unlimited credits per month',
        'Unlimited itineraries',
        'Unlimited team sharing',
        'Enterprise support',
        'Custom integrations',
        'Advanced reporting',
        'Dedicated account manager',
        'SLA guarantees'
      ],
      isPaid: false,
      isPopular: false,
      isInquiryOnly: true
    }
  ];


  const handleSubscribe = async (tierId: string) => {
    if (tierId === 'traveler') return; // Free tier, no checkout needed
    
    // Handle enterprise inquiry
    if (tierId === 'taai_enterprise_plus') {
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

    setLoading(true);
    try {
      const checkoutUrl = await createCheckout(tierId);
      if (checkoutUrl) {
        // Open Stripe checkout in a new tab for better transactionality
        console.log('Opening Stripe checkout in new tab:', checkoutUrl);
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

  const canUpgrade = (tierId: string) => {
    if (!subscriptionData) return true;
    
    const tierOrder = ['traveler', 'taai_traveler', 'taai_traveler_plus', 'corp_taai_traveler_plus', 'taai_enterprise_plus'];
    const currentIndex = tierOrder.indexOf(subscriptionData.subscription_tier);
    const targetIndex = tierOrder.indexOf(tierId);
    
    return targetIndex !== currentIndex;
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
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <Badge className="mb-6 bg-white/20 text-white hover:bg-white/30 border-white/30" variant="secondary">
            Choose Your Plan
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">Choose Your Travel Plan</h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            Unlock the full potential of your travel planning with our subscription tiers
          </p>
          
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
                <Card 
                  key={tier.id} 
                  className={`relative p-6 bg-[#171821]/80 border-white/30 backdrop-blur-sm hover:shadow-2xl hover:shadow-white/20 transition-all duration-300 flex flex-col h-full ${isCurrentTier(tier.id) ? 'ring-2 ring-white shadow-lg shadow-white/30' : ''} ${tier.isPopular ? 'border-white/50' : ''}`}
                >
                  {tier.isPopular && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 gold-gradient text-[#171821]">
                      Most Popular
                    </Badge>
                  )}
                  
                  {isCurrentTier(tier.id) && (
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
                      {tier.priceText}
                    </div>
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
                  <Button
                    className={`w-full ${tier.isPopular ? 'gold-gradient hover:opacity-90 text-[#171821] font-semibold' : 'bg-white text-[#171821] border-white hover:bg-gradient-to-r hover:from-[hsl(351,85%,75%)] hover:via-[hsl(15,80%,70%)] hover:to-[hsl(25,75%,65%)] hover:text-white'} transition-all duration-300`}
                    variant={isCurrentTier(tier.id) ? "secondary" : "default"}
                    onClick={() => handleSubscribe(tier.id)}
                    disabled={loading || isCurrentTier(tier.id)}
                  >
                    {loading ? 'Processing...' : 
                     isCurrentTier(tier.id) ? 'Current Plan' :
                     !tier.isPaid ? 'Free Plan' :
                     `Subscribe to ${tier.name}`
                    }
                  </Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="corporate">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {corporateTiers.map((tier) => (
                <Card 
                  key={tier.id} 
                  className={`relative p-6 bg-[#171821]/80 border-white/30 backdrop-blur-sm hover:shadow-2xl hover:shadow-white/20 transition-all duration-300 flex flex-col h-full ${isCurrentTier(tier.id) ? 'ring-2 ring-white shadow-lg shadow-white/30' : ''} ${tier.isPopular ? 'border-white/50' : ''}`}
                >
                  {tier.isPopular && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 gold-gradient text-[#171821]">
                      Most Popular
                    </Badge>
                  )}
                  
                  {isCurrentTier(tier.id) && (
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
                      {tier.priceText}
                    </div>
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
                  <Button
                    className={`w-full ${
                      tier.isInquiryOnly ? 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white' :
                      tier.isPopular ? 'gold-gradient hover:opacity-90 text-[#171821] font-semibold' : 
                      'bg-white text-[#171821] border-white hover:bg-gradient-to-r hover:from-[hsl(351,85%,75%)] hover:via-[hsl(15,80%,70%)] hover:to-[hsl(25,75%,65%)] hover:text-white'
                    } transition-all duration-300`}
                    variant={isCurrentTier(tier.id) ? "secondary" : "default"}
                    onClick={() => handleSubscribe(tier.id)}
                    disabled={loading || isCurrentTier(tier.id)}
                  >
                    {tier.isInquiryOnly ? (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Contact Us
                      </div>
                    ) : (
                      loading ? 'Processing...' : 
                      isCurrentTier(tier.id) ? 'Current Plan' :
                      `Subscribe to ${tier.name}`
                    )}
                  </Button>
                  </div>
                </Card>
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