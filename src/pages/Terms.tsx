import { useState } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, FileText, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { LOGO_URL } from "@/lib/constants";
import { PublicFooter } from "@/components/shared/PublicFooter";
import { useBrightTheme } from '@/hooks/useBrightTheme';

const Terms = () => {
  useBrightTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user, updateUserProfile, loading: authLoading } = useAuth();
  
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const isSignupFlow = location.state?.fromSignup || searchParams.get('fromSignup') === 'true';
  const isLoginRequired = location.state?.requireAcceptance;

  const handleAcceptance = async () => {
    if (!termsAccepted || !privacyAccepted) {
      toast({
        title: "Acceptance Required",
        description: "Please accept both the Terms of Service and Privacy Policy to continue.",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please verify your email and log in first.",
        variant: "destructive"
      });
      navigate('/login');
      return;
    }

    setLoading(true);

    try {
      const now = new Date().toISOString();
      const { error } = await updateUserProfile({
        terms_accepted_at: now,
        privacy_accepted_at: now,
        terms_version: '2026-10-22'
      });

      if (error) {
        console.error('Error saving terms acceptance:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to save your acceptance. Please try again.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Terms Accepted",
        description: "Thank you for accepting our terms and privacy policy.",
        variant: "success"
      });

      if (isSignupFlow) {
        navigate('/profile-setup');
      } else {
        navigate('/home');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading && (isSignupFlow || isLoginRequired)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5"></div>
        <Card className="w-full max-w-md shadow-2xl shadow-primary/10 border-border bg-card/95 backdrop-blur-md">
          <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-8 w-8 text-foreground animate-spin" />
            <p className="text-muted-foreground">Verifying your account...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if ((isSignupFlow || isLoginRequired) && !user && !authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5"></div>
        <Card className="w-full max-w-md shadow-2xl shadow-primary/10 border-border bg-card/95 backdrop-blur-md">
          <CardHeader className="text-center space-y-4">
            <div className="flex items-center justify-center">
              <img src={LOGO_URL} alt="TAAI Travel" className="h-[120px] w-auto" />
            </div>
            <CardTitle className="text-xl text-foreground">Session Expired</CardTitle>
            <CardDescription className="text-muted-foreground">
              Please log in to accept the terms and continue.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              className="w-full gold-gradient hover:opacity-90 text-primary-foreground font-semibold"
              onClick={() => navigate('/login')}
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5"></div>
      <div className="max-w-4xl mx-auto relative">
        <Card className="shadow-2xl shadow-primary/10 border-border bg-card/95 backdrop-blur-md">
          <CardHeader className="text-center space-y-4">
            {!isSignupFlow && !isLoginRequired && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate(-1)}
                className="absolute top-4 left-4 text-foreground hover:text-foreground hover:bg-accent"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            
            <div className="flex items-center justify-center">
              <img src={LOGO_URL} alt="TAAI Travel" className="h-[120px] w-auto" />
            </div>
            
            <CardTitle className="text-2xl text-foreground">Terms of Service</CardTitle>
            <p className="text-muted-foreground">Effective October 22, 2026</p>
            {(isSignupFlow || isLoginRequired) && (
              <p className="text-sm text-muted-foreground">
                {isSignupFlow
                  ? "Please review and accept our terms to complete your registration"
                  : "We've updated our terms. Please review and accept to continue"}
              </p>
            )}
          </CardHeader>

          <CardContent className="space-y-6 max-h-[70vh] overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-foreground" />
                <h2 className="text-xl font-semibold text-foreground">Terms of Service</h2>
              </div>
              
              <div className="text-foreground/80 space-y-4 text-sm">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">1. Who we are</h3>
                  <p>These Terms of Service ("Terms") are a contract between you and Lighthouse Commerce Group LLC, a Florida limited liability company, doing business as TAAI Travel ("TAAI," "we," "us"). Our address is 1065 SW 8th St #1411, Miami, FL 33130. "TAAI Travel," "taai," and the "Service" mean the AI trip-planning software and subscription described below.</p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">2. Acceptance of Terms</h3>
                  <p>By creating an account, purchasing a subscription, or otherwise using the Service, you agree to these Terms and to our Privacy Policy. If you do not agree, do not use the Service.</p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">3. The Service is planning software, not travel for sale</h3>
                  <p>TAAI is an AI trip-planning software subscription and information tool. It helps you organize ideas, compare publicly available or third-party information, build itineraries, and collaborate with other people on a trip.</p>
                  <p className="mt-2">TAAI does not sell travel. TAAI does not book, reserve, ticket, or arrange airfare, lodging, ground transportation, activities, or other travel for you, and TAAI does not collect payment from you for travel. TAAI is not acting as your travel agent, and it is not a seller of travel. Any purchase of travel is a separate transaction between you and the company that actually provides it.</p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">4. Third-party providers fulfill travel</h3>
                  <p>If you decide to travel, you book directly with the airline, hotel, activity operator, or other third-party provider, or through that provider's own site or checkout. That provider — not TAAI — is responsible for availability, pricing, fulfillment, changes, delays, cancellations, refunds, and customer service for the travel. TAAI does not guarantee that any option you see can be purchased, or that a provider will honor a price, schedule, or description shown in the Service.</p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">5. Subscriptions, automatic renewal, cancellation, and refunds</h3>
                  <div className="space-y-2">
                    <p>Paid access to the Service is a subscription for software, billed by Stripe. The price, billing period (monthly or annual), and what the plan includes are shown on the subscription page before you pay. Subscription fees are charges for the software. They are not payment for travel.</p>
                    <p><strong>Automatic renewal.</strong> Your subscription renews automatically at the end of each billing period, for the same period length you selected, at the price then shown for that plan (plus applicable tax), until you cancel. We will charge the payment method you provided to Stripe for each renewal. By subscribing, you authorize those recurring charges.</p>
                    <p><strong>How to cancel online.</strong> You can cancel at any time before the next renewal. While signed in, open Subscription and choose Manage Subscription. That opens the Stripe customer portal, where you can cancel the subscription online. You may also write to us at the Miami address above or email info@taai.travel and ask us to cancel. Cancellation stops the next renewal. You keep access through the end of the period you already paid for.</p>
                    <p><strong>Refunds.</strong> Except where the law requires otherwise, subscription fees are non-refundable, including unused time left in a period after you cancel. We do not refund travel purchases because we do not sell travel or take payment for it. Any refund, credit, or change for a flight, stay, activity, or other travel purchase is solely between you and the provider you paid.</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">6. AI-generated content</h3>
                  <p>Itineraries, recommendations, prices, availability, and other content in the Service may be generated or summarized by artificial intelligence or retrieved from third parties. That content can be inaccurate, incomplete, outdated, or unsuitable for your trip. You must verify prices, availability, schedules, cancellation rules, visa and entry rules, and other details with the provider and with official sources before you rely on them or purchase anything. TAAI does not warrant that AI output is correct.</p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">7. Third-party links and affiliate disclosure</h3>
                  <p>The Service may link to third-party websites, including airlines, lodging, activities, and maps. Those sites are not operated by TAAI. Their terms, privacy policies, and prices apply to anything you do there. Some links are affiliate links or similar referrals. If you buy from that third party, TAAI may earn a commission or other compensation. A commission does not mean TAAI is the seller, that TAAI collected your payment, or that the third party is our agent. You are responsible for reviewing the third party's offer before you buy.</p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">8. Your account</h3>
                  <p>You are responsible for your account credentials and for activity under your account. Tell us promptly at info@taai.travel if you believe someone is using your account without permission. You must provide accurate account information and use the Service only for lawful personal or internal business planning.</p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">9. Disclaimers and limitation of liability</h3>
                  <div className="space-y-2">
                    <p>The Service is provided "as is" and "as available." To the fullest extent permitted by law, TAAI disclaims warranties of merchantability, fitness for a particular purpose, title, and non-infringement, and any warranty that the Service, AI output, prices, or availability will be accurate, uninterrupted, or error-free.</p>
                    <p>To the fullest extent permitted by Florida law, TAAI and its members, managers, employees, and contractors will not be liable for any indirect, incidental, special, consequential, exemplary, or punitive damages, or for lost profits, lost data, or travel costs, including costs caused by a provider, a missed connection, an inaccurate recommendation, or a decision you make using the Service. This applies even if we have been advised of the possibility of those damages.</p>
                    <p>To the fullest extent permitted by law, TAAI's total liability for any claim arising out of the Service or these Terms is limited to the subscription fees you paid to TAAI in the twelve (12) months before the claim, or one hundred U.S. dollars (US $100) if you paid no subscription fees. These limits do not apply where the law does not allow them, including liability that cannot be limited for gross negligence, willful misconduct, or certain statutory rights.</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">10. Governing law</h3>
                  <p>These Terms are governed by the laws of the State of Florida, without regard to conflict-of-law rules. Exclusive venue for disputes that are not subject to a non-waivable right to sue elsewhere lies in the state or federal courts located in Miami-Dade County, Florida, and you consent to personal jurisdiction there. Some states do not allow certain disclaimers or liability limits. If you live in one of those states, those terms apply only to the extent the law allows. California residents may contact the Complaint Assistance Unit of the Division of Consumer Services of the California Department of Consumer Affairs at 1625 North Market Blvd., Suite N 112, Sacramento, CA 95834, or (800) 952-5210. Nothing in these Terms names the law of another state as the law that governs this agreement.</p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">11. Contact</h3>
                  <p>Lighthouse Commerce Group LLC d/b/a TAAI Travel, 1065 SW 8th St #1411, Miami, FL 33130. Email: info@taai.travel. Privacy requests may also be sent to privacy@taai.travel.</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <a href="/privacy-policy" className="text-primary hover:text-primary/80 text-sm font-medium">
                View our Privacy Policy →
              </a>
            </div>

            {(isSignupFlow || isLoginRequired) && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="terms" 
                    checked={termsAccepted}
                    onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                  />
                  <label htmlFor="terms" className="text-sm text-foreground cursor-pointer">
                    I have read and agree to the Terms of Service
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="privacy" 
                    checked={privacyAccepted}
                    onCheckedChange={(checked) => setPrivacyAccepted(checked === true)}
                  />
                  <label htmlFor="privacy" className="text-sm text-foreground cursor-pointer">
                    I have read and agree to the{' '}
                    <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:opacity-80">Privacy Policy</a>
                  </label>
                </div>
                
                <Button 
                  className="w-full gold-gradient hover:opacity-90 text-primary-foreground font-semibold"
                  onClick={handleAcceptance}
                  disabled={loading || !termsAccepted || !privacyAccepted}
                >
                  {loading ? "Processing..." : "Accept and Continue"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <PublicFooter />
    </div>
  );
};

export default Terms;
