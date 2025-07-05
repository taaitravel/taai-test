
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, User } from "lucide-react";
import AIReservationChat from "@/components/AIReservationChat";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface ItineraryData {
  name?: string;
  description?: string;
  dateStart?: string;
  dateEnd?: string;
  locations?: string[];
  mapLocations?: Array<{city: string, lat: number, lng: number}>;
  budget?: number;
  userType?: string;
  attendees?: Array<{id: number, name: string, email: string}>;
  flights?: Array<any>;
  hotels?: Array<any>;
  activities?: Array<any>;
  reservations?: Array<any>;
}

const CreateItinerary = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [itineraryData, setItineraryData] = useState<ItineraryData>({});
  const [isSaving, setIsSaving] = useState(false);

  const updateItineraryData = (updates: Partial<ItineraryData>) => {
    setItineraryData(prev => ({ ...prev, ...updates }));
  };

  const saveItinerary = async () => {
    if (!user) {
      toast.error("Please log in to save your itinerary");
      return;
    }

    if (!itineraryData.name || !itineraryData.dateStart || !itineraryData.dateEnd || !itineraryData.locations?.length) {
      toast.error("Please provide itinerary name, dates, and locations before saving");
      return;
    }

    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from('itinerary')
        .insert({
          userid: user.id,
          itin_name: itineraryData.name,
          itin_desc: itineraryData.description,
          itin_date_start: itineraryData.dateStart,
          itin_date_end: itineraryData.dateEnd,
          itin_locations: itineraryData.locations,
          itin_map_locations: itineraryData.mapLocations,
          budget: itineraryData.budget,
          user_type: itineraryData.userType || 'individual',
          attendees: itineraryData.attendees,
          flights: itineraryData.flights,
          hotels: itineraryData.hotels,
          activities: itineraryData.activities,
          reservations: itineraryData.reservations
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Itinerary saved successfully!");
      navigate(`/itinerary?id=${data.id}`);
    } catch (error) {
      console.error('Error saving itinerary:', error);
      toast.error("Failed to save itinerary. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#171821] flex flex-col">
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
            <div className="flex items-center">
            </div>
            <div className="flex items-center space-x-4">
              <Badge className="bg-white/20 text-white border-white/30">
                Master Traveler
              </Badge>
              <Button 
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10 p-2 rounded-full"
                onClick={() => navigate('/profile-setup')}
              >
                <User className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex flex-col max-w-6xl mx-auto w-full px-4 py-6">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Create Your Perfect Itinerary</h1>
          <p className="text-white/70">Let our AI assistant help you plan and book your entire trip</p>
        </div>

        {/* AI Reservation Chat - Full Featured */}
        <div className="flex-1 max-w-4xl mx-auto w-full">
          <AIReservationChat 
            itineraryData={itineraryData}
            onUpdateData={updateItineraryData}
            onSaveItinerary={saveItinerary}
            isSaving={isSaving}
          />
        </div>
      </div>
    </div>
  );
};

export default CreateItinerary;
