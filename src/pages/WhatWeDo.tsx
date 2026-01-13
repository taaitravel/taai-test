import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Plane, Map, Calendar, BarChart3, MessageCircle, Users, Zap, Globe, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const WhatWeDo = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const features = [
    {
      icon: <Plane className="h-12 w-12 text-white" />,
      title: "AI-Powered Booking",
      description: "Smart integration with major travel platforms for seamless booking",
      details: "Our AI analyzes thousands of options to find the best flights, hotels, and activities within your budget and preferences."
    },
    {
      icon: <Map className="h-12 w-12 text-white" />,
      title: "Interactive Maps",
      description: "Visual trip planning with location mapping and recommendations",
      details: "See your entire journey visualized on interactive maps with real-time updates and location-based suggestions."
    },
    {
      icon: <Calendar className="h-12 w-12 text-white" />,
      title: "Smart Itineraries",
      description: "Comprehensive trip planning with real-time updates and editing",
      details: "Dynamic itineraries that adapt to changes, weather conditions, and local events for the perfect travel experience."
    },
    {
      icon: <BarChart3 className="h-12 w-12 text-white" />,
      title: "Budget Tracking",
      description: "Real-time expense monitoring with detailed analytics",
      details: "Track spending across categories with intelligent budget allocation and cost-saving recommendations."
    },
    {
      icon: <MessageCircle className="h-12 w-12 text-white" />,
      title: "Trip Chat",
      description: "Stay connected with travel updates and group coordination",
      details: "Collaborate with travel companions, receive updates, and coordinate plans through our integrated chat system."
    },
    {
      icon: <Users className="h-12 w-12 text-white" />,
      title: "Group Travel",
      description: "Perfect for both individual and corporate travel needs",
      details: "Advanced group management tools for corporate travel and family trips with shared budgets and permissions."
    }
  ];

  const benefits = [
    {
      icon: <Zap className="h-8 w-8 text-white" />,
      title: "Save Time",
      description: "Reduce planning time from hours to minutes with AI assistance"
    },
    {
      icon: <Globe className="h-8 w-8 text-white" />,
      title: "Global Access",
      description: "Access to worldwide travel options and local recommendations"
    },
    {
      icon: <Clock className="h-8 w-8 text-white" />,
      title: "24/7 Support",
      description: "Round-the-clock assistance for all your travel needs"
    }
  ];

  return (
    <div className="min-h-screen bg-[#171821]">
      {/* Navigation */}
      <nav className="bg-[#171821]/95 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Button 
              variant="ghost" 
              className="text-white hover:text-white hover:bg-white/10"
              onClick={() => navigate('/')}
            >
              ← Back to Home
            </Button>
            
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <img src="/lovable-uploads/1c94ff06-05c4-46fe-b015-481744bc6ce1.png" alt="TAAI Travel" className="h-[70px]" />
            </div>
            
            <div className="flex items-center space-x-4">
              {user ? (
                <Button 
                  onClick={() => navigate('/home')}
                  className="gold-gradient hover:opacity-90 text-[#171821] font-semibold"
                >
                  Dashboard
                </Button>
              ) : (
                <Button 
                  onClick={() => navigate('/signup')}
                  className="gold-gradient hover:opacity-90 text-[#171821] font-semibold"
                >
                  Get Started
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5"></div>
        <div className="max-w-7xl mx-auto text-center relative">
          <Badge className="mb-6 bg-white/20 text-white hover:bg-white/30 border-white/30" variant="secondary">
            Revolutionary Travel Technology
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            What We Do
            <span className="luxury-text-gradient block">
              Better Than Anyone
            </span>
          </h1>
          <p className="text-xl text-white/80 mb-12 max-w-3xl mx-auto leading-relaxed">
            TAAI Travel combines artificial intelligence with intuitive design to create 
            the most advanced travel planning platform on the market.
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Our Core Features
            </h2>
            <p className="text-xl text-white/80 max-w-3xl mx-auto">
              Every feature is designed to make travel planning effortless and enjoyable
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="group hover:shadow-2xl hover:shadow-white/20 transition-all duration-300 bg-[#171821]/60 border-white/20 hover:border-white/40 hover:scale-105"
              >
                <CardContent className="p-6">
                  <div className="mb-6 group-hover:scale-110 transition-all duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-white/70 mb-4">
                    {feature.description}
                  </p>
                  <p className="text-sm text-white/60">
                    {feature.details}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-[#171821] to-[#2d2a1f]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Why Choose TAAI Travel?
            </h2>
            <p className="text-xl text-white/80">
              Discover the advantages that set us apart
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {benefits.map((benefit, index) => (
              <div 
                key={index}
                className="text-center p-6 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300"
              >
                <div className="flex justify-center mb-4">
                  {benefit.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {benefit.title}
                </h3>
                <p className="text-white/70">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Button 
              size="lg" 
              className="gold-gradient hover:opacity-90 text-[#171821] px-8 py-6 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
              onClick={() => navigate('/signup')}
            >
              Start Your Journey Today
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
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
              onClick={() => navigate('/contact')}
            >
              Contact Us
            </Button>
            <Button 
              variant="link" 
              className="p-0 h-auto font-normal text-white/70 hover:text-white transition-colors"
              onClick={() => navigate('/terms')}
            >
              Terms of Service
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default WhatWeDo;