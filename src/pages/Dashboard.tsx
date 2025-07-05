
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Plane, Plus, Calendar, Map, BarChart3, MessageCircle, Users, Clock, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import WorldMap from "@/components/WorldMap";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeItineraries, setActiveItineraries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const planeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchUserItineraries();
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

      setActiveItineraries(transformedItineraries);
    } catch (error) {
      console.error('Error fetching itineraries:', error);
      toast.error('Failed to load your trips');
    } finally {
      setLoading(false);
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

  const userStats = {
    totalTrips: 12,
    countriesVisited: 18,
    totalSpent: 45000,
    flightsThisYear: 24,
    travelerLevel: "Master Traveler"
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

  const visitedCountries = ['France', 'Italy', 'Spain', 'United States', 'Japan', 'United Kingdom', 'Germany', 'Australia', 'Brazil', 'Canada', 'Mexico', 'Thailand', 'Greece', 'Turkey', 'Egypt', 'Morocco', 'India', 'China'];

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
                Welcome back, John! ✈️
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                  <p className="text-2xl font-bold text-white group-hover:scale-105 transition-transform duration-300">{userStats.countriesVisited}</p>
                </div>
                <Map className="h-8 w-8 text-white group-hover:scale-105 transition-transform duration-300" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <WorldMap visitedCountries={visitedCountries} />
            </CardContent>
          </Card>

          {/* Flights This Year */}
          <Card className="border-white/30 hover:shadow-2xl hover:shadow-white/20 transition-all duration-300 bg-[#171821]/80 backdrop-blur-md group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/70">Flights This Year</p>
                  <p className="text-2xl font-bold text-white group-hover:scale-105 transition-transform duration-300">{userStats.flightsThisYear}</p>
                </div>
                <Plane className="h-8 w-8 text-white group-hover:scale-105 transition-transform duration-300" />
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

        {/* Active Itineraries */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Active Trips</h2>
              <div className="flex flex-col sm:flex-row gap-2">
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

            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <Plane className="h-12 w-12 text-white mx-auto mb-4 animate-pulse" />
                  <p className="text-white/70">Loading your trips...</p>
                </div>
              ) : activeItineraries.length === 0 ? (
                <Card className="bg-[#171821]/80 backdrop-blur-md border-white/30">
                  <CardContent className="p-8 text-center">
                    <Plane className="h-12 w-12 text-white/50 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">No trips yet</h3>
                    <p className="text-white/70 mb-4">Start planning your next adventure!</p>
                    <div className="flex flex-col gap-2">
                      <Button 
                        onClick={() => navigate('/create-itinerary')}
                        className="gold-gradient hover:opacity-90 text-[#171821] font-semibold"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create with AI
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => navigate('/create-manual-itinerary')}
                        className="border-white/50 text-white hover:bg-white/10"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Manually
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                activeItineraries.map((trip) => (
                  <Card key={trip.id} className="hover:shadow-2xl hover:shadow-white/20 transition-all duration-300 cursor-pointer bg-[#171821]/80 backdrop-blur-md border-white/30 group">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg text-white group-hover:scale-105 transition-transform duration-300">{trip.name}</CardTitle>
                          <CardDescription className="flex items-center space-x-2 mt-1 text-white/70">
                            <Calendar className="h-4 w-4" />
                            <span>{trip.dates}</span>
                          </CardDescription>
                        </div>
                        <Badge 
                          variant="secondary"
                          className={`${
                            trip.status === 'active' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                            trip.status === 'upcoming' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                            trip.status === 'planning' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                            'bg-white/20 text-white border-white/30'
                          }`}
                        >
                          {trip.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2 text-sm text-white/70">
                          <Map className="h-4 w-4" />
                          <span>{trip.locations.length > 0 ? trip.locations.join(" → ") : "Destinations TBD"}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2 text-sm text-white/70">
                          <Users className="h-4 w-4" />
                          <span>{trip.people} {trip.people === 1 ? 'person' : 'people'}</span>
                        </div>

                        {trip.budget > 0 && (
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-white/70">Budget Progress</span>
                              <span className="font-medium text-white">
                                ${trip.spent.toLocaleString()} / ${trip.budget.toLocaleString()}
                              </span>
                            </div>
                            <Progress value={trip.budget > 0 ? (trip.spent / trip.budget) * 100 : 0} className="h-2" />
                          </div>
                        )}

                        <div className="flex space-x-2 pt-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1 border-white/50 text-white hover:bg-white/10"
                            onClick={() => navigate('/create-itinerary')}
                          >
                            <MessageCircle className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            size="sm" 
                            className="flex-1 bg-white/20 hover:bg-white/30 text-white border-white/30"
                            onClick={() => navigate(`/itinerary?id=${trip.id}`)}
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Quick Actions & Recent Activity */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Quick Actions</h2>
            
            <div className="space-y-4">
              <Card className="hover:shadow-2xl hover:shadow-white/20 transition-all duration-300 cursor-pointer bg-[#171821]/80 backdrop-blur-md border-white/30 group">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="bg-white/20 p-3 rounded-full group-hover:scale-105 transition-transform duration-300">
                      <Plane className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white">Book a Flight</h3>
                      <p className="text-sm text-white/70">Find and compare flight options</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-2xl hover:shadow-white/20 transition-all duration-300 cursor-pointer bg-[#171821]/80 backdrop-blur-md border-white/30 group">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="bg-white/20 p-3 rounded-full group-hover:scale-105 transition-transform duration-300">
                      <Map className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white">Explore Destinations</h3>
                      <p className="text-sm text-white/70">Discover new places to visit</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-2xl hover:shadow-white/20 transition-all duration-300 cursor-pointer bg-[#171821]/80 backdrop-blur-md border-white/30 group">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="bg-white/20 p-3 rounded-full group-hover:scale-105 transition-transform duration-300">
                      <BarChart3 className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white">Budget Analysis</h3>
                      <p className="text-sm text-white/70">Review your travel spending</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="bg-[#171821]/80 backdrop-blur-md border-white/30">
                <CardHeader>
                  <CardTitle className="text-lg text-white">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 text-sm">
                      <Clock className="h-4 w-4 text-white/70" />
                      <span className="text-white/70">Updated Europe Trip budget</span>
                      <span className="text-white/50">2h ago</span>
                    </div>
                    <div className="flex items-center space-x-3 text-sm">
                      <Clock className="h-4 w-4 text-white/70" />
                      <span className="text-white/70">Added flight to NYC trip</span>
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
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
