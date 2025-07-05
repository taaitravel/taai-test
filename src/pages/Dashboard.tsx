
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Plane, Plus, Calendar, Map, BarChart3, MessageCircle, Users, Clock, User, MapPin, ChevronLeft, ChevronRight, X, Heart, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import WorldMap from "@/components/WorldMap";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getTravelerLevel } from "@/lib/travelerLevel";
import { toast } from "sonner";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeItineraries, setActiveItineraries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showTripBrowser, setShowTripBrowser] = useState(false);
  const [currentTripIndex, setCurrentTripIndex] = useState(0);
  const planeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchUserItineraries();
      fetchUserProfile();
    }
  }, [user]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (planeRef.current) {
        const rect = planeRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const deltaX = (e.clientX - centerX) * 0.1; // Reduced sensitivity
        const deltaY = (e.clientY - centerY) * 0.1;
        
        setMousePosition({ x: deltaX, y: deltaY });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const fetchUserItineraries = async () => {
    try {
      const { data, error } = await supabase
        .from('itinerary')
        .select('*')
        .eq('userid', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform the data to match the expected format
      const transformedItineraries = data.map(item => ({
        id: item.id,
        name: item.itin_name || 'Untitled Trip',
        dates: formatDateRange(item.itin_date_start, item.itin_date_end),
        locations: Array.isArray(item.itin_locations) ? item.itin_locations : [],
        budget: item.budget || 0,
        spent: item.spending || 0,
        people: Array.isArray(item.attendees) ? item.attendees.length : 1,
        status: getItineraryStatus(item.itin_date_start, item.itin_date_end)
      }));

      // Add sample trips if no data exists
      const sampleTrips = [
        {
          id: 'sample-singapore',
          name: 'Southeast Asia Adventure',
          dates: 'Dec 15, 2024 - Dec 28, 2024',
          locations: ['Singapore', 'Bangkok', 'Phuket'],
          budget: 4500,
          spent: 1200,
          people: 2,
          status: 'upcoming',
          image: '🌴'
        },
        {
          id: 'sample-europe',
          name: 'European Winter Escape',
          dates: 'Jan 10, 2025 - Jan 20, 2025',
          locations: ['Paris', 'Amsterdam', 'Berlin'],
          budget: 3200,
          spent: 800,
          people: 1,
          status: 'planning',
          image: '❄️'
        },
        {
          id: 'sample-completed',
          name: 'Tokyo Summer Trip',
          dates: 'Jun 5, 2024 - Jun 15, 2024',
          locations: ['Tokyo', 'Kyoto', 'Osaka'],
          budget: 2800,
          spent: 3200,
          people: 2,
          status: 'completed',
          image: '🍜'
        }
      ];

      const allTrips = transformedItineraries.length > 0 ? transformedItineraries : sampleTrips;
      setActiveItineraries(allTrips);
    } catch (error) {
      console.error('Error fetching itineraries:', error);
      toast.error('Failed to load your trips');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('userid', user?.id)
        .single();

      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return 'Dates TBD';
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const formatOptions: Intl.DateTimeFormatOptions = { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    };
    
    return `${start.toLocaleDateString('en-US', formatOptions)} - ${end.toLocaleDateString('en-US', formatOptions)}`;
  };

  const getItineraryStatus = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return 'planning';
    
    const today = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (today < start) return 'upcoming';
    if (today >= start && today <= end) return 'active';
    return 'completed';
  };

  // Get visited countries from user profile
  const visitedCountries = Array.isArray(userProfile?.countries_visited) 
    ? userProfile.countries_visited as string[] 
    : [];

  // Calculate flights this year from user profile
  const flightsThisYear = userProfile?.flight_freq && typeof userProfile.flight_freq === 'object' 
    ? Object.values(userProfile.flight_freq).reduce((sum: number, flights: any) => sum + (Number(flights) || 0), 0)
    : 0;

  // Count unique cities from all itineraries
  const uniqueCities = new Set();
  activeItineraries.forEach(itinerary => {
    if (Array.isArray(itinerary.locations)) {
      itinerary.locations.forEach((location: string) => uniqueCities.add(location));
    }
  });

  const userStats = {
    totalTrips: activeItineraries.length,
    countriesVisited: visitedCountries.length,
    citiesVisited: uniqueCities.size,
    totalSpent: 45000,
    flightsThisYear,
    travelerLevel: getTravelerLevel(visitedCountries.length, Number(flightsThisYear))
  };

  // Chart data
  const monthlyFlights = [
    { month: 'Jan', flights: 2 },
    { month: 'Feb', flights: 1 },
    { month: 'Mar', flights: 3 },
    { month: 'Apr', flights: 2 },
    { month: 'May', flights: 4 },
    { month: 'Jun', flights: 3 },
    { month: 'Jul', flights: 5 },
    { month: 'Aug', flights: 2 },
    { month: 'Sep', flights: 1 },
    { month: 'Oct', flights: 1 },
    { month: 'Nov', flights: 0 },
    { month: 'Dec', flights: 0 }
  ];

  const spendingData = [
    { name: 'Flights', value: 18000, color: 'hsl(var(--primary))' },
    { name: 'Hotels', value: 15000, color: 'hsl(var(--secondary))' },
    { name: 'Food', value: 7000, color: 'hsl(var(--accent))' },
    { name: 'Activities', value: 5000, color: 'hsl(var(--muted))' }
  ];

  const chartConfig = {
    flights: {
      label: "Flights",
      color: "hsl(var(--primary))",
    }
  };

  return (
    <div className="min-h-screen bg-[#171821]">
      {/* Navigation */}
      <nav className="bg-[#171821]/95 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
            </div>
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <img src="/lovable-uploads/1c94ff06-05c4-46fe-b015-481744bc6ce1.png" alt="TAAI Travel" className="h-[70px]" />
            </div>
            <div className="flex items-center space-x-4">
              <Badge className="bg-white/20 text-white border-white/30">
                {userStats.travelerLevel}
              </Badge>
              <Button 
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10 p-2 rounded-full"
                onClick={() => navigate('/profile-setup')}
              >
                <User className="h-5 w-5" />
              </Button>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  onClick={() => navigate('/create-itinerary')}
                  className="gold-gradient hover:opacity-90 text-[#171821] font-semibold"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  AI Trip
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => navigate('/create-manual-itinerary')}
                  className="border-white/50 text-white hover:bg-white/10"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Manual
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section - Side by Side with Expanded Width */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          {/* Dynamic Welcome Bubble */}
          <div className="relative">
            <div className="bg-gradient-to-br from-white/10 via-white/5 to-transparent p-8 rounded-3xl border border-white/30 h-64 flex flex-col justify-center backdrop-blur-md">
              <h1 className="text-4xl font-bold text-white mb-4 animate-fade-in">
                Welcome back, {userProfile?.first_name || 'Traveler'}! ✈️
              </h1>
              <p className="text-xl text-white/70 animate-fade-in">
                Ready to plan your next adventure?
              </p>
              <div className="mt-4 flex space-x-2">
                <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                <div className="w-3 h-3 bg-white/60 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                <div className="w-3 h-3 bg-white/30 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
              </div>
            </div>
          </div>

          {/* Upcoming Travel */}
          <div className="relative">
            <div className="bg-gradient-to-br from-white/10 via-white/5 to-transparent p-8 rounded-3xl border border-white/30 h-64 flex flex-col justify-center backdrop-blur-md">
              <p className="text-lg text-white/70 mb-4">Upcoming Travel</p>
              <div className="flex items-center justify-between">
                <div className="text-6xl font-bold text-white mb-2">
                  Aug 15
                </div>
                <div 
                  ref={planeRef}
                  className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center transition-transform duration-300 ease-out"
                  style={{
                    transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)`
                  }}
                >
                  <Plane className="h-8 w-8 text-white" />
                </div>
              </div>
              <p className="text-lg text-white/70">Business Trip to NYC</p>
              <div className="mt-4">
                <Badge className="bg-white/20 text-white border-white/30">3 days away</Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Cards with Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Total Trips with Bar Chart */}
          <Card className="border-white/30 hover:shadow-2xl hover:shadow-white/20 transition-all duration-300 bg-[#171821]/80 backdrop-blur-md group">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/70">Total Trips YTD</p>
                  <p className="text-2xl font-bold text-white group-hover:scale-105 transition-transform duration-300">{userStats.totalTrips}</p>
                </div>
                <Calendar className="h-8 w-8 text-white group-hover:scale-105 transition-transform duration-300" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <ChartContainer config={chartConfig} className="h-20 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyFlights}>
                    <Bar dataKey="flights" fill="white" radius={2} />
                    <XAxis dataKey="month" hide />
                    <YAxis hide />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Countries Visited with Map */}
          <Card className="border-white/30 hover:shadow-2xl hover:shadow-white/20 transition-all duration-300 bg-[#171821]/80 backdrop-blur-md group">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/70">Countries Visited</p>
                  <p className="text-2xl font-bold text-white group-hover:scale-105 transition-transform duration-300">{visitedCountries.length}</p>
                </div>
                <Map className="h-8 w-8 text-white group-hover:scale-105 transition-transform duration-300" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <WorldMap visitedCountries={visitedCountries} />
            </CardContent>
          </Card>

          {/* Travel Stats Combined */}
          <Card className="border-white/30 hover:shadow-2xl hover:shadow-white/20 transition-all duration-300 bg-[#171821]/80 backdrop-blur-md group">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white/70">Cities Visited</p>
                    <p className="text-xl font-bold text-white">{userStats.citiesVisited}</p>
                  </div>
                  <MapPin className="h-6 w-6 text-white" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white/70">Flights This Year</p>
                    <p className="text-xl font-bold text-white">{Number(userStats.flightsThisYear)}</p>
                  </div>
                  <Plane className="h-6 w-6 text-white" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white/70">Traveler Level</p>
                    <p className="text-sm font-semibold text-white">{userStats.travelerLevel}</p>
                  </div>
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Spent with Pie Chart */}
          <Card className="border-white/30 hover:shadow-2xl hover:shadow-white/20 transition-all duration-300 bg-[#171821]/80 backdrop-blur-md group">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/70">Total Spent</p>
                  <p className="text-2xl font-bold text-white group-hover:scale-105 transition-transform duration-300">${userStats.totalSpent.toLocaleString()}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-white group-hover:scale-105 transition-transform duration-300" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <ChartContainer config={chartConfig} className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={spendingData}
                      cx="50%"
                      cy="50%"
                      innerRadius={15}
                      outerRadius={35}
                      dataKey="value"
                    >
                      {spendingData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Trips Section - 25%, 25%, 50% Layout */}
        <div className="grid grid-cols-4 gap-6">
          {/* Left Column 1 - Upcoming Trips Stack (25%) */}
          <div className="col-span-1">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Upcoming
            </h3>
            {loading ? (
              <div className="text-center py-8">
                <Plane className="h-8 w-8 text-white mx-auto mb-2 animate-pulse" />
                <p className="text-white/70 text-sm">Loading...</p>
              </div>
            ) : (
              <div className="relative h-[400px]">
                {activeItineraries
                  .filter(trip => ['planning', 'upcoming', 'active'].includes(trip.status))
                  .slice(0, 3)
                  .map((trip, index) => (
                    <Card 
                      key={trip.id}
                      className="absolute w-full aspect-[3/4] bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-md border border-white/30 cursor-pointer hover:shadow-2xl hover:shadow-white/20 transition-all duration-300 group"
                      style={{
                        transform: `translateY(${index * 10}px) translateX(${index * 5}px) rotateZ(${index * 2}deg)`,
                        zIndex: 10 - index
                      }}
                      onClick={() => setShowTripBrowser(true)}
                    >
                      <CardContent className="p-4 h-full flex flex-col justify-between">
                        <div>
                          <div className="text-2xl mb-2">{trip.image || '✈️'}</div>
                          <h4 className="font-bold text-white text-sm mb-1 line-clamp-2">{trip.name}</h4>
                          <p className="text-white/70 text-xs mb-2">{trip.dates}</p>
                          <div className="flex flex-wrap gap-1 mb-2">
                            {trip.locations.slice(0, 2).map((location: string, idx: number) => (
                              <Badge key={idx} variant="secondary" className="text-xs bg-white/20 text-white border-white/30">
                                {location}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center text-xs text-white/70">
                            <Users className="h-3 w-3 mr-1" />
                            {trip.people} people
                          </div>
                          <Badge 
                            className={`text-xs ${
                              trip.status === 'active' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                              trip.status === 'upcoming' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                              'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                            }`}
                          >
                            {trip.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                
                {activeItineraries.filter(trip => ['planning', 'upcoming', 'active'].includes(trip.status)).length > 3 && (
                  <div className="absolute bottom-0 right-0 bg-white/20 backdrop-blur-md rounded-full px-3 py-1 text-xs text-white border border-white/30">
                    +{activeItineraries.filter(trip => ['planning', 'upcoming', 'active'].includes(trip.status)).length - 3} more
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Left Column 2 - Past Trips Stack (25%) */}
          <div className="col-span-1">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Past Trips
            </h3>
            <div className="relative h-[400px]">
              {activeItineraries
                .filter(trip => trip.status === 'completed')
                .slice(0, 3)
                .map((trip, index) => (
                  <Card 
                    key={trip.id}
                    className="absolute w-full aspect-[3/4] bg-gradient-to-br from-white/5 via-white/2 to-transparent backdrop-blur-md border border-white/20 cursor-pointer hover:shadow-lg hover:shadow-white/10 transition-all duration-300 group opacity-80"
                    style={{
                      transform: `translateY(${index * 10}px) translateX(${index * 5}px) rotateZ(${index * 2}deg)`,
                      zIndex: 10 - index
                    }}
                    onClick={() => setShowTripBrowser(true)}
                  >
                    <CardContent className="p-4 h-full flex flex-col justify-between">
                      <div>
                        <div className="text-2xl mb-2 opacity-60">{trip.image || '📸'}</div>
                        <h4 className="font-bold text-white/80 text-sm mb-1 line-clamp-2">{trip.name}</h4>
                        <p className="text-white/50 text-xs mb-2">{trip.dates}</p>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {trip.locations.slice(0, 2).map((location: string, idx: number) => (
                            <Badge key={idx} variant="secondary" className="text-xs bg-white/10 text-white/60 border-white/20">
                              {location}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center text-xs text-white/50">
                          <Users className="h-3 w-3 mr-1" />
                          {trip.people} people
                        </div>
                        <Badge className="text-xs bg-white/10 text-white/60 border-white/20">
                          completed
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              
              {activeItineraries.filter(trip => trip.status === 'completed').length > 3 && (
                <div className="absolute bottom-0 right-0 bg-white/10 backdrop-blur-md rounded-full px-3 py-1 text-xs text-white/60 border border-white/20">
                  +{activeItineraries.filter(trip => trip.status === 'completed').length - 3} more
                </div>
              )}
              
              {activeItineraries.filter(trip => trip.status === 'completed').length === 0 && (
                <div className="text-center py-8 text-white/50">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">No past trips yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Section - Quick Actions & Controls (50%) */}
          <div className="col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Travel Hub</h2>
              <div className="flex gap-2">
                <Button 
                  size="sm"
                  onClick={() => navigate('/create-itinerary')}
                  className="gold-gradient hover:opacity-90 text-[#171821] font-semibold"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  AI Trip
                </Button>
                <Button 
                  size="sm"
                  variant="outline"
                  onClick={() => navigate('/create-manual-itinerary')}
                  className="border-white/50 text-white hover:bg-white/10"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Manual
                </Button>
              </div>
            </div>

            {/* Browse All Trips Card */}
            <Card 
              className="mb-6 bg-gradient-to-r from-white/10 via-white/5 to-transparent backdrop-blur-md border-white/30 cursor-pointer hover:shadow-2xl hover:shadow-white/20 transition-all duration-300 group"
              onClick={() => setShowTripBrowser(true)}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:scale-105 transition-transform duration-300">
                      Browse All Trips
                    </h3>
                    <p className="text-white/70">Swipe through your travel collection</p>
                    <div className="flex items-center space-x-4 mt-3">
                      <div className="flex items-center text-sm text-white/70">
                        <Calendar className="h-4 w-4 mr-1" />
                        {activeItineraries.filter(trip => ['planning', 'upcoming', 'active'].includes(trip.status)).length} upcoming
                      </div>
                      <div className="flex items-center text-sm text-white/70">
                        <Clock className="h-4 w-4 mr-1" />
                        {activeItineraries.filter(trip => trip.status === 'completed').length} completed
                      </div>
                    </div>
                  </div>
                  <div className="text-4xl group-hover:scale-110 transition-transform duration-300">
                    🗂️
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="hover:shadow-2xl hover:shadow-white/20 transition-all duration-300 cursor-pointer bg-[#171821]/80 backdrop-blur-md border-white/30 group">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-white/20 p-2 rounded-full group-hover:scale-105 transition-transform duration-300">
                      <Plane className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-sm">Book Flight</h3>
                      <p className="text-xs text-white/70">Find deals</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-2xl hover:shadow-white/20 transition-all duration-300 cursor-pointer bg-[#171821]/80 backdrop-blur-md border-white/30 group">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-white/20 p-2 rounded-full group-hover:scale-105 transition-transform duration-300">
                      <Map className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-sm">Explore</h3>
                      <p className="text-xs text-white/70">Destinations</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-2xl hover:shadow-white/20 transition-all duration-300 cursor-pointer bg-[#171821]/80 backdrop-blur-md border-white/30 group">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-white/20 p-2 rounded-full group-hover:scale-105 transition-transform duration-300">
                      <BarChart3 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-sm">Budget</h3>
                      <p className="text-xs text-white/70">Analysis</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-2xl hover:shadow-white/20 transition-all duration-300 cursor-pointer bg-[#171821]/80 backdrop-blur-md border-white/30 group">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-white/20 p-2 rounded-full group-hover:scale-105 transition-transform duration-300">
                      <Star className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-sm">Reviews</h3>
                      <p className="text-xs text-white/70">Rate trips</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="mt-6 bg-[#171821]/80 backdrop-blur-md border-white/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-white">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 text-sm">
                    <Clock className="h-4 w-4 text-white/70" />
                    <span className="text-white/70">Updated Singapore trip budget</span>
                    <span className="text-white/50">2h ago</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <Clock className="h-4 w-4 text-white/70" />
                    <span className="text-white/70">Added hotel to Europe trip</span>
                    <span className="text-white/50">1d ago</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <Clock className="h-4 w-4 text-white/70" />
                    <span className="text-white/70">Created new itinerary</span>
                    <span className="text-white/50">3d ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Trip Browser Modal - Tinder-like Interface */}
        {showTripBrowser && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="relative w-full max-w-md">
              {/* Close Button */}
              <Button
                variant="ghost"
                size="sm"
                className="absolute -top-12 right-0 text-white hover:bg-white/10 z-10"
                onClick={() => setShowTripBrowser(false)}
              >
                <X className="h-5 w-5" />
              </Button>

              {/* Trip Counter */}
              <div className="absolute -top-12 left-0 text-white/70 text-sm">
                {currentTripIndex + 1} of {activeItineraries.length}
              </div>

              {/* Main Trip Card */}
              {activeItineraries.length > 0 && (
                <Card className="w-full aspect-[3/4] bg-gradient-to-br from-white/15 via-white/10 to-transparent backdrop-blur-md border border-white/30 animate-scale-in">
                  <CardContent className="p-6 h-full flex flex-col justify-between">
                    <div>
                      <div className="text-6xl mb-4 text-center">
                        {activeItineraries[currentTripIndex]?.image || '✈️'}
                      </div>
                      <h2 className="text-2xl font-bold text-white mb-2 text-center">
                        {activeItineraries[currentTripIndex]?.name}
                      </h2>
                      <p className="text-white/70 text-center mb-4">
                        {activeItineraries[currentTripIndex]?.dates}
                      </p>
                      
                      <div className="space-y-3 mb-6">
                        <div className="flex items-center text-white/70">
                          <Map className="h-4 w-4 mr-2" />
                          <span className="text-sm">
                            {activeItineraries[currentTripIndex]?.locations.join(" → ") || "Destinations TBD"}
                          </span>
                        </div>
                        <div className="flex items-center text-white/70">
                          <Users className="h-4 w-4 mr-2" />
                          <span className="text-sm">
                            {activeItineraries[currentTripIndex]?.people} {activeItineraries[currentTripIndex]?.people === 1 ? 'person' : 'people'}
                          </span>
                        </div>
                      </div>
                      
                      {activeItineraries[currentTripIndex]?.budget > 0 && (
                        <div className="mb-6">
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-white/70">Budget</span>
                            <span className="font-medium text-white">
                              ${activeItineraries[currentTripIndex]?.spent.toLocaleString()} / ${activeItineraries[currentTripIndex]?.budget.toLocaleString()}
                            </span>
                          </div>
                          <Progress 
                            value={activeItineraries[currentTripIndex]?.budget > 0 ? (activeItineraries[currentTripIndex]?.spent / activeItineraries[currentTripIndex]?.budget) * 100 : 0} 
                            className="h-2" 
                          />
                        </div>
                      )}

                      <Badge 
                        className={`${
                          activeItineraries[currentTripIndex]?.status === 'active' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                          activeItineraries[currentTripIndex]?.status === 'upcoming' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                          activeItineraries[currentTripIndex]?.status === 'planning' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                          'bg-white/20 text-white/60 border-white/30'
                        }`}
                      >
                        {activeItineraries[currentTripIndex]?.status}
                      </Badge>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-3">
                      {activeItineraries[currentTripIndex]?.status !== 'completed' ? (
                        <>
                          <Button 
                            variant="outline" 
                            className="flex-1 border-white/50 text-white hover:bg-white/10"
                            onClick={() => navigate('/create-itinerary')}
                          >
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Edit Trip
                          </Button>
                          <Button 
                            className="flex-1 bg-white/20 hover:bg-white/30 text-white border-white/30"
                            onClick={() => navigate(`/itinerary?id=${activeItineraries[currentTripIndex]?.id}`)}
                          >
                            View Details
                          </Button>
                        </>
                      ) : (
                        <Button 
                          className="w-full bg-white/10 hover:bg-white/15 text-white/70 border-white/20"
                          onClick={() => navigate(`/itinerary?id=${activeItineraries[currentTripIndex]?.id}`)}
                        >
                          View Memories
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Navigation Controls */}
              <div className="flex justify-center space-x-4 mt-6">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/10 p-3 rounded-full"
                  onClick={() => setCurrentTripIndex((prev) => prev > 0 ? prev - 1 : activeItineraries.length - 1)}
                  disabled={activeItineraries.length <= 1}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/10 p-3 rounded-full"
                  onClick={() => setCurrentTripIndex((prev) => prev < activeItineraries.length - 1 ? prev + 1 : 0)}
                  disabled={activeItineraries.length <= 1}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>

              {/* Swipe Indicators */}
              <div className="flex justify-center space-x-2 mt-4">
                {activeItineraries.map((_, index) => (
                  <button
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all duration-200 ${
                      index === currentTripIndex ? 'bg-white' : 'bg-white/30'
                    }`}
                    onClick={() => setCurrentTripIndex(index)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
