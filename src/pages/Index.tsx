import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { Plane, Map, Calendar, Users, BarChart3, MessageCircle, LogOut, User, Menu, X } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { ChatInterface } from "@/components/chat/ChatInterface";

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut, userProfile } = useAuth();
  const isMobile = useIsMobile();
  const [userType, setUserType] = useState<'individual' | 'company' | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRouterReady, setIsRouterReady] = useState(false);

  // Ensure router context is ready
  useEffect(() => {
    setIsRouterReady(true);
  }, [location]);

  const handleMenuItemClick = (path: string) => {
    if (isRouterReady) {
      navigate(path);
      setIsMenuOpen(false);
    }
  };

  const getMenuItems = () => {
    if (user) {
      return [
        { label: "Home", path: "/home" },
        { label: "Itineraries", path: "/itineraries" },
        { label: "New Itinerary", path: "/new-itinerary" },
        { label: "Manual Itinerary", path: "/new-manual-itinerary" },
        { label: "Subscription", path: "/subscription" },
        { label: "Profile & Settings", path: "/profile-setup" },
        { label: "Contact Us", path: "/contact" }
      ];
    } else {
      return [
        { label: "What We Do", path: "/what-we-do" },
        { label: "Subscription", path: "/subscription" },
        { label: "Contact Us", path: "/contact" },
        { label: "Sign In", path: "/login" }
      ];
    }
  };

  const features = [
    {
      icon: <Plane className="h-8 w-8 text-white" />,
      title: "AI-Powered Booking",
      description: "Smart integration with major travel platforms for seamless booking"
    },
    {
      icon: <Map className="h-8 w-8 text-white" />,
      title: "Interactive Maps",
      description: "Visual trip planning with location mapping and recommendations"
    },
    {
      icon: <Calendar className="h-8 w-8 text-white" />,
      title: "Smart Itineraries",
      description: "Comprehensive trip planning with real-time updates and editing"
    },
    {
      icon: <BarChart3 className="h-8 w-8 text-white" />,
      title: "Budget Tracking",
      description: "Real-time expense monitoring with detailed analytics"
    },
    {
      icon: <MessageCircle className="h-8 w-8 text-white" />,
      title: "Trip Chat",
      description: "Stay connected with travel updates and group coordination"
    },
    {
      icon: <Users className="h-8 w-8 text-white" />,
      title: "Group Travel",
      description: "Perfect for both individual and corporate travel needs"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-background/95 backdrop-blur-md border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 relative">
            {/* Left side - Mobile Menu or Desktop Navigation */}
            <div className="flex items-center space-x-4">
              {isMobile ? (
                <Drawer open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                  <DrawerTrigger asChild>
                    <Button 
                      variant="ghost"
                      size="sm"
                    className="text-foreground hover:bg-accent p-2 rounded-full"
                    >
                      <Menu className="h-6 w-6" />
                    </Button>
                  </DrawerTrigger>
                  <DrawerContent className="h-screen bg-background/95 backdrop-blur-md border-none">
                    <div className="flex flex-col h-full">
                      {/* Header with close button */}
                      <div className="flex justify-between items-center p-6 border-b border-border">
                        <img 
                          src="/lovable-uploads/1c94ff06-05c4-46fe-b015-481744bc6ce1.png" 
                          alt="TAAI Travel" 
                          className="h-12" 
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-foreground hover:bg-accent p-2 rounded-full"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <X className="h-6 w-6" />
                        </Button>
                      </div>
                      
                      {/* Menu Items */}
                      <div className="flex-1 flex flex-col justify-center space-y-8 px-6">
                        {getMenuItems().map((item) => (
                          <button
                            key={item.path}
                            onClick={() => handleMenuItemClick(item.path)}
                            className="text-foreground text-2xl font-bold text-left hover:text-primary transition-colors duration-200 py-4"
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                      
                      {/* Footer with traveler level for logged in users */}
                        {user && (
                          <div className="p-6 border-t border-border">
                            <Badge className="bg-accent text-foreground border-border text-lg px-4 py-2">
                              Master Traveler
                            </Badge>
                        </div>
                      )}
                    </div>
                  </DrawerContent>
                </Drawer>
              ) : (
                <>
                  {!user && (
                    <>
                      <Button 
                        variant="ghost" 
                        className="text-foreground hover:text-foreground hover:bg-accent"
                        onClick={() => isRouterReady && navigate('/what-we-do')}
                      >
                        What We Do
                      </Button>
                      <Button 
                        variant="ghost" 
                        className="text-foreground hover:text-foreground hover:bg-accent"
                        onClick={() => isRouterReady && navigate('/subscription')}
                      >
                        Subscription
                      </Button>
                      <Button 
                        variant="ghost" 
                        className="text-foreground hover:text-foreground hover:bg-accent"
                        onClick={() => isRouterReady && navigate('/contact')}
                      >
                        Contact Us
                      </Button>
                      <Button 
                        onClick={() => isRouterReady && navigate('/login')}
                        variant="outline" 
                        className="bg-card text-foreground border-border hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                      >
                        Sign In
                      </Button>
                    </>
                  )}
                  {user && (
                    <>
                      <Button 
                        variant="ghost" 
                        className="text-white hover:text-white hover:bg-white/10"
                        onClick={() => isRouterReady && navigate('/subscription')}
                      >
                        Subscription
                      </Button>
                      <Button 
                        variant="ghost" 
                        className="text-white hover:text-white hover:bg-white/10"
                        onClick={() => isRouterReady && navigate('/contact')}
                      >
                        Contact Us
                      </Button>
                    </>
                  )}
                </>
              )}
            </div>

            {/* Center - Logo */}
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <img src="/lovable-uploads/1c94ff06-05c4-46fe-b015-481744bc6ce1.png" alt="TAAI Travel" className="h-[70px]" />
            </div>

            {/* Right side - User icon when logged in */}
            <div className="flex items-center space-x-4">
              {user && !isMobile && (
                <Button 
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/10 p-2 rounded-full"
                  onClick={() => isRouterReady && navigate('/home')}
                >
                  <User className="h-6 w-6" />
                </Button>
              )}
              {/* Mobile Right Space (for symmetry) */}
              {isMobile && !user && <div className="w-10"></div>}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5"></div>
        <div className="max-w-7xl mx-auto text-center relative">
          <Badge className="mb-6 bg-white/20 text-white hover:bg-white/30 border-white/30" variant="secondary">
            AI-Powered Travel Planning
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            Your Ultimate
            <span className="luxury-text-gradient block">
              Travel Companion
            </span>
          </h1>
          <p className="text-xl text-white/80 mb-12 max-w-3xl mx-auto leading-relaxed">
            Experience the future of travel planning with AI-driven itineraries, 
            real-time booking, and intelligent budget tracking all in one luxurious platform.
          </p>
          
          {/* User Type Selection */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
            <Card 
              className={`cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-white/25 hover:scale-105 bg-[#171821]/80 border-white/30 ${
                userType === 'individual' ? 'ring-2 ring-white shadow-lg shadow-white/30' : ''
              }`}
              onClick={() => setUserType('individual')}
            >
              <CardHeader className="text-center pb-2">
                <div className="mx-auto w-16 h-16 gold-gradient rounded-full flex items-center justify-center mb-4 shadow-lg">
                  <Users className="h-8 w-8 text-[#171821]" />
                </div>
                <CardTitle className="text-xl text-white">Individual Travel</CardTitle>
                <CardDescription className="text-white/70">Perfect for personal trips and adventures</CardDescription>
              </CardHeader>
            </Card>
            
            <Card 
              className={`cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-white/25 hover:scale-105 bg-[#171821]/80 border-white/30 ${
                userType === 'company' ? 'ring-2 ring-white shadow-lg shadow-white/30' : ''
              }`}
              onClick={() => setUserType('company')}
            >
              <CardHeader className="text-center pb-2">
                <div className="mx-auto w-16 h-16 gold-gradient rounded-full flex items-center justify-center mb-4 shadow-lg">
                  <BarChart3 className="h-8 w-8 text-[#171821]" />
                </div>
                <CardTitle className="text-xl text-white">Corporate Travel</CardTitle>
                <CardDescription className="text-white/70">Streamlined solutions for business travel</CardDescription>
              </CardHeader>
            </Card>
          </div>

          <Button 
            size="lg" 
            className="gold-gradient hover:opacity-90 text-[#171821] px-8 py-6 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
            disabled={!userType}
            onClick={() => isRouterReady && navigate('/signup', { state: { userType } })}
          >
            Start Your Journey
            <Plane className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-[#171821] to-[#2d2a1f]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Everything You Need for Perfect Travel
            </h2>
            <p className="text-xl text-white/80 max-w-3xl mx-auto">
              From AI-powered recommendations to real-time budget tracking, 
              TAAI Travel revolutionizes how you plan and manage your trips.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-2xl hover:shadow-white/20 transition-all duration-300 bg-[#171821]/60 border-white/20 hover:border-white/40">
                <CardContent className="p-6">
                  <div className="mb-4 group-hover:scale-105 transition-all duration-300 transform-gpu perspective-1000 group-hover:translate-z-2">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-white/70">
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
          <h2 className="text-4xl font-bold text-[#171821] mb-6">
            Ready to Transform Your Travel Experience?
          </h2>
          <p className="text-xl text-[#171821]/80 mb-8">
            Join thousands of travelers who've discovered smarter, more efficient trip planning.
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            className="bg-[#171821] text-white hover:bg-[#171821]/90 border-2 border-[#171821] px-8 py-6 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
            onClick={() => isRouterReady && navigate('/signup')}
          >
            Get Started Today
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#171821] text-white py-12 px-4 border-t border-white/20">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center mb-4">
            <img src="/lovable-uploads/1c94ff06-05c4-46fe-b015-481744bc6ce1.png" alt="TAAI Travel" className="max-h-8" />
          </div>
          <p className="text-white/70 mb-4">
            Revolutionizing travel planning with artificial intelligence
          </p>
          <div className="flex justify-center space-x-6 text-sm text-white/70">
            <Button 
              variant="link" 
              className="p-0 h-auto font-normal text-white/70 hover:text-white transition-colors"
              onClick={() => isRouterReady && navigate('/terms')}
            >
              Privacy Policy
            </Button>
            <Button 
              variant="link" 
              className="p-0 h-auto font-normal text-white/70 hover:text-white transition-colors"
              onClick={() => isRouterReady && navigate('/terms')}
            >
              Terms of Service
            </Button>
            <a href="mailto:support@taai.travel" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>

      {/* Chat Interface */}
      <ChatInterface context="travel planning and general travel assistance" />
    </div>
  );
};

export default Index;