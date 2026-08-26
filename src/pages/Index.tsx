import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PublicFooter } from "@/components/shared/PublicFooter";
import { Plane, Map, Calendar, Users, BarChart3, MessageCircle } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { BrightLanding } from "@/components/landing/BrightLanding";

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userType, setUserType] = useState<'individual' | 'company' | null>(null);
  const [isRouterReady, setIsRouterReady] = useState(false);

  useEffect(() => {
    setIsRouterReady(true);
  }, [location]);

  const features = [
    {
      icon: <Plane className="h-7 w-7 text-primary-foreground" />,
      title: "AI-Powered Booking",
      description: "Smart integration with major travel platforms for seamless booking"
    },
    {
      icon: <Map className="h-7 w-7 text-primary-foreground" />,
      title: "Interactive Maps",
      description: "Visual trip planning with location mapping and recommendations"
    },
    {
      icon: <Calendar className="h-7 w-7 text-primary-foreground" />,
      title: "Smart Itineraries",
      description: "Comprehensive trip planning with real-time updates and editing"
    },
    {
      icon: <BarChart3 className="h-7 w-7 text-primary-foreground" />,
      title: "Budget Tracking",
      description: "Real-time expense monitoring with detailed analytics"
    },
    {
      icon: <MessageCircle className="h-7 w-7 text-primary-foreground" />,
      title: "Trip Chat",
      description: "Stay connected with travel updates and group coordination"
    },
    {
      icon: <Users className="h-7 w-7 text-primary-foreground" />,
      title: "Group Travel",
      description: "Perfect for both individual and corporate travel needs"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* New bright landing experience */}
      <BrightLanding />

      {/* Traveler type selection */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            How do you travel?
          </h2>
          <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
            Pick your lane and we'll tailor taai to the way you move.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
            <Card
              className={`cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-105 bg-card/80 border-border ${
                userType === 'individual' ? 'ring-2 ring-primary shadow-lg' : ''
              }`}
              onClick={() => setUserType('individual')}
            >
              <CardHeader className="text-center pb-2">
                <div className="mx-auto w-16 h-16 gold-gradient rounded-full flex items-center justify-center mb-4 shadow-lg">
                  <Users className="h-8 w-8 text-primary-foreground" />
                </div>
                <CardTitle className="text-xl text-card-foreground">Individual Travel</CardTitle>
                <CardDescription className="text-muted-foreground">Perfect for personal trips and adventures</CardDescription>
              </CardHeader>
            </Card>

            <Card
              className={`cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-105 bg-card/80 border-border ${
                userType === 'company' ? 'ring-2 ring-primary shadow-lg' : ''
              }`}
              onClick={() => setUserType('company')}
            >
              <CardHeader className="text-center pb-2">
                <div className="mx-auto w-16 h-16 gold-gradient rounded-full flex items-center justify-center mb-4 shadow-lg">
                  <BarChart3 className="h-8 w-8 text-primary-foreground" />
                </div>
                <CardTitle className="text-xl text-card-foreground">Corporate Travel</CardTitle>
                <CardDescription className="text-muted-foreground">Streamlined solutions for business travel</CardDescription>
              </CardHeader>
            </Card>
          </div>

          <Button
            size="lg"
            className="gold-gradient hover:opacity-90 text-primary-foreground px-8 py-6 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
            disabled={!userType}
            onClick={() => isRouterReady && navigate('/signup', { state: { userType } })}
          >
            Start Your Journey
            <Plane className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-background to-secondary">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Everything You Need for Perfect Travel
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              From AI-powered recommendations to real-time budget tracking,
              TAAI Travel revolutionizes how you plan and manage your trips.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-2xl transition-all duration-300 bg-card/60 border-border hover:border-primary/40">
                <CardContent className="p-6">
                  <div className="mb-4 h-14 w-14 rounded-2xl gold-gradient flex items-center justify-center shadow-md group-hover:scale-105 transition-all duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-card-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 gold-gradient-flowing">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-primary-foreground mb-6">
            Ready to Transform Your Travel Experience?
          </h2>
          <p className="text-xl text-primary-foreground/80 mb-8">
            Join thousands of travelers who've discovered smarter, more efficient trip planning.
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="bg-background text-foreground hover:bg-background/90 border-2 border-background px-8 py-6 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
            onClick={() => isRouterReady && navigate('/signup')}
          >
            Get Started Today
          </Button>
        </div>
      </section>

      <PublicFooter />

      <ChatInterface context="travel planning and general travel assistance" />
    </div>
  );
};

export default Index;
