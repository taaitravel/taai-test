
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plane, Calendar, Users, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ItineraryBrowser } from "@/components/itinerary/ItineraryBrowser";
import { ItineraryHeader } from "@/components/itinerary/ItineraryHeader";
import { TripOverviewSection } from "@/components/itinerary/TripOverviewSection";
import { ItineraryMapSection } from "@/components/itinerary/ItineraryMapSection";
import { ItineraryStackedCards } from "@/components/itinerary/ItineraryStackedCards";
import { DailyScheduleSection } from "@/components/itinerary/DailyScheduleSection";
import { ItinerarySidebar } from "@/components/itinerary/ItinerarySidebar";

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
      {/* Navigation Header */}
      <ItineraryHeader itineraryId={itineraryData.id} />

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
          <TripOverviewSection
            duration={duration}
            budget={Number(itineraryData.budget)}
            peopleCount={peopleCount}
            destinations={destinations}
            description={itineraryData.itin_desc}
            attendees={itineraryData.attendees}
          />
          <ItineraryMapSection
            mapLocations={itineraryData.itin_map_locations || []}
            locationNames={itineraryData.itin_locations || []}
          />
        </div>

        {/* Stacked Cards Section */}
        <ItineraryStackedCards
          itineraryData={itineraryData}
          onFlightClick={(index) => {
            setCurrentFlightIndex(index);
            setFlightBrowserOpen(true);
          }}
          onHotelClick={(index) => {
            setCurrentHotelIndex(index);
            setHotelBrowserOpen(true);
          }}
          onActivityClick={(index) => {
            setCurrentActivityIndex(index);
            setActivityBrowserOpen(true);
          }}
          onReservationClick={(index) => {
            setCurrentReservationIndex(index);
            setReservationBrowserOpen(true);
          }}
        />

        {/* Essential Metrics & Daily Schedule */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <DailyScheduleSection
            startDate={itineraryData.itin_date_start}
            duration={duration}
            destinations={destinations}
          />
          <ItinerarySidebar itineraryData={itineraryData} />
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
