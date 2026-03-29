import { useState } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, FileText, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { LOGO_URL } from "@/lib/constants";

const Terms = () => {
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
        terms_version: '1.0'
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
            
            <CardTitle className="text-2xl text-foreground">Terms of Service & Privacy Policy</CardTitle>
            <p className="text-muted-foreground">
              {isSignupFlow ? "Please review and accept our terms to complete your registration" : 
               isLoginRequired ? "We've updated our terms. Please review and accept to continue" :
               "Last updated: January 2025"}
            </p>
          </CardHeader>

          <CardContent className="space-y-6 max-h-[70vh] overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-foreground" />
                <h2 className="text-xl font-semibold text-foreground">Terms of Service</h2>
              </div>
              
              <div className="text-foreground/80 space-y-4 text-sm">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">1. Acceptance of Terms</h3>
                  <p>By accessing and using TAAI Travel ("Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.</p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">2. Description of Service</h3>
                  <p>TAAI Travel provides travel planning, itinerary management, and booking assistance services. We facilitate connections between travelers and travel service providers including airlines, hotels, and activity providers.</p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">3. User Responsibilities</h3>
                  <p>You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account or password. You must notify us immediately of any unauthorized use of your account.</p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">4. Booking and Payment Terms</h3>
                  <p>All bookings are subject to availability and confirmation. Prices may vary based on availability, demand, and other factors. Payment processing is handled by third-party providers, and you agree to their terms of service.</p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">5. Cancellation and Refund Policy</h3>
                  <p>Cancellation and refund policies vary by service provider and booking type. We will clearly communicate applicable policies before booking confirmation. TAAI Travel acts as an intermediary and refunds are subject to provider policies.</p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">6. Limitation of Liability</h3>
                  <p>TAAI Travel shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the service. Our liability is limited to the amount paid for our services.</p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">7. State-Specific Provisions</h3>
                  <div className="space-y-2">
                    <p><strong>California Residents:</strong> Under California Civil Code Section 1789.3, you may contact the Complaint Assistance Unit of the Division of Consumer Services at 1625 North Market Blvd., Sacramento, CA 95834.</p>
                    <p><strong>New York Residents:</strong> This agreement shall be governed by New York law without regard to conflict of law provisions.</p>
                    <p><strong>Texas Residents:</strong> If you have a complaint, you may contact the Texas Attorney General's Consumer Protection Division.</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">8. International Users</h3>
                  <div className="space-y-2">
                    <p><strong>European Union:</strong> Under GDPR, you have rights regarding your personal data including access, rectification, erasure, and portability.</p>
                    <p><strong>Canada:</strong> This service complies with Canadian privacy laws including PIPEDA.</p>
                    <p><strong>Australia:</strong> Australian Consumer Law protections apply to Australian residents.</p>
                  </div>
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
    </div>
  );
};

export default Terms;
