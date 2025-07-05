
import { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plane, MapPin, Calendar, Users, DollarSign, ArrowLeft, Edit, Share2, Download, User, Plus, UserPlus, Clock, Star } from "lucide-react";
import Map from "@/components/Map";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ItineraryData {
  id: number;
  itin_name: string;
  itin_desc: string;
  itin_date_start: string;
  itin_date_end: string;
  budget: number;
  spending: number;
  budget_rate: number;
  b_efficiency_rate: number;
  user_type: string;
  itin_locations: string[];
  itin_map_locations: Array<{ city: string; lat: number; lng: number }>;
  attendees: Array<{ id: number; name: string; email: string; avatar: string; status: string }>;
  flights: Array<{ airline: string; flight_number: string; departure: string; arrival: string; from: string; to: string; cost: number }>;
  hotels: Array<{ name: string; city: string; check_in: string; check_out: string; nights: number; cost: number; rating: number }>;
  activities: Array<{ name: string; city: string; date: string; cost: number; duration: string }>;
  reservations: Array<{ type: string; name: string; city: string; date: string; time: string; party_size: number }>;
}

const Itinerary = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const itineraryId = searchParams.get('id');
  const { toast } = useToast();
  const [itineraryData, setItineraryData] = useState<ItineraryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItinerary = async () => {
      try {
        let query = supabase.from('itinerary').select('*');
        
        if (itineraryId) {
          // Load specific itinerary by ID
          query = query.eq('id', parseInt(itineraryId));
        } else {
          // Get the first itinerary if no ID provided (for demo)
          query = query.limit(1);
        }
        
        const { data, error } = await query.single();

        if (error) throw error;

        // Transform the database data to match our interface
        const transformedData: ItineraryData = {
          ...data,
          itin_locations: data.itin_locations as string[],
          itin_map_locations: data.itin_map_locations as Array<{ city: string; lat: number; lng: number }>,
          attendees: data.attendees as Array<{ id: number; name: string; email: string; avatar: string; status: string }>,
          flights: data.flights as Array<{ airline: string; flight_number: string; departure: string; arrival: string; from: string; to: string; cost: number }>,
          hotels: data.hotels as Array<{ name: string; city: string; check_in: string; check_out: string; nights: number; cost: number; rating: number }>,
          activities: data.activities as Array<{ name: string; city: string; date: string; cost: number; duration: string }>,
          reservations: data.reservations as Array<{ type: string; name: string; city: string; date: string; time: string; party_size: number }>,
        };

        setItineraryData(transformedData);
      } catch (error) {
        console.error('Error fetching itinerary:', error);
        toast({
          title: "Error",
          description: "Failed to load itinerary data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchItinerary();
  }, [itineraryId, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#171821] flex items-center justify-center">
        <div className="text-center">
          <Plane className="h-12 w-12 text-white mx-auto mb-4 animate-pulse" />
          <p className="text-white/70">Loading your itinerary...</p>
        </div>
      </div>
    );
  }

  if (!itineraryData) {
    return (
      <div className="min-h-screen bg-[#171821] flex items-center justify-center">
        <div className="text-center">
          <Plane className="h-12 w-12 text-white mx-auto mb-4" />
          <p className="text-white/70">No itinerary found...</p>
        </div>
      </div>
    );
  }

  const duration = Math.ceil((new Date(itineraryData.itin_date_end).getTime() - new Date(itineraryData.itin_date_start).getTime()) / (1000 * 60 * 60 * 24));
  const destinations = itineraryData.itin_locations || [];
  const peopleCount = itineraryData.attendees ? itineraryData.attendees.length : 1;

  return (
    <div className="min-h-screen bg-[#171821]">
      {/* Navigation - Dashboard Header Style */}
      <nav className="bg-[#171821]/95 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/dashboard')}
                className="text-white hover:bg-white/10"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <img src="/lovable-uploads/1c94ff06-05c4-46fe-b015-481744bc6ce1.png" alt="TAAI Travel" className="h-[70px]" />
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" className="bg-white text-[#171821] border-white hover:bg-gradient-to-r hover:from-[hsl(351,85%,75%)] hover:via-[hsl(15,80%,70%)] hover:to-[hsl(25,75%,65%)] hover:text-white active:bg-gradient-to-r active:from-[hsl(351,85%,75%)] active:via-[hsl(15,80%,70%)] active:to-[hsl(25,75%,65%)] active:text-white transition-all duration-300">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm" className="bg-white text-[#171821] border-white hover:bg-gradient-to-r hover:from-[hsl(351,85%,75%)] hover:via-[hsl(15,80%,70%)] hover:to-[hsl(25,75%,65%)] hover:text-white active:bg-gradient-to-r active:from-[hsl(351,85%,75%)] active:via-[hsl(15,80%,70%)] active:to-[hsl(25,75%,65%)] active:text-white transition-all duration-300">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button 
                size="sm" 
                className="gold-gradient hover:opacity-90 text-[#171821] font-semibold"
                onClick={() => navigate(`/edit-itinerary?id=${itineraryData.id}`)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">{itineraryData.itin_name}</h1>
          <div className="flex justify-center items-center space-x-6 text-white/70">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>{new Date(itineraryData.itin_date_start).toLocaleDateString()} - {new Date(itineraryData.itin_date_end).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>{peopleCount} {peopleCount === 1 ? 'Traveler' : 'Travelers'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4" />
              <span>${Number(itineraryData.budget).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Trip Overview */}
            <Card className="bg-[#171821]/80 border-white/30 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <MapPin className="h-5 w-5 text-white" />
                  <span>Trip Overview</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-white/70">Duration:</span>
                    <p className="text-white font-medium">{duration} days</p>
                  </div>
                  <div>
                    <span className="text-white/70">Budget per person:</span>
                    <p className="text-white font-medium">${Math.round(Number(itineraryData.budget) / peopleCount).toLocaleString()}</p>
                  </div>
                </div>
                
                <div>
                  <span className="text-white/70 text-sm">Destinations:</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {destinations.map((destination, index) => (
                      <Badge key={index} className="bg-white/20 text-white border-white/30">
                        {destination}
                      </Badge>
                    ))}
                  </div>
                </div>

                {itineraryData.itin_desc && (
                  <div>
                    <span className="text-white/70 text-sm">Description:</span>
                    <p className="text-white mt-1">{itineraryData.itin_desc}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Map */}
            <Card className="bg-[#171821]/80 border-white/30 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-white">Trip Map</CardTitle>
                <CardDescription className="text-white/70">
                  Explore your destinations and discover nearby attractions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96 rounded-lg overflow-hidden">
                  <Map />
                </div>
              </CardContent>
            </Card>

            {/* Flights */}
            {itineraryData.flights && itineraryData.flights.length > 0 && (
              <Card className="bg-[#171821]/80 border-white/30 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-white flex items-center space-x-2">
                    <Plane className="h-5 w-5 text-white" />
                    <span>Flight Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {itineraryData.flights.map((flight, index) => (
                    <div key={index} className="p-4 bg-white/10 rounded-lg border border-white/20">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-white">{flight.airline} {flight.flight_number}</h4>
                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                          ${flight.cost}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-white/70">Departure:</p>
                          <p className="text-white">{flight.from} - {new Date(flight.departure).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-white/70">Arrival:</p>
                          <p className="text-white">{flight.to} - {new Date(flight.arrival).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Hotels */}
            {itineraryData.hotels && itineraryData.hotels.length > 0 && (
              <Card className="bg-[#171821]/80 border-white/30 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-white flex items-center space-x-2">
                    <MapPin className="h-5 w-5 text-white" />
                    <span>Accommodations</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {itineraryData.hotels.map((hotel, index) => (
                    <div key={index} className="p-4 bg-white/10 rounded-lg border border-white/20">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold text-white">{hotel.name}</h4>
                          <p className="text-white/70 text-sm">{hotel.city}</p>
                        </div>
                        <div className="text-right">
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 mb-1">
                            ${hotel.cost}
                          </Badge>
                          <div className="flex items-center text-yellow-400">
                            <Star className="h-4 w-4 fill-current" />
                            <span className="text-sm ml-1">{hotel.rating}</span>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-white/70">Check-in:</p>
                          <p className="text-white">{new Date(hotel.check_in).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-white/70">Check-out:</p>
                          <p className="text-white">{new Date(hotel.check_out).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <p className="text-white/70 text-sm mt-2">{hotel.nights} nights</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Activities */}
            {itineraryData.activities && itineraryData.activities.length > 0 && (
              <Card className="bg-[#171821]/80 border-white/30 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-white flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-white" />
                    <span>Planned Activities</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {itineraryData.activities.map((activity, index) => (
                    <div key={index} className="p-4 bg-white/10 rounded-lg border border-white/20">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold text-white">{activity.name}</h4>
                          <p className="text-white/70 text-sm">{activity.city}</p>
                        </div>
                        <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                          ${activity.cost}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-white/70">Date:</p>
                          <p className="text-white">{new Date(activity.date).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-white/70">Duration:</p>
                          <p className="text-white">{activity.duration}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Reservations */}
            {itineraryData.reservations && itineraryData.reservations.length > 0 && (
              <Card className="bg-[#171821]/80 border-white/30 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-white flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-white" />
                    <span>Reservations</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {itineraryData.reservations.map((reservation, index) => (
                    <div key={index} className="p-4 bg-white/10 rounded-lg border border-white/20">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold text-white">{reservation.name}</h4>
                          <p className="text-white/70 text-sm">{reservation.city}</p>
                        </div>
                        <Badge className={`text-xs ${reservation.type === 'restaurant' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'}`}>
                          {reservation.type}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-white/70">Date & Time:</p>
                          <p className="text-white">{new Date(reservation.date).toLocaleDateString()} at {reservation.time}</p>
                        </div>
                        <div>
                          <p className="text-white/70">Party Size:</p>
                          <p className="text-white">{reservation.party_size} {reservation.party_size === 1 ? 'person' : 'people'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Daily Itinerary */}
            <Card className="bg-[#171821]/80 border-white/30 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-white">Daily Schedule</CardTitle>
                <CardDescription className="text-white/70">
                  Your day-by-day travel plan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.from({ length: duration }, (_, index) => {
                    const currentDate = new Date(itineraryData.itin_date_start);
                    currentDate.setDate(currentDate.getDate() + index);
                    const destination = destinations[index % destinations.length];
                    
                    return (
                      <div key={index} className="border-l-2 border-white/30 pl-4 pb-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-white">
                            Day {index + 1} - {currentDate.toLocaleDateString()}
                          </h4>
                          <Badge className="bg-white/20 text-white border-white/30">
                            {destination}
                          </Badge>
                        </div>
                        <div className="text-sm text-white/70 space-y-1">
                          <p>🏨 Check accommodation availability</p>
                          <p>✈️ Review flight details</p>
                          <p>🍽️ Explore local dining options</p>
                          <p>🎯 Discover activities and attractions</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Trip Attendees */}
            <Card className="bg-[#171821]/80 border-white/30 backdrop-blur-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center space-x-2">
                    <Users className="h-5 w-5 text-white" />
                    <span>Trip Attendees</span>
                  </CardTitle>
                  <Button 
                    size="sm" 
                    className="gold-gradient hover:opacity-90 text-[#171821] font-semibold"
                    onClick={() => console.log('Invite more people')}
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    Invite
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {itineraryData.attendees && itineraryData.attendees.map((attendee) => (
                  <div key={attendee.id} className="flex items-center space-x-3 p-3 bg-white/10 rounded-lg border border-white/20">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-lg">
                      {attendee.avatar}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{attendee.name}</p>
                      <p className="text-xs text-white/60">{attendee.email}</p>
                    </div>
                    <Badge className={`text-xs ${attendee.status === 'confirmed' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-white/20 text-white border-white/30'}`}>
                      {attendee.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Budget Breakdown */}
            <Card className="bg-[#171821]/80 border-white/30 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-white" />
                  <span>Budget Breakdown</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/70">Flights</span>
                    <span className="text-white font-medium">
                      ${itineraryData.flights ? itineraryData.flights.reduce((sum, flight) => sum + flight.cost, 0).toLocaleString() : '0'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/70">Accommodation</span>
                    <span className="text-white font-medium">
                      ${itineraryData.hotels ? itineraryData.hotels.reduce((sum, hotel) => sum + hotel.cost, 0).toLocaleString() : '0'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/70">Activities</span>
                    <span className="text-white font-medium">
                      ${itineraryData.activities ? itineraryData.activities.reduce((sum, activity) => sum + activity.cost, 0).toLocaleString() : '0'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/70">Budget Efficiency</span>
                    <span className="text-white font-medium">{Math.round(itineraryData.budget_rate * 100)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/70">Spending vs Budget</span>
                    <span className="text-white font-medium">${itineraryData.spending ? itineraryData.spending.toLocaleString() : '0'}</span>
                  </div>
                  <hr className="border-white/20" />
                  <div className="flex justify-between font-semibold">
                    <span className="text-white">Total Budget</span>
                    <span className="text-white">${Number(itineraryData.budget).toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Recommendations */}
            <Card className="bg-[#171821]/80 border-white/30 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-white">AI Recommendations</CardTitle>
                <CardDescription className="text-white/70">
                  Personalized suggestions for your trip
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-white/10 rounded-lg border border-white/20">
                  <p className="text-sm font-medium text-white">🏨 Best Time to Book</p>
                  <p className="text-sm text-white/70 mt-1">
                    Book your hotels 2-3 weeks before travel for optimal rates in Europe.
                  </p>
                </div>
                <div className="p-3 bg-white/10 rounded-lg border border-white/20">
                  <p className="text-sm font-medium text-white">🍽️ Local Cuisine</p>
                  <p className="text-sm text-white/70 mt-1">
                    Try paella in Barcelona, pasta in Rome, and croissants in Paris.
                  </p>
                </div>
                <div className="p-3 bg-white/10 rounded-lg border border-white/20">
                  <p className="text-sm font-medium text-white">🚇 Transportation</p>
                  <p className="text-sm text-white/70 mt-1">
                    Consider getting a Eurail pass for convenient travel between cities.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Itinerary;
