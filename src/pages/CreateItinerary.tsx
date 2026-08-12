
import { useState, useEffect, useRef } from "react";
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
import { useIsMobile } from "@/hooks/use-mobile";
import { normalizeResult } from "@/lib/itinerary/planning-draft";
import { PlanningDraftReview } from "@/components/itinerary/PlanningDraftReview";
import type {
  PlanningDraftItem,
  PlanningDraftResultType,
  ResultInteraction,
} from "@/types/planning-draft";
import type { Json } from "@/integrations/supabase/types";

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
  flights?: Json;
  hotels?: Json;
  activities?: Json;
  reservations?: Json;
}

const CreateItinerary = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { enhanceCityFormatting } = useEnhancedCityFormatting();
  const isMobile = useIsMobile();
  const [itineraryData, setItineraryData] = useState<ItineraryData>({});
  const [isSaving, setIsSaving] = useState(false);
  const [savedItineraryId, setSavedItineraryId] = useState<string | null>(null);
  const savingRef = useRef(false);
  const creationKeyRef = useRef(crypto.randomUUID());
  // In-memory Bob planning draft. Not persisted — refresh/navigation clears it.
  const [draft, setDraft] = useState<PlanningDraftItem[]>([]);

  const addToDraft = (resultType: PlanningDraftResultType, raw: unknown) => {
    const normalized = normalizeResult(resultType, raw);
    if (!normalized) return;
    setDraft((prev) =>
      prev.some((d) => d.draftId === normalized.draftId) ? prev : [...prev, normalized],
    );
  };
  const removeFromDraft = (draftId: string) => {
    setDraft((prev) => prev.filter((d) => d.draftId !== draftId));
  };

  const bobInteraction: ResultInteraction = {
    mode: 'planning-draft',
    selectedDraftIds: new Set(draft.map((d) => d.draftId)),
    onAddToDraft: addToDraft,
    onRemoveFromDraft: removeFromDraft,
  };
  
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

    if (savingRef.current) return;

    savingRef.current = true;
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
          planned_traveler_count: Math.max(itineraryData.attendees?.length || 1, 1),
          creation_key: creationKeyRef.current,
          user_type: itineraryData.userType || 'individual',
          attendees: itineraryData.attendees,
          flights: itineraryData.flights,
          hotels: itineraryData.hotels,
          activities: itineraryData.activities,
          reservations: itineraryData.reservations
        })
        .select()
        .single();

      if (error) {
        const { data: existing } = await supabase
          .from('itinerary')
          .select('id')
          .eq('creation_key', creationKeyRef.current)
          .maybeSingle();
        if (existing) {
          setSavedItineraryId(existing.id.toString());
          return;
        }
        throw error;
      }

      toast.success("Itinerary saved successfully!");
      setSavedItineraryId(data.id.toString());
      // Don't navigate immediately, let user use booking features
      // navigate(`/itinerary?id=${data.id}`);
    } catch (error) {
      console.error('Error saving itinerary:', error);
      toast.error("Failed to save itinerary. Please try again.");
    } finally {
      savingRef.current = false;
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

      {isMobile ? (
        <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-4 py-4 pb-4 min-h-0">
          <div className="text-center mb-4">
            <h1 className="text-2xl font-bold text-foreground mb-1">Plan with Bob</h1>
            <p className="text-sm text-foreground/70">Your Create Itinerary specialist</p>
          </div>
          <div className="flex-1 min-h-0 flex flex-col border border-primary/40 rounded-lg bg-secondary relative">
            <ChatInterface
              context={`User is creating an itinerary. Current itinerary data: ${JSON.stringify(itineraryData)}`}
              placeholder="Ask Bob about planning your perfect trip..."
              embedded={true}
              itineraryId={savedItineraryId || undefined}
              assistantName="Bob"
              assistantKey="bob"
              assistantSubtitle="Create Itinerary specialist"
              greeting="Hi, I'm Bob — your Create Itinerary specialist. Tell me where you want to go, when, and what matters most."
              chatMode="planning"
              mobileComposerAssist
              interaction={bobInteraction}
            />
          </div>
          <PlanningDraftReview items={draft} onRemove={removeFromDraft} />
        </div>
      ) : (
        <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-4 py-6 md:pb-6">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-foreground mb-2">Create Your Perfect Itinerary</h1>
            <p className="text-foreground/70">Compare our traditional booking assistant with the new TAAI Assistant</p>
          </div>

          {/* Two Column Layout for Chat Comparison */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Side - Traditional AI Reservation Chat */}
            <div className="flex flex-col">
              <div className="bg-muted text-foreground text-center py-2 rounded-t-lg font-medium text-sm border border-border border-b-0">
                Classic booking assistant
              </div>
              <div className="flex-1 border border-border rounded-b-lg bg-secondary p-4">
                <AIReservationChat 
                  itineraryData={itineraryData as never}
                  onUpdateData={updateItineraryData}
                  onSaveItinerary={saveItinerary}
                  isSaving={isSaving}
                  prefilledMessage={prefilledMessage}
                />
              </div>
            </div>

            <div className="flex flex-col">
              <div className="bg-primary text-primary-foreground text-center py-2 rounded-t-lg font-semibold text-sm border border-primary border-b-0">
                Bob · Create Itinerary specialist
              </div>
              <div className="flex-1 border border-primary/40 rounded-b-lg bg-secondary relative">
                <ChatInterface 
                  context={`User is creating an itinerary. Current itinerary data: ${JSON.stringify(itineraryData)}`}
                  placeholder="Ask Bob about planning your perfect trip..."
                  embedded={true}
                  itineraryId={savedItineraryId || undefined}
                  assistantName="Bob"
                  assistantKey="bob"
                  assistantSubtitle="Create Itinerary specialist"
                  greeting="Hi, I'm Bob — your Create Itinerary specialist. Tell me where you want to go, when, and what matters most."
                  chatMode="planning"
                  interaction={bobInteraction}
                />
              </div>
            </div>
          </div>

          {/* Booking Section */}
          {savedItineraryId && (
            <div className="mt-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-foreground mb-2">Book Your Trip</h2>
                <p className="text-foreground/70">Add items to cart, save price snapshots, or book individual items</p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <QuickAddToCart 
                  itineraryId={savedItineraryId}
                  onItemAdded={() => {}}
                />
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
                <p className="text-foreground/70 text-sm">
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
      )}
    </div>
  );
};

export default CreateItinerary;
