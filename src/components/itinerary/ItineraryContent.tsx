import { useState, useEffect } from "react";
import { ItineraryData } from "@/types/itinerary";
import { ItineraryInfoHeader } from "./ItineraryInfoHeader";
import { TripOverviewSection } from "./TripOverviewSection";
import { Map } from "@/components/Map";

import { ItineraryStackedCards } from "./ItineraryStackedCards";
import { DailyScheduleSection } from "./DailyScheduleSection";
import { ItinerarySidebar } from "./ItinerarySidebar";
import { AddItemDialog, ItemType } from "./AddItemDialog";

import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { useEnhancedCityFormatting } from "@/hooks/useEnhancedCityFormatting";
import { useExpediaMapSync } from "@/hooks/useExpediaMapSync";

interface ItineraryContentProps {
  itineraryData: ItineraryData;
  budgetRefreshTrigger: number;
  onFlightClick: (index: number) => void;
  onHotelClick: (index: number) => void;
  onActivityClick: (index: number) => void;
  onReservationClick: (index: number) => void;
  refreshMapData?: () => void;
}

export const ItineraryContent = ({
  itineraryData,
  budgetRefreshTrigger,
  onFlightClick,
  onHotelClick,
  onActivityClick,
  onReservationClick,
  refreshMapData,
}: ItineraryContentProps) => {
  const duration = Math.ceil(
    (new Date(itineraryData.itin_date_end).getTime() - 
     new Date(itineraryData.itin_date_start).getTime()) / (1000 * 60 * 60 * 24)
  );
  const destinations = itineraryData.itin_locations || [];
  const peopleCount = itineraryData.attendees ? itineraryData.attendees.length : 1;
  const { updateItineraryWithEnhancedCities } = useEnhancedCityFormatting();
  const { syncExpediaLocations, isUpdating } = useExpediaMapSync();

  // Local add modal state and handlers
  const [addOpen, setAddOpen] = useState(false);
  const [addType, setAddType] = useState<ItemType | null>(null);

  const openAdd = (type: ItemType) => {
    setAddType(type);
    setAddOpen(true);
  };

const handleAddSubmit = async (type: ItemType, item: any) => {
  const current = (itineraryData as any)[type] || [];
  const newArray = [...current, item];

  // Update map locations using Expedia coordinates or user-selected location
  const currentMap = Array.isArray(itineraryData.itin_map_locations) ? (itineraryData.itin_map_locations as any[]) : [];
  let updatedMap: any[] = currentMap;

  // Check for Expedia location data first, then fallback to user location
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
        city: label, 
        lat, 
        lng, 
        ...(category && { category }),
        ...(item?.expedia_property_id && { expedia_property_id: item.expedia_property_id })
      } as any];
    }
  }

  await supabase
    .from('itinerary')
    .update({ [type]: newArray, itin_map_locations: updatedMap })
    .eq('id', itineraryData.id);
  setAddOpen(false);
  // Ask parent hook to refetch
  refreshMapData?.();
};

  // Destination adding (upcoming trips only)
  const [newDest, setNewDest] = useState("");
  const isUpcoming = new Date(itineraryData.itin_date_start).getTime() > Date.now();
  const handleAddDestination = async () => {
    const raw = newDest.trim();
    if (!raw) return;

    // Use enhanced city formatting for proper display
    try {
      const { data, error } = await supabase.functions.invoke('enhance-city-formatting', { 
        body: { queries: [raw] } 
      });
      
      if (!error && data?.results?.length > 0) {
        const enhanced = data.results[0];
        const formattedName = enhanced.formattedName;
        const newMapLoc = { 
          city: formattedName, 
          lat: enhanced.lat, 
          lng: enhanced.lng,
          category: 'destination'
        };

        // Update readable list with formatted name
        const currentNames = Array.isArray(itineraryData.itin_locations) ? itineraryData.itin_locations : [];
        const updatedNames = Array.from(new Set([...currentNames, formattedName]));

        // Update map coords
        const currentMap = Array.isArray(itineraryData.itin_map_locations) ? itineraryData.itin_map_locations : [];
        const exists = currentMap.some((m) => m.city?.toLowerCase() === formattedName.toLowerCase());
        const updatedMap = exists ? currentMap : [...currentMap, newMapLoc];

        await supabase
          .from('itinerary')
          .update({ itin_locations: updatedNames, itin_map_locations: updatedMap })
          .eq('id', itineraryData.id);

        setNewDest("");
        refreshMapData?.();
      } else {
        // Fallback to basic approach
        const currentNames = Array.isArray(itineraryData.itin_locations) ? itineraryData.itin_locations : [];
        const updatedNames = Array.from(new Set([...currentNames, raw]));
        
        await supabase
          .from('itinerary')
          .update({ itin_locations: updatedNames })
          .eq('id', itineraryData.id);
        
        setNewDest("");
        refreshMapData?.();
      }
    } catch (e) {
      console.warn('Failed to add destination', e);
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
      <ItineraryInfoHeader itineraryData={itineraryData} />
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
        <div className="lg:col-span-2">
          <div className="border border-border rounded-xl overflow-hidden bg-background shadow-sm h-[390px]">
            <Map locations={itineraryData.itin_map_locations?.filter((loc: any) => 
              loc.category === 'destination' || !loc.category
            ) || []} />
          </div>
        </div>
        {isUpcoming && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Add destination city"
                value={newDest}
                onChange={(e) => setNewDest(e.target.value)}
                className="max-w-xs bg-white/90 border-gray-200 text-gray-900 placeholder:text-gray-500"
              />
              <Button onClick={handleAddDestination}>Add Destination</Button>
            </div>
            <div className="flex gap-2">
              {destinations.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleEnhanceExistingCities}
                  className="text-xs"
                >
                  Enhance City Formatting
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => syncExpediaLocations(itineraryData)}
                disabled={isUpdating}
                className="text-xs"
              >
                {isUpdating ? 'Syncing...' : 'Sync Expedia Locations'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Stacked Cards Section */}
      <ItineraryStackedCards
        itineraryData={itineraryData}
        onFlightClick={onFlightClick}
        onHotelClick={onHotelClick}
        onActivityClick={onActivityClick}
        onReservationClick={onReservationClick}
        onAddFlight={() => openAdd('flights')}
        onAddHotel={() => openAdd('hotels')}
        onAddActivity={() => openAdd('activities')}
        onAddReservation={() => openAdd('reservations')}
      />

      {/* Essential Metrics & Daily Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
<DailyScheduleSection
  startDate={itineraryData.itin_date_start}
  duration={duration}
  destinations={destinations}
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
    </div>
  );
};