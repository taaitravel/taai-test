
import { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plane, MapPin, Calendar, Users, DollarSign, ArrowLeft, Edit, Share2, Download, User, Plus, UserPlus, Clock, Star } from "lucide-react";
import Map from "@/components/Map";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ItineraryStackedSection, FlightCardRenderer, HotelCardRenderer, ActivityCardRenderer, ReservationCardRenderer } from "@/components/itinerary/ItineraryStackedSection";
import { ItineraryBrowser } from "@/components/itinerary/ItineraryBrowser";
import { BudgetPieChart } from "@/components/itinerary/BudgetPieChart";

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
  
  // Browser states
  const [flightBrowserOpen, setFlightBrowserOpen] = useState(false);
  const [hotelBrowserOpen, setHotelBrowserOpen] = useState(false);
  const [activityBrowserOpen, setActivityBrowserOpen] = useState(false);
  const [reservationBrowserOpen, setReservationBrowserOpen] = useState(false);
  
  // Current indices for browsers
  const [currentFlightIndex, setCurrentFlightIndex] = useState(0);
  const [currentHotelIndex, setCurrentHotelIndex] = useState(0);
  const [currentActivityIndex, setCurrentActivityIndex] = useState(0);
  const [currentReservationIndex, setCurrentReservationIndex] = useState(0);

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

        {/* Trip Overview & Map Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Trip Overview & Attendees */}
          <div className="space-y-4">
            <Card className="bg-[#171821]/80 border-white/30 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <MapPin className="h-5 w-5 text-white" />
                  <span>Trip Overview</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-3 text-sm">
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
                      <Badge key={index} className="bg-white/20 text-white border-white/30 text-xs">
                        {destination}
                      </Badge>
                    ))}
                  </div>
                </div>

                {itineraryData.itin_desc && (
                  <div>
                    <span className="text-white/70 text-sm">Description:</span>
                    <p className="text-white mt-1 text-xs">{itineraryData.itin_desc}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Trip Attendees */}
            <Card className="bg-[#171821]/80 border-white/30 backdrop-blur-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center space-x-2">
                    <Users className="h-5 w-5 text-white" />
                    <span>Attendees</span>
                  </CardTitle>
                  <Button 
                    size="sm" 
                    className="gold-gradient hover:opacity-90 text-[#171821] font-semibold text-xs px-2 py-1 h-7"
                    onClick={() => console.log('Invite more people')}
                  >
                    <UserPlus className="h-3 w-3 mr-1" />
                    Invite
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {itineraryData.attendees && itineraryData.attendees.slice(0, 2).map((attendee) => (
                  <div key={attendee.id} className="flex items-center space-x-2 p-2 bg-white/10 rounded-lg border border-white/20">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm">
                      {attendee.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white truncate">{attendee.name}</p>
                      <p className="text-xs text-white/60 truncate">{attendee.email}</p>
                    </div>
                    <Badge className={`text-xs px-2 py-0.5 ${attendee.status === 'confirmed' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-white/20 text-white border-white/30'}`}>
                      {attendee.status}
                    </Badge>
                  </div>
                ))}
                {itineraryData.attendees && itineraryData.attendees.length > 2 && (
                  <div className="text-center pt-1">
                    <span className="text-xs text-white/60">+{itineraryData.attendees.length - 2} more</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Map Section - Takes 2/3 */}
          <div className="lg:col-span-2">
            <Card className="bg-[#171821]/80 border-white/30 backdrop-blur-md h-full">
              <CardHeader>
                <CardTitle className="text-white">Trip Map</CardTitle>
                <CardDescription className="text-white/70">
                  Explore your destinations and discover nearby attractions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96 rounded-lg overflow-hidden">
                  <Map 
                    locations={itineraryData.itin_map_locations || []} 
                    locationNames={itineraryData.itin_locations || []}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Stacked Cards Section */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {/* Flights */}
          <div>
            <ItineraryStackedSection
              title="Flights"
              icon={Plane}
              items={itineraryData.flights || []}
              onCardClick={(index) => {
                setCurrentFlightIndex(index);
                setFlightBrowserOpen(true);
              }}
              renderCard={FlightCardRenderer}
              emptyMessage="No flights booked"
            />
          </div>
          
          {/* Hotels */}
          <div>
            <ItineraryStackedSection
              title="Hotels"
              icon={MapPin}
              items={itineraryData.hotels || []}
              onCardClick={(index) => {
                setCurrentHotelIndex(index);
                setHotelBrowserOpen(true);
              }}
              renderCard={HotelCardRenderer}
              emptyMessage="No hotels booked"
            />
          </div>

          {/* Activities */}
          <div>
            <ItineraryStackedSection
              title="Activities"
              icon={Calendar}
              items={itineraryData.activities || []}
              onCardClick={(index) => {
                setCurrentActivityIndex(index);
                setActivityBrowserOpen(true);
              }}
              renderCard={ActivityCardRenderer}
              emptyMessage="No activities planned"
            />
          </div>
          
          {/* Reservations */}
          <div>
            <ItineraryStackedSection
              title="Reservations"
              icon={Clock}
              items={itineraryData.reservations || []}
              onCardClick={(index) => {
                setCurrentReservationIndex(index);
                setReservationBrowserOpen(true);
              }}
              renderCard={ReservationCardRenderer}
              emptyMessage="No reservations made"
            />
          </div>
        </div>

        {/* Essential Metrics & Daily Schedule */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Daily Itinerary */}
          <div className="lg:col-span-2">
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

          {/* Sidebar with Budget & AI Recommendations */}
          <div className="space-y-6">
            {/* Budget Pie Chart */}
            <BudgetPieChart itineraryId={itineraryData.id} />

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

      {/* Browser Components */}
      <ItineraryBrowser
        isOpen={flightBrowserOpen}
        onClose={() => setFlightBrowserOpen(false)}
        items={itineraryData.flights || []}
        currentIndex={currentFlightIndex}
        onIndexChange={setCurrentFlightIndex}
        title="Flights"
        type="flights"
      />

      <ItineraryBrowser
        isOpen={hotelBrowserOpen}
        onClose={() => setHotelBrowserOpen(false)}
        items={itineraryData.hotels || []}
        currentIndex={currentHotelIndex}
        onIndexChange={setCurrentHotelIndex}
        title="Hotels"
        type="hotels"
      />

      <ItineraryBrowser
        isOpen={activityBrowserOpen}
        onClose={() => setActivityBrowserOpen(false)}
        items={itineraryData.activities || []}
        currentIndex={currentActivityIndex}
        onIndexChange={setCurrentActivityIndex}
        title="Activities"
        type="activities"
      />

      <ItineraryBrowser
        isOpen={reservationBrowserOpen}
        onClose={() => setReservationBrowserOpen(false)}
        items={itineraryData.reservations || []}
        currentIndex={currentReservationIndex}
        onIndexChange={setCurrentReservationIndex}
        title="Reservations"
        type="reservations"
      />
    </div>
  );
};

export default Itinerary;
