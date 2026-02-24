import { useState, useEffect, useRef } from "react";
import { ItineraryData } from "@/types/itinerary";
import { ItineraryInfoHeader } from "./ItineraryInfoHeader";
import { TripOverviewSection } from "./TripOverviewSection";
import { Map } from "@/components/Map";

import { ItineraryStackedCards } from "./ItineraryStackedCards";
import { DailyScheduleSection } from "./DailyScheduleSection";
import { ItineraryCalendarView } from "./ItineraryCalendarView";
import { ItinerarySidebar } from "./ItinerarySidebar";
import { AddItemDialog, ItemType } from "./AddItemDialog";
import { AddDestinationDialog } from "./AddDestinationDialog";

import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { List, CalendarDays } from "lucide-react";

import { useEnhancedCityFormatting } from "@/hooks/useEnhancedCityFormatting";
import { useExpediaMapSync } from "@/hooks/useExpediaMapSync";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/hooks/useAuthenticatedItineraryData";
import { toast } from "sonner";

interface ItineraryContentProps {
  itineraryData: ItineraryData;
  budgetRefreshTrigger: number;
  refreshBudgetData?: () => void;
  onFlightClick: (index: number) => void;
  onHotelClick: (index: number) => void;
  onActivityClick: (index: number) => void;
  onReservationClick: (index: number) => void;
  onEdit?: (type: any, index: number) => void;
  onDelete?: (type: string, index: number) => void;
  refreshMapData?: () => void;
  userRole?: UserRole;
}

export const ItineraryContent = ({
  itineraryData,
  budgetRefreshTrigger,
  refreshBudgetData,
  onFlightClick,
  onHotelClick,
  onActivityClick,
  onReservationClick,
  onEdit,
  onDelete,
  refreshMapData,
  userRole,
}: ItineraryContentProps) => {
  const duration = Math.ceil(
    (new Date(itineraryData.itin_date_end).getTime() - 
     new Date(itineraryData.itin_date_start).getTime()) / (1000 * 60 * 60 * 24)
  );
  const destinations = itineraryData.itin_locations || [];
  const peopleCount = itineraryData.attendees ? itineraryData.attendees.length : 1;
  const { updateItineraryWithEnhancedCities, enhanceCityFormatting } = useEnhancedCityFormatting();
  const { syncExpediaLocations, isUpdating } = useExpediaMapSync();
  const { user } = useAuth();
  const reminderTriggered = useRef(false);

  // Trigger reminder generation for upcoming itineraries
  useEffect(() => {
    if (!user || !itineraryData.id || reminderTriggered.current) return;
    const isUpcoming = new Date(itineraryData.itin_date_start).getTime() > Date.now() - 86400000;
    if (!isUpcoming) return;
    reminderTriggered.current = true;
    supabase.functions.invoke('generate-reminders', {
      body: { itinerary_id: itineraryData.id },
    }).catch(console.warn);
  }, [user, itineraryData.id]);

  // Local add modal state and handlers
  const [addOpen, setAddOpen] = useState(false);
  const [addType, setAddType] = useState<ItemType | null>(null);
  const [addDestinationOpen, setAddDestinationOpen] = useState(false);
  const [scheduleView, setScheduleView] = useState<'list' | 'calendar'>('list');

  const openAdd = (type: ItemType) => {
    setAddType(type);
    setAddOpen(true);
  };

const handleAddSubmit = async (type: ItemType, item: any) => {
  try {
    const current = (itineraryData as any)[type] || [];
    const newArray = [...current, item];

    const currentMap = Array.isArray(itineraryData.itin_map_locations) ? (itineraryData.itin_map_locations as any[]) : [];
    let updatedMap: any[] = currentMap;

    const expediaLoc = item?.expedia_data?.location || item?.location;
    const lat = expediaLoc?.latitude || expediaLoc?.lat;
    const lng = expediaLoc?.longitude || expediaLoc?.lng;
    
    if (lat && lng && typeof lat === 'number' && typeof lng === 'number') {
      const category = type === 'hotels' ? 'hotel' : type === 'activities' ? 'activity' : type === 'reservations' ? 'reservation' : undefined;
      const label = item?.name || expediaLoc?.name || item.city || '';
      const exists = currentMap.some((m: any) => 
        (Math.abs(m?.lat - lat) < 0.001 && Math.abs(m?.lng - lng) < 0.001) || 
        (m?.city || '').toLowerCase() === (label || '').toLowerCase()
      );
      if (!exists && label) {
        updatedMap = [...currentMap, { 
          city: label, lat, lng, 
          ...(category && { category }),
          ...(item?.expedia_property_id && { expedia_property_id: item.expedia_property_id })
        } as any];
      }
    }

    const { error } = await supabase
      .from('itinerary')
      .update({ [type]: newArray, itin_map_locations: updatedMap })
      .eq('id', itineraryData.id);
    if (error) throw error;
    setAddOpen(false);
    refreshMapData?.();
    refreshBudgetData?.();
  } catch (error: any) {
    console.error('Error adding item:', error);
    toast.error(error?.message?.includes('row-level security') 
      ? "You don't have permission to add items" 
      : "Failed to add item. Please try again.");
  }
};

  // Destination adding (upcoming trips only)
  const isUpcoming = new Date(itineraryData.itin_date_start).getTime() > Date.now();
  
  const isCollaborator = userRole === 'collaborator';

  const handleRemoveDestination = async (destinationToRemove: string) => {
    if (isCollaborator) {
      toast.error("Only the trip owner can remove destinations");
      return;
    }
    try {
      const currentNames = Array.isArray(itineraryData.itin_locations) ? itineraryData.itin_locations : [];
      const updatedNames = currentNames.filter(dest => dest !== destinationToRemove);
      const currentMap = Array.isArray(itineraryData.itin_map_locations) ? itineraryData.itin_map_locations : [];
      const updatedMap = currentMap.filter((loc: any) => loc.city !== destinationToRemove);
      
      const { error } = await supabase
        .from('itinerary')
        .update({ itin_locations: updatedNames, itin_map_locations: updatedMap })
        .eq('id', itineraryData.id);
      if (error) throw error;
      refreshMapData?.();
    } catch (e: any) {
      console.warn('Failed to remove destination', e);
      toast.error("Failed to remove destination");
    }
  };
  
  const handleAddDestination = async (cityName: string, lat: number, lng: number) => {
    if (isCollaborator) {
      toast.error("Only the trip owner can add destinations");
      return;
    }
    try {
      // Auto-format the city name via the enhance-city-formatting edge function
      let formattedName = cityName;
      let formattedLat = lat;
      let formattedLng = lng;
      try {
        const enhanced = await enhanceCityFormatting([cityName]);
        if (enhanced.length > 0) {
          formattedName = enhanced[0].formattedName;
          formattedLat = enhanced[0].lat;
          formattedLng = enhanced[0].lng;
        }
      } catch {
        // Fall back to original values
      }

      const newMapLoc = { 
        city: formattedName, lat: formattedLat, lng: formattedLng, category: 'destination'
      };

      const currentNames = Array.isArray(itineraryData.itin_locations) ? itineraryData.itin_locations : [];
      const updatedNames = Array.from(new Set([...currentNames, formattedName]));

      const currentMap = Array.isArray(itineraryData.itin_map_locations) ? itineraryData.itin_map_locations : [];
      const exists = currentMap.some((m) => m.city?.toLowerCase() === formattedName.toLowerCase());
      const updatedMap = exists ? currentMap : [...currentMap, newMapLoc];

      const { error } = await supabase
        .from('itinerary')
        .update({ itin_locations: updatedNames, itin_map_locations: updatedMap })
        .eq('id', itineraryData.id);
      if (error) throw error;
      refreshMapData?.();
    } catch (e) {
      console.warn('Failed to add destination', e);
      toast.error("Failed to add destination");
    }
  };

  // Enhanced city formatting button for existing destinations
  const handleEnhanceExistingCities = async () => {
    if (destinations.length > 0) {
      const success = await updateItineraryWithEnhancedCities(itineraryData.id, destinations);
      if (success) {
        refreshMapData?.();
      }
    }
  };

  // Removed auto-geocoding/sync of hotels/activities/reservations to map.
  // We now rely solely on stored itin_map_locations and explicit user-selected coordinates.


  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" role="main">
      <ItineraryInfoHeader itineraryData={itineraryData} userRole={userRole} />
      {/* Trip Overview & Map Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <TripOverviewSection
          duration={duration}
          budget={Number(itineraryData.budget)}
          peopleCount={peopleCount}
          destinations={destinations}
          description={itineraryData.itin_desc}
          onRemoveDestination={isCollaborator ? undefined : handleRemoveDestination}
          onAddDestination={isCollaborator ? undefined : () => setAddDestinationOpen(true)}
          isUpcoming={isUpcoming}
        />
        <div className="lg:col-span-2">
          <div className="border border-border rounded-xl overflow-hidden bg-background shadow-sm h-[390px]">
            <Map locations={itineraryData.itin_map_locations?.filter((loc: any) => 
              loc.category === 'destination' || !loc.category
            ) || []} />
          </div>
        </div>
      </div>

      {/* Stacked Cards Section */}
      <ItineraryStackedCards
        flights={itineraryData.flights || []}
        hotels={itineraryData.hotels || []}
        activities={itineraryData.activities || []}
        reservations={itineraryData.reservations || []}
        onFlightClick={onFlightClick}
        onHotelClick={onHotelClick}
        onActivityClick={onActivityClick}
        onReservationClick={onReservationClick}
        onAddFlight={() => openAdd('flights')}
        onAddHotel={() => openAdd('hotels')}
        onAddActivity={() => openAdd('activities')}
        onAddReservation={() => openAdd('reservations')}
        onEdit={onEdit}
        onDelete={onDelete}
      />

      {/* Essential Metrics & Daily Schedule */}
      <div className="flex items-center justify-end mb-2">
        <ToggleGroup
          type="single"
          value={scheduleView}
          onValueChange={(v) => v && setScheduleView(v as 'list' | 'calendar')}
          size="sm"
        >
          <ToggleGroupItem value="list" aria-label="List view">
            <List className="h-3.5 w-3.5 mr-1" /> List
          </ToggleGroupItem>
          <ToggleGroupItem value="calendar" aria-label="Calendar view">
            <CalendarDays className="h-3.5 w-3.5 mr-1" /> Calendar
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
{scheduleView === 'list' ? (
  <DailyScheduleSection
    startDate={itineraryData.itin_date_start}
    duration={duration}
    destinations={destinations}
    itineraryId={itineraryData.id}
    flights={itineraryData.flights || []}
    hotels={itineraryData.hotels || []}
    activities={itineraryData.activities || []}
    reservations={itineraryData.reservations || []}
    onViewItem={(type, index) => {
      if (type === 'flights') return onFlightClick(index);
      if (type === 'hotels') return onHotelClick(index);
      if (type === 'activities') return onActivityClick(index);
      if (type === 'reservations') return onReservationClick(index);
    }}
  />
) : (
  <ItineraryCalendarView
    startDate={itineraryData.itin_date_start}
    duration={duration}
    destinations={destinations}
    itineraryId={itineraryData.id}
    flights={itineraryData.flights || []}
    hotels={itineraryData.hotels || []}
    activities={itineraryData.activities || []}
    reservations={itineraryData.reservations || []}
    onViewItem={(type, index) => {
      if (type === 'flights') return onFlightClick(index);
      if (type === 'hotels') return onHotelClick(index);
      if (type === 'activities') return onActivityClick(index);
      if (type === 'reservations') return onReservationClick(index);
    }}
  />
)}
        <ItinerarySidebar 
          itineraryData={itineraryData} 
          refreshTrigger={budgetRefreshTrigger} 
        />
      </div>


      {/* Add Item Dialog */}
      <AddItemDialog
        open={addOpen}
        type={addType}
        onClose={() => setAddOpen(false)}
        onSubmit={handleAddSubmit}
        defaultCity={destinations[0] || ''}
        suggestions={{ cities: destinations }}
      />

      {/* Add Destination Dialog */}
      <AddDestinationDialog
        open={addDestinationOpen}
        onClose={() => setAddDestinationOpen(false)}
        onAdd={handleAddDestination}
      />
    </div>
  );
};