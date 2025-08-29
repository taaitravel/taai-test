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
      <Card className="max-w-md w-full p-8 text-center">
        <div className="flex justify-center mb-6">
          <CheckCircle className="h-16 w-16 text-green-500" />
        </div>
        
        <h1 className="text-2xl font-bold text-foreground mb-4">
          Subscription Activated!
        </h1>
        
        <p className="text-muted-foreground mb-6">
          Thank you for subscribing! Your payment has been processed successfully.
        </p>

        {subscriptionData && (
          <div className="bg-muted p-4 rounded-lg mb-6">
            <h3 className="font-semibold text-foreground mb-2">Your Plan Details:</h3>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Plan: {subscriptionData.subscription_tier}</p>
              <p>Credits: {subscriptionData.credits_remaining}</p>
              <p>Max Itineraries: {subscriptionData.max_itineraries === -1 ? 'Unlimited' : subscriptionData.max_itineraries}</p>
              <p>Sharing Limit: {subscriptionData.max_shared_friends === -1 ? 'Unlimited' : subscriptionData.max_shared_friends}</p>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <Button 
            className="w-full" 
            onClick={() => navigate('/dashboard')}
          >
            Go to Dashboard
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => navigate('/subscription')}
          >
            View Subscription Details
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default SubscriptionSuccess;