import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const SubscriptionSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const verifyPayment = async () => {
      if (!user || !sessionId) {
        setLoading(false);
        return;
      }

      try {
        // Check subscription status to get updated info
        const { data, error } = await supabase.functions.invoke('check-subscription', {
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
        });

        if (error) throw error;
        setSubscriptionData(data);

        toast({
          title: "Subscription Activated!",
          description: "Your subscription has been successfully activated.",
        });
      } catch (error) {
        console.error('Error verifying payment:', error);
        toast({
          title: "Error",
          description: "There was an issue verifying your payment. Please contact support.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [user, sessionId, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#171821] flex items-center justify-center">
        <div className="text-white">Verifying your subscription...</div>
      </div>
    );
  }

  const isPremiumTier = subscriptionData?.subscription_tier === 'taaiTraveler+' || 
                        subscriptionData?.subscription_tier === 'Corp. taaiTraveler+';

  return (
    <div className="min-h-screen bg-[#171821] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5"></div>
      <div className="relative max-w-lg w-full">
        {/* Conditional animated background gradient - only for premium tiers */}
        {isPremiumTier && (
          <div className="absolute inset-0 gold-gradient-flowing rounded-2xl opacity-20 blur-xl"></div>
        )}
        
        <Card className={`relative ${isPremiumTier ? 'luxury-gradient border-white/30 backdrop-blur-md shadow-2xl shadow-white/20' : 'bg-[#171821]/95 border-white/30 backdrop-blur-md shadow-2xl shadow-white/20'} p-8 text-center rounded-2xl`}>
          {/* Success Icon with conditional gradient animation */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              {isPremiumTier && (
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-lg animate-pulse"></div>
              )}
              <div className={`relative ${isPremiumTier ? 'gold-gradient' : 'gold-gradient'} p-4 rounded-full`}>
                <CheckCircle className={`h-12 w-12 ${isPremiumTier ? 'text-[#171821]' : 'text-[#171821]'}`} />
              </div>
            </div>
          </div>
          
          {/* Main Title */}
          <h1 className={`text-3xl font-bold mb-3 ${isPremiumTier ? 'luxury-text-gradient' : 'text-white'}`}>
            {isPremiumTier ? 'Welcome to Premium!' : 'Subscription Activated!'}
          </h1>
          
          <h2 className={`text-xl mb-6 font-medium ${isPremiumTier ? 'text-primary' : 'text-white/70'}`}>
            {isPremiumTier ? 'Your premium subscription is now active' : 'Your subscription is now active'}
          </h2>
          
          <p className={`mb-8 leading-relaxed ${isPremiumTier ? 'text-white/90' : 'text-white/70'}`}>
            Thank you for {isPremiumTier ? 'joining our premium community' : 'subscribing'}! Your payment has been processed successfully{isPremiumTier ? ' and you now have access to all premium features' : ''}.
          </p>

          {subscriptionData && (
            <div className="relative mb-8">
              {isPremiumTier && (
                <div className="absolute inset-0 bg-primary/5 rounded-xl blur-sm"></div>
              )}
              <div className={`relative ${isPremiumTier ? 'bg-white/5 backdrop-blur-sm border-primary/10' : 'bg-[#1f1f27] border-white/30'} p-6 rounded-xl border`}>
                <h3 className={`text-lg font-semibold mb-4 ${isPremiumTier ? 'text-primary' : 'text-white'}`}>Your Plan Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className={`text-center p-3 rounded-lg ${isPremiumTier ? 'bg-primary/5' : 'bg-[#171821]'}`}>
                    <div className={`text-xs uppercase tracking-wider mb-1 ${isPremiumTier ? 'text-white/60' : 'text-white/50'}`}>Plan</div>
                    <div className={`font-semibold text-base ${isPremiumTier ? 'text-primary' : 'text-white'}`}>
                      {subscriptionData.subscription_tier}
                    </div>
                  </div>
                  <div className={`text-center p-3 rounded-lg ${isPremiumTier ? 'bg-primary/5' : 'bg-[#171821]'}`}>
                    <div className={`text-xs uppercase tracking-wider mb-1 ${isPremiumTier ? 'text-white/60' : 'text-white/50'}`}>Credits</div>
                    <div className={`font-semibold text-base ${isPremiumTier ? 'text-primary' : 'text-white'}`}>
                      {subscriptionData.credits_remaining}
                    </div>
                  </div>
                  <div className={`text-center p-3 rounded-lg ${isPremiumTier ? 'bg-primary/5' : 'bg-[#171821]'}`}>
                    <div className={`text-xs uppercase tracking-wider mb-1 ${isPremiumTier ? 'text-white/60' : 'text-white/50'}`}>Itineraries</div>
                    <div className={`font-semibold text-base ${isPremiumTier ? 'text-primary' : 'text-white'}`}>
                      {subscriptionData.max_itineraries === -1 ? '∞' : subscriptionData.max_itineraries}
                    </div>
                  </div>
                  <div className={`text-center p-3 rounded-lg ${isPremiumTier ? 'bg-primary/5' : 'bg-[#171821]'}`}>
                    <div className={`text-xs uppercase tracking-wider mb-1 ${isPremiumTier ? 'text-white/60' : 'text-white/50'}`}>Sharing</div>
                    <div className={`font-semibold text-base ${isPremiumTier ? 'text-primary' : 'text-white'}`}>
                      {subscriptionData.max_shared_friends === -1 ? '∞' : subscriptionData.max_shared_friends}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <Button 
              className={`w-full py-3 text-base font-medium transition-all duration-300 ${
                isPremiumTier 
                  ? 'gold-gradient hover:opacity-90 text-[#171821] font-semibold shadow-lg hover:shadow-xl' 
                  : 'gold-gradient hover:opacity-90 text-[#171821] font-semibold'
              }`}
              onClick={() => navigate('/dashboard')}
            >
              {isPremiumTier ? 'Start Planning Your Next Adventure' : 'Go to Dashboard'}
            </Button>
            
            <Button 
              variant="outline" 
              className={`w-full py-3 text-base ${
                isPremiumTier 
                  ? 'border-white/30 text-white hover:bg-white/10' 
                  : 'border-white/30 text-white hover:bg-white/10'
              }`}
              onClick={() => navigate('/subscription')}
            >
              {isPremiumTier ? 'Manage Subscription' : 'View Subscription Details'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SubscriptionSuccess;