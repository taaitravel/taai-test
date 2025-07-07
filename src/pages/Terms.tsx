import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, FileText, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const Terms = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user, updateUserProfile } = useAuth();
  
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const isSignupFlow = location.state?.fromSignup;
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

    setLoading(true);

    try {
      const now = new Date().toISOString();
      const { error } = await updateUserProfile({
        terms_accepted_at: now,
        privacy_accepted_at: now,
        terms_version: '1.0'
      });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to save your acceptance. Please try again.",
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
        navigate('/dashboard');
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

  return (
    <div className="min-h-screen bg-[#171821] p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5"></div>
      <div className="max-w-4xl mx-auto relative">
        <Card className="shadow-2xl shadow-white/20 border-white/30 bg-[#171821]/95 backdrop-blur-md">
          <CardHeader className="text-center space-y-4">
            {!isSignupFlow && !isLoginRequired && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate(-1)}
                className="absolute top-4 left-4 text-white hover:text-white hover:bg-white/10"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            
            <div className="flex items-center justify-center">
              <img src="/lovable-uploads/1c94ff06-05c4-46fe-b015-481744bc6ce1.png" alt="TAAI Travel" className="h-[120px] w-auto" />
            </div>
            
            <CardTitle className="text-2xl text-white">Terms of Service & Privacy Policy</CardTitle>
            <p className="text-white/70">
              {isSignupFlow ? "Please review and accept our terms to complete your registration" : 
               isLoginRequired ? "We've updated our terms. Please review and accept to continue" :
               "Last updated: January 2025"}
            </p>
          </CardHeader>

          <CardContent className="space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Terms of Service Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-white" />
                <h2 className="text-xl font-semibold text-white">Terms of Service</h2>
              </div>
              
              <div className="text-white/80 space-y-4 text-sm">
                <div>
                  <h3 className="font-semibold text-white mb-2">1. Acceptance of Terms</h3>
                  <p>By accessing and using TAAI Travel ("Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.</p>
                </div>

                <div>
                  <h3 className="font-semibold text-white mb-2">2. Description of Service</h3>
                  <p>TAAI Travel provides travel planning, itinerary management, and booking assistance services. We facilitate connections between travelers and travel service providers including airlines, hotels, and activity providers.</p>
                </div>

                <div>
                  <h3 className="font-semibold text-white mb-2">3. User Responsibilities</h3>
                  <p>You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account or password. You must notify us immediately of any unauthorized use of your account.</p>
                </div>

                <div>
                  <h3 className="font-semibold text-white mb-2">4. Booking and Payment Terms</h3>
                  <p>All bookings are subject to availability and confirmation. Prices may vary based on availability, demand, and other factors. Payment processing is handled by third-party providers, and you agree to their terms of service.</p>
                </div>

                <div>
                  <h3 className="font-semibold text-white mb-2">5. Cancellation and Refund Policy</h3>
                  <p>Cancellation and refund policies vary by service provider and booking type. We will clearly communicate applicable policies before booking confirmation. TAAI Travel acts as an intermediary and refunds are subject to provider policies.</p>
                </div>

                <div>
                  <h3 className="font-semibold text-white mb-2">6. Limitation of Liability</h3>
                  <p>TAAI Travel shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the service. Our liability is limited to the amount paid for our services.</p>
                </div>

                <div>
                  <h3 className="font-semibold text-white mb-2">7. State-Specific Provisions</h3>
                  <div className="space-y-2">
                    <p><strong>California Residents:</strong> Under California Civil Code Section 1789.3, you may contact the Complaint Assistance Unit of the Division of Consumer Services at 1625 North Market Blvd., Sacramento, CA 95834.</p>
                    <p><strong>New York Residents:</strong> This agreement shall be governed by New York law without regard to conflict of law provisions.</p>
                    <p><strong>Texas Residents:</strong> If you have a complaint, you may contact the Texas Attorney General's Consumer Protection Division.</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-white mb-2">8. International Users</h3>
                  <div className="space-y-2">
                    <p><strong>European Union:</strong> Under GDPR, you have rights regarding your personal data including access, rectification, erasure, and portability.</p>
                    <p><strong>Canada:</strong> This service complies with Canadian privacy laws including PIPEDA.</p>
                    <p><strong>Australia:</strong> Australian Consumer Law protections apply to Australian residents.</p>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="bg-white/30" />

            {/* Privacy Policy Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-white" />
                <h2 className="text-xl font-semibold text-white">Privacy Policy</h2>
              </div>
              
              <div className="text-white/80 space-y-4 text-sm">
                <div>
                  <h3 className="font-semibold text-white mb-2">1. Information We Collect</h3>
                  <p>We collect information you provide directly (name, email, travel preferences), automatically (usage data, device information), and from third parties (social media, travel partners). This enables us to provide personalized travel recommendations and seamless booking experiences.</p>
                </div>

                <div>
                  <h3 className="font-semibold text-white mb-2">2. How We Use Your Information</h3>
                  <p>Your information is used to provide travel services, process bookings, send confirmations, improve our platform, provide customer support, and send relevant travel offers. We may use AI to analyze preferences and suggest personalized itineraries.</p>
                </div>

                <div>
                  <h3 className="font-semibold text-white mb-2">3. Information Sharing</h3>
                  <p>We share information with travel service providers (airlines, hotels, tour operators), payment processors, analytics providers, and as required by law. We do not sell personal information to third parties for marketing purposes.</p>
                </div>

                <div>
                  <h3 className="font-semibold text-white mb-2">4. Data Security</h3>
                  <p>We implement industry-standard security measures including encryption, secure servers, and regular security audits. However, no method of transmission over the internet is 100% secure.</p>
                </div>

                <div>
                  <h3 className="font-semibold text-white mb-2">5. Your Rights and Choices</h3>
                  <p>You may access, update, or delete your personal information through your account settings. You can opt out of marketing communications and choose your privacy preferences.</p>
                </div>

                <div>
                  <h3 className="font-semibold text-white mb-2">6. Cookies and Tracking</h3>
                  <p>We use cookies and similar technologies to enhance your experience, remember preferences, and analyze usage. You can control cookie settings through your browser.</p>
                </div>

                <div>
                  <h3 className="font-semibold text-white mb-2">7. Regional Privacy Rights</h3>
                  <div className="space-y-2">
                    <p><strong>GDPR (EU/UK):</strong> Rights to access, rectify, erase, restrict processing, data portability, and object to processing.</p>
                    <p><strong>CCPA (California):</strong> Rights to know, delete, opt-out of sale, and non-discrimination.</p>
                    <p><strong>PIPEDA (Canada):</strong> Right to access personal information and request corrections.</p>
                    <p><strong>Privacy Act (Australia):</strong> Rights under Australian Privacy Principles apply.</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-white mb-2">8. Children's Privacy</h3>
                  <p>Our service is not intended for children under 13. We do not knowingly collect personal information from children under 13. If we become aware of such collection, we will delete the information immediately.</p>
                </div>

                <div>
                  <h3 className="font-semibold text-white mb-2">9. International Data Transfers</h3>
                  <p>Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place for such transfers in compliance with applicable laws.</p>
                </div>

                <div>
                  <h3 className="font-semibold text-white mb-2">10. Contact Information</h3>
                  <p>For privacy-related questions or to exercise your rights, contact us at privacy@taai.travel or write to us at our registered address. We will respond within the timeframes required by applicable law.</p>
                </div>
              </div>
            </div>

            <Separator className="bg-white/30" />

            {/* Acceptance Section */}
            {(isSignupFlow || isLoginRequired) && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="terms" 
                    checked={termsAccepted}
                    onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                  />
                  <label htmlFor="terms" className="text-sm text-white cursor-pointer">
                    I have read and agree to the Terms of Service
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="privacy" 
                    checked={privacyAccepted}
                    onCheckedChange={(checked) => setPrivacyAccepted(checked === true)}
                  />
                  <label htmlFor="privacy" className="text-sm text-white cursor-pointer">
                    I have read and agree to the Privacy Policy
                  </label>
                </div>
                
                <Button 
                  className="w-full gold-gradient hover:opacity-90 text-[#171821] font-semibold"
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