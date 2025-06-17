
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plane, Map, Calendar, Users, BarChart3, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();
  const [userType, setUserType] = useState<'individual' | 'company' | null>(null);

  const features = [
    {
      icon: <Plane className="h-8 w-8 text-blue-600" />,
      title: "AI-Powered Booking",
      description: "Smart integration with major travel platforms for seamless booking"
    },
    {
      icon: <Map className="h-8 w-8 text-emerald-600" />,
      title: "Interactive Maps",
      description: "Visual trip planning with location mapping and recommendations"
    },
    {
      icon: <Calendar className="h-8 w-8 text-purple-600" />,
      title: "Smart Itineraries",
      description: "Comprehensive trip planning with real-time updates and editing"
    },
    {
      icon: <BarChart3 className="h-8 w-8 text-orange-600" />,
      title: "Budget Tracking",
      description: "Real-time expense monitoring with detailed analytics"
    },
    {
      icon: <MessageCircle className="h-8 w-8 text-pink-600" />,
      title: "Trip Chat",
      description: "Stay connected with travel updates and group coordination"
    },
    {
      icon: <Users className="h-8 w-8 text-indigo-600" />,
      title: "Group Travel",
      description: "Perfect for both individual and corporate travel needs"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-blue-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Plane className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                TAAI Travel
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" className="text-gray-600 hover:text-blue-600">
                Features
              </Button>
              <Button variant="ghost" className="text-gray-600 hover:text-blue-600">
                About
              </Button>
              <Button 
                onClick={() => navigate('/login')}
                variant="outline" 
                className="border-blue-200 text-blue-600 hover:bg-blue-50"
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <Badge className="mb-6 bg-blue-100 text-blue-700 hover:bg-blue-200" variant="secondary">
            AI-Powered Travel Planning
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
            Your Ultimate
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-600 bg-clip-text text-transparent block">
              Travel Companion
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            Experience the future of travel planning with AI-driven itineraries, 
            real-time booking, and intelligent budget tracking all in one platform.
          </p>
          
          {/* User Type Selection */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
            <Card 
              className={`cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 ${
                userType === 'individual' ? 'ring-2 ring-blue-500 shadow-lg' : ''
              }`}
              onClick={() => setUserType('individual')}
            >
              <CardHeader className="text-center pb-2">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mb-4">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl">Individual Travel</CardTitle>
                <CardDescription>Perfect for personal trips and adventures</CardDescription>
              </CardHeader>
            </Card>
            
            <Card 
              className={`cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 ${
                userType === 'company' ? 'ring-2 ring-emerald-500 shadow-lg' : ''
              }`}
              onClick={() => setUserType('company')}
            >
              <CardHeader className="text-center pb-2">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mb-4">
                  <BarChart3 className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl">Corporate Travel</CardTitle>
                <CardDescription>Streamlined solutions for business travel</CardDescription>
              </CardHeader>
            </Card>
          </div>

          <Button 
            size="lg" 
            className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white px-8 py-6 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
            disabled={!userType}
            onClick={() => navigate('/signup', { state: { userType } })}
          >
            Start Your Journey
            <Plane className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need for Perfect Travel
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From AI-powered recommendations to real-time budget tracking, 
              TAAI Travel revolutionizes how you plan and manage your trips.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300 border-gray-100 hover:border-blue-200">
                <CardContent className="p-6">
                  <div className="mb-4 group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-emerald-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Travel Experience?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of travelers who've discovered smarter, more efficient trip planning.
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            className="bg-white text-blue-600 hover:bg-gray-50 px-8 py-6 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
            onClick={() => navigate('/signup')}
          >
            Get Started Today
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Plane className="h-6 w-6 text-blue-400" />
            <span className="text-xl font-bold">TAAI Travel</span>
          </div>
          <p className="text-gray-400 mb-4">
            Revolutionizing travel planning with artificial intelligence
          </p>
          <div className="flex justify-center space-x-6 text-sm text-gray-400">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
