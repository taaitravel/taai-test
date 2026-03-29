import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";
import { PublicNavigation } from "@/components/shared/PublicNavigation";
import { PublicFooter } from "@/components/shared/PublicFooter";
import { LOGO_URL } from "@/lib/constants";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <PublicNavigation />
      <div className="p-4">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5 pointer-events-none"></div>
        <div className="max-w-4xl mx-auto relative pt-4">
          <Card className="shadow-2xl shadow-primary/10 border-border bg-card/95 backdrop-blur-md">
            <CardHeader className="text-center space-y-4">
              <div className="flex items-center justify-center">
                <img src={LOGO_URL} alt="TAAI Travel" className="h-[120px] w-auto" />
              </div>
              <CardTitle className="text-2xl text-foreground">Privacy Policy</CardTitle>
              <p className="text-muted-foreground">Last updated: January 2025</p>
            </CardHeader>

            <CardContent className="space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-foreground" />
                  <h2 className="text-xl font-semibold text-foreground">Privacy Policy</h2>
                </div>
                
                <div className="text-foreground/80 space-y-4 text-sm">
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">1. Information We Collect</h3>
                    <p>We collect information you provide directly (name, email, travel preferences), automatically (usage data, device information), and from third parties (social media, travel partners). This enables us to provide personalized travel recommendations and seamless booking experiences.</p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-foreground mb-2">2. How We Use Your Information</h3>
                    <p>Your information is used to provide travel services, process bookings, send confirmations, improve our platform, provide customer support, and send relevant travel offers. We may use AI to analyze preferences and suggest personalized itineraries.</p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-foreground mb-2">3. Information Sharing</h3>
                    <p>We share information with travel service providers (airlines, hotels, tour operators), payment processors, analytics providers, and as required by law. We do not sell personal information to third parties for marketing purposes.</p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-foreground mb-2">4. Data Security</h3>
                    <p>We implement industry-standard security measures including encryption, secure servers, and regular security audits. However, no method of transmission over the internet is 100% secure.</p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-foreground mb-2">5. Your Rights and Choices</h3>
                    <p>You may access, update, or delete your personal information through your account settings. You can opt out of marketing communications and choose your privacy preferences.</p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-foreground mb-2">6. Cookies and Tracking</h3>
                    <p>We use cookies and similar technologies to enhance your experience, remember preferences, and analyze usage. You can control cookie settings through your browser.</p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-foreground mb-2">7. Regional Privacy Rights</h3>
                    <div className="space-y-2">
                      <p><strong>GDPR (EU/UK):</strong> Rights to access, rectify, erase, restrict processing, data portability, and object to processing.</p>
                      <p><strong>CCPA (California):</strong> Rights to know, delete, opt-out of sale, and non-discrimination.</p>
                      <p><strong>PIPEDA (Canada):</strong> Right to access personal information and request corrections.</p>
                      <p><strong>Privacy Act (Australia):</strong> Rights under Australian Privacy Principles apply.</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-foreground mb-2">8. Children's Privacy</h3>
                    <p>Our service is not intended for children under 13. We do not knowingly collect personal information from children under 13. If we become aware of such collection, we will delete the information immediately.</p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-foreground mb-2">9. International Data Transfers</h3>
                    <p>Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place for such transfers in compliance with applicable laws.</p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-foreground mb-2">10. Contact Information</h3>
                    <p>For privacy-related questions or to exercise your rights, contact us at privacy@taai.travel or write to us at our registered address. We will respond within the timeframes required by applicable law.</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <a href="/terms" className="text-primary hover:text-primary/80 text-sm font-medium">
                  View our Terms of Service →
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
};

export default PrivacyPolicy;
