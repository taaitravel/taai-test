
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, User } from "lucide-react";
import AIReservationChat from "@/components/AIReservationChat";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { MobileNavigation } from "@/components/shared/MobileNavigation";
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
  const location = useLocation();
  const { user } = useAuth();
  const [itineraryData, setItineraryData] = useState<ItineraryData>({});
  const [isSaving, setIsSaving] = useState(false);
  
  // Get prefilled message from navigation state
  const prefilledMessage = location.state?.prefilledMessage || null;

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
      {/* Navigation - Mobile Responsive */}
      <MobileNavigation 
        travelerLevel="Master Traveler"
        showBackButton={true}
        backPath="/dashboard"
        backLabel="Back to Dashboard"
        showProfileButton={true}
        showTripButtons={false}
      />

      {/* Main Content - Side by Side Chat Comparison */}
      <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-4 py-6">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Create Your Perfect Itinerary</h1>
          <p className="text-white/70">Compare our traditional booking assistant with the new TAAI Assistant</p>
        </div>

        {/* Two Column Layout for Chat Comparison */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Side - Traditional AI Reservation Chat */}
          <div className="flex flex-col">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center py-2 rounded-t-lg font-semibold">
              Traditional Booking Assistant
            </div>
            <div className="flex-1 border-2 border-blue-500/30 rounded-b-lg bg-black/20 p-4">
              <AIReservationChat 
                itineraryData={itineraryData}
                onUpdateData={updateItineraryData}
                onSaveItinerary={saveItinerary}
                isSaving={isSaving}
                prefilledMessage={prefilledMessage}
              />
            </div>
          </div>

          {/* Right Side - TAAI Assistant */}
          <div className="flex flex-col">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-center py-2 rounded-t-lg font-semibold">
              TAAI Assistant (NEW)
            </div>
            <div className="flex-1 border-2 border-orange-500/30 rounded-b-lg bg-black/20 relative">
              <ChatInterface 
                context={`User is creating an itinerary. Current itinerary data: ${JSON.stringify(itineraryData)}`}
                placeholder="Ask TAAI about planning your perfect trip..."
                embedded={true}
              />
            </div>
          </div>
        </div>

        {/* Save Button Section */}
        <div className="mt-6 text-center">
          <Button
            onClick={saveItinerary}
            disabled={isSaving || !itineraryData.name}
            className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-8 py-3 rounded-lg font-semibold"
          >
            {isSaving ? "Saving..." : "Save Itinerary"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreateItinerary;
