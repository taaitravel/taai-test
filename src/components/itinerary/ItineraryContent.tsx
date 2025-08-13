import { useState, useEffect } from "react";
import { ItineraryData } from "@/types/itinerary";
import { ItineraryInfoHeader } from "./ItineraryInfoHeader";
import { TripOverviewSection } from "./TripOverviewSection";
import { ItineraryMapSection } from "./ItineraryMapSection";
import { ItineraryStackedCards } from "./ItineraryStackedCards";
import { DailyScheduleSection } from "./DailyScheduleSection";
import { ItinerarySidebar } from "./ItinerarySidebar";
import { AddItemDialog, ItemType } from "./AddItemDialog";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
  // Use only stored itinerary destination names for map geocoding (no assumptions)
  const derivedLocationNames = destinations;

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

  // Update map locations only if the user selected a precise location with coordinates
  const currentMap = Array.isArray(itineraryData.itin_map_locations) ? (itineraryData.itin_map_locations as any[]) : [];
  let updatedMap: any[] = currentMap;

  const loc = item?.location;
  if (loc && typeof loc.lat === 'number' && typeof loc.lng === 'number') {
    const category = type === 'hotels' ? 'hotel' : type === 'activities' ? 'activity' : type === 'reservations' ? 'reservation' : undefined;
    const label = loc.name || item.city || '';
    const exists = currentMap.some((m: any) => (m?.lat === loc.lat && m?.lng === loc.lng) || (m?.city || '').toLowerCase() === (label || '').toLowerCase());
    if (!exists && label) {
      updatedMap = [...currentMap, { city: label, lat: loc.lat, lng: loc.lng, category }];
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

    // Normalize destination using Mapbox via Edge Function
    let normalizedName = raw;
    let newMapLoc: { city: string; lat: number; lng: number } | null = null;
    try {
      const { data, error } = await supabase.functions.invoke('search-cities', { body: { query: raw } });
      if (!error && Array.isArray(data?.locations) && data.locations.length > 0) {
        const best = data.locations[0];
        normalizedName = best.fullName || best.city || raw;
        newMapLoc = { city: normalizedName, lat: best.lat, lng: best.lng };
      }
    } catch (e) {
      console.warn('Failed to normalize destination, using raw input', e);
    }

    // Update readable list (itin_locations) with normalizedName
    const currentNames = Array.isArray(itineraryData.itin_locations) ? itineraryData.itin_locations : [];
    const updatedNames = Array.from(new Set([...currentNames, normalizedName]));

    // Update map coords if we resolved them
    const currentMap = Array.isArray(itineraryData.itin_map_locations) ? itineraryData.itin_map_locations : [];
    let updatedMap = currentMap;
    if (newMapLoc) {
      const exists = currentMap.some((m) => m.city?.toLowerCase() === newMapLoc!.city.toLowerCase());
      updatedMap = exists ? currentMap : [...currentMap, newMapLoc];
    }

    await supabase
      .from('itinerary')
      .update({ itin_locations: updatedNames, itin_map_locations: updatedMap })
      .eq('id', itineraryData.id);

    setNewDest("");
    refreshMapData?.();
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
        <ItineraryMapSection
          mapLocations={itineraryData.itin_map_locations || []}
          locationNames={derivedLocationNames}
        />
        {isUpcoming && (
          <div className="mt-4 flex items-center gap-2">
            <Input
              placeholder="Add destination city"
              value={newDest}
              onChange={(e) => setNewDest(e.target.value)}
              className="max-w-xs"
            />
            <Button onClick={handleAddDestination}>Add Destination</Button>
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