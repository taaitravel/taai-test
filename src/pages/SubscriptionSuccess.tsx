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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Verifying your subscription...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="relative max-w-lg w-full">
        {/* Animated background gradient */}
        <div className="absolute inset-0 gold-gradient-flowing rounded-2xl opacity-20 blur-xl"></div>
        
        <Card className="relative luxury-gradient border border-primary/20 backdrop-blur-sm shadow-2xl p-8 text-center rounded-2xl">
          {/* Success Icon with gradient animation */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-lg animate-pulse"></div>
              <div className="relative gold-gradient p-4 rounded-full">
                <CheckCircle className="h-12 w-12 text-card" />
              </div>
            </div>
          </div>
          
          {/* Main Title */}
          <h1 className="text-3xl font-bold luxury-text-gradient mb-3">
            Welcome to Premium!
          </h1>
          
          <h2 className="text-xl text-primary mb-6 font-medium">
            Your subscription is now active
          </h2>
          
          <p className="text-foreground/80 mb-8 leading-relaxed">
            Thank you for joining our premium community. Your payment has been processed successfully and you now have access to all premium features.
          </p>

          {subscriptionData && (
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-primary/5 rounded-xl blur-sm"></div>
              <div className="relative bg-card/50 backdrop-blur-sm p-6 rounded-xl border border-primary/10">
                <h3 className="text-lg font-semibold text-primary mb-4">Your Plan Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center p-3 bg-primary/5 rounded-lg">
                    <div className="text-xs text-foreground/60 uppercase tracking-wider mb-1">Plan</div>
                    <div className="font-semibold text-primary text-base">
                      {subscriptionData.subscription_tier}
                    </div>
                  </div>
                  <div className="text-center p-3 bg-primary/5 rounded-lg">
                    <div className="text-xs text-foreground/60 uppercase tracking-wider mb-1">Credits</div>
                    <div className="font-semibold text-primary text-base">
                      {subscriptionData.credits_remaining}
                    </div>
                  </div>
                  <div className="text-center p-3 bg-primary/5 rounded-lg">
                    <div className="text-xs text-foreground/60 uppercase tracking-wider mb-1">Itineraries</div>
                    <div className="font-semibold text-primary text-base">
                      {subscriptionData.max_itineraries === -1 ? '∞' : subscriptionData.max_itineraries}
                    </div>
                  </div>
                  <div className="text-center p-3 bg-primary/5 rounded-lg">
                    <div className="text-xs text-foreground/60 uppercase tracking-wider mb-1">Sharing</div>
                    <div className="font-semibold text-primary text-base">
                      {subscriptionData.max_shared_friends === -1 ? '∞' : subscriptionData.max_shared_friends}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <Button 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 text-base font-medium shadow-lg hover:shadow-xl transition-all duration-300" 
              onClick={() => navigate('/dashboard')}
            >
              Start Planning Your Next Adventure
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full border-primary/30 text-primary hover:bg-primary/10 py-3 text-base"
              onClick={() => navigate('/subscription')}
            >
              Manage Subscription
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SubscriptionSuccess;