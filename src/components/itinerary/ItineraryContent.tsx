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
  // Build map search queries from itinerary data (hotels, reservations, activities)
  const normalize = (s?: string) => (typeof s === 'string' ? s.trim() : '').replace(/\s+/g, ' ').trim();
  const isOther = (s?: string) => normalize(s).toLowerCase() === 'other';
  const q = (...parts: (string | undefined)[]) => normalize(parts.filter(Boolean).join(', '));

  const hotelQueries = (itineraryData.hotels || []).map((h: any) => {
    if (isOther(h?.name) || isOther(h?.city) || isOther(h?.address)) return '';
    return q(h?.address, h?.name, h?.city);
  });
  const activityQueries = (itineraryData.activities || []).map((a: any) => {
    if (isOther(a?.name) || isOther(a?.city) || isOther(a?.address)) return '';
    return q(a?.address, a?.name, a?.city);
  });
  const reservationQueries = (itineraryData.reservations || []).map((r: any) => {
    if (isOther(r?.type) || isOther(r?.name) || isOther(r?.city) || isOther(r?.address)) return '';
    return q(r?.address, r?.name, r?.city);
  });

  const derivedLocationNames = Array.from(
    new Set([
      ...destinations,
      ...hotelQueries,
      ...activityQueries,
      ...reservationQueries,
    ].filter((v) => !!v && !isOther(v)))
  );

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

  // Attempt to geocode and persist a new map location for hotels/activities/reservations
  const currentMap = Array.isArray(itineraryData.itin_map_locations) ? (itineraryData.itin_map_locations as any[]) : [];
  let updatedMap: any[] = currentMap;

  const toQuery = ((): { label: string; query: string; category?: string } | null => {
    const normalize = (s?: string) => (typeof s === 'string' ? s.trim() : '').replace(/\s+/g, ' ').trim();
    const q = (...parts: (string | undefined)[]) => normalize(parts.filter(Boolean).join(', '));
    if (type === 'hotels') {
      return { label: normalize(item?.name) || normalize(item?.city), query: q(item?.address, item?.name, item?.city), category: 'hotel' };
    }
    if (type === 'activities') {
      return { label: normalize(item?.name) || normalize(item?.city), query: q(item?.address, item?.name, item?.city), category: 'activity' };
    }
    if (type === 'reservations') {
      return { label: normalize(item?.name) || normalize(item?.city), query: q(item?.address, item?.name, item?.city), category: 'reservation' };
    }
    return null;
  })();

  if (toQuery && toQuery.label && toQuery.query && !isOther(toQuery.label)) {
    try {
      const { data, error } = await supabase.functions.invoke('search-cities', { body: { query: toQuery.query } });
      if (!error && Array.isArray(data?.locations) && data.locations.length > 0) {
        const best = data.locations[0];
        const exists = currentMap.some((m: any) => (m?.city || '').toLowerCase() === toQuery!.label.toLowerCase());
        if (!exists) {
          updatedMap = [
            ...currentMap,
            { city: toQuery.label, lat: best.lat, lng: best.lng, category: toQuery.category },
          ];
        }
      }
    } catch (e) {
      console.warn('Failed to geocode new item, proceeding without map update', e);
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

  // Ensure existing hotels/activities/reservations have geocoded map locations persisted
  useEffect(() => {
    const run = async () => {
      try {
        const existing = Array.isArray(itineraryData.itin_map_locations) ? itineraryData.itin_map_locations : [];
        const existingLabels = new Set(existing.map((m: any) => (m?.city || '').toLowerCase()));

        type Want = { label: string; query: string; category: 'hotel' | 'activity' | 'reservation' };
        const wants: Want[] = [];

        const pushIfValid = (label?: string, query?: string, category?: Want['category']) => {
          const L = normalize(label);
          const Q = normalize(query);
          if (!L || isOther(L) || !Q) return;
          if (!existingLabels.has(L.toLowerCase())) wants.push({ label: L, query: Q, category: category! });
        };

        (itineraryData.hotels || []).forEach((h: any) => pushIfValid(h?.name || h?.city, q(h?.address, h?.name, h?.city), 'hotel'));
        (itineraryData.activities || []).forEach((a: any) => pushIfValid(a?.name || a?.city, q(a?.address, a?.name, a?.city), 'activity'));
        (itineraryData.reservations || []).forEach((r: any) => pushIfValid(r?.name || r?.city, q(r?.address, r?.name, r?.city), 'reservation'));

        if (wants.length === 0) return;

        const geocoded = await Promise.all(
          wants.map(async (w) => {
            try {
              const { data, error } = await supabase.functions.invoke('search-cities', { body: { query: w.query } });
              if (!error && Array.isArray(data?.locations) && data.locations.length > 0) {
                const best = data.locations[0];
                return { city: w.label, lat: best.lat, lng: best.lng, category: w.category };
              }
            } catch (e) {
              console.warn('ensureGeocodes error for', w, e);
            }
            return undefined;
          })
        );

        const additions = geocoded.filter(Boolean) as any[];
        if (additions.length === 0) return;

        const updated = [...existing, ...additions];
        await supabase.from('itinerary').update({ itin_map_locations: updated }).eq('id', itineraryData.id);
        refreshMapData?.();
      } catch (e) {
        console.warn('ensureGeocodes run failed', e);
      }
    };

    run();
  }, [itineraryData.id, JSON.stringify(itineraryData.hotels), JSON.stringify(itineraryData.activities), JSON.stringify(itineraryData.reservations)]);

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