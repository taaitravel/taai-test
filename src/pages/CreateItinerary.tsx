
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, User } from "lucide-react";
import AIReservationChat from "@/components/AIReservationChat";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { BookingCart } from "@/components/booking/BookingCart";
import { QuickAddToCart } from "@/components/booking/QuickAddToCart";
import { MobileNavigation } from "@/components/shared/MobileNavigation";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useEnhancedCityFormatting } from "@/hooks/useEnhancedCityFormatting";

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
  const { enhanceCityFormatting } = useEnhancedCityFormatting();
  const [itineraryData, setItineraryData] = useState<ItineraryData>({});
  const [isSaving, setIsSaving] = useState(false);
  const [savedItineraryId, setSavedItineraryId] = useState<string | null>(null);
  
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
      // Auto-format destination names before saving
      let finalLocations = itineraryData.locations || [];
      let finalMapLocations = itineraryData.mapLocations || [];
      try {
        if (finalLocations.length > 0) {
          const enhanced = await enhanceCityFormatting(finalLocations);
          if (enhanced.length > 0) {
            finalLocations = enhanced.map(e => e.formattedName);
            finalMapLocations = enhanced.map(e => ({ city: e.formattedName, lat: e.lat, lng: e.lng }));
          }
        }
      } catch {
        // Fall back to original values
      }

      const { data, error } = await supabase
        .from('itinerary')
        .insert({
          userid: user.id,
          itin_name: itineraryData.name,
          itin_desc: itineraryData.description,
          itin_date_start: itineraryData.dateStart,
          itin_date_end: itineraryData.dateEnd,
          itin_locations: finalLocations,
          itin_map_locations: finalMapLocations,
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
      setSavedItineraryId(data.id.toString());
      // Don't navigate immediately, let user use booking features
      // navigate(`/itinerary?id=${data.id}`);
    } catch (error) {
      console.error('Error saving itinerary:', error);
      toast.error("Failed to save itinerary. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navigation - Mobile Responsive */}
      <MobileNavigation 
        travelerLevel="Master Traveler"
        showBackButton={true}
        backPath="/home"
        backLabel="Back to Home"
        showProfileButton={true}
        showTripButtons={false}
      />

      {/* Main Content - Side by Side Chat Comparison */}
      <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-4 py-6">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Create Your Perfect Itinerary</h1>
          <p className="text-foreground/70">Compare our traditional booking assistant with the new TAAI Assistant</p>
        </div>

        {/* Two Column Layout for Chat Comparison */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Side - Traditional AI Reservation Chat */}
          <div className="flex flex-col">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center py-2 rounded-t-lg font-semibold">
              Traditional Booking Assistant
            </div>
            <div className="flex-1 border-2 border-blue-500/30 rounded-b-lg bg-secondary p-4">
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
            <div className="flex-1 border-2 border-orange-500/30 rounded-b-lg bg-secondary relative">
              <ChatInterface 
                context={`User is creating an itinerary. Current itinerary data: ${JSON.stringify(itineraryData)}`}
                placeholder="Ask TAAI about planning your perfect trip..."
                embedded={true}
                itineraryId={savedItineraryId || undefined}
              />
            </div>
          </div>
        </div>

        {/* Booking Section */}
        {savedItineraryId && (
          <div className="mt-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Book Your Trip</h2>
              <p className="text-white/70">Add items to cart, save price snapshots, or book individual items</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left - Quick Add to Cart */}
              <QuickAddToCart 
                itineraryId={savedItineraryId}
                onItemAdded={() => {
                  // Refresh cart when item is added
                }}
              />
              
              {/* Right - Booking Cart */}
              <BookingCart 
                itineraryId={savedItineraryId}
                onCartUpdate={(items) => {
                  console.log('Cart updated:', items);
                }}
              />
            </div>
          </div>
        )}

        {/* Save/Continue Button Section */}
        <div className="mt-6 text-center space-y-4">
          {!savedItineraryId ? (
            <Button
              onClick={saveItinerary}
              disabled={isSaving || !itineraryData.name}
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-8 py-3 rounded-lg font-semibold"
            >
              {isSaving ? "Saving..." : "Save Itinerary & Enable Booking"}
            </Button>
          ) : (
            <div className="space-y-2">
              <p className="text-white/70 text-sm">
                ✅ Itinerary saved! You can now add items to your booking cart above.
              </p>
              <Button
                onClick={() => navigate(`/itinerary?id=${savedItineraryId}`)}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-2 rounded-lg"
              >
                View Complete Itinerary
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateItinerary;
