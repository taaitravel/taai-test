import { useSearchParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ItineraryHeader } from "@/components/itinerary/ItineraryHeader";
import { ItineraryContent } from "@/components/itinerary/ItineraryContent";

import { ItineraryLoadingState } from "@/components/itinerary/ItineraryLoadingState";
import { useAuthenticatedItineraryData } from "@/hooks/useAuthenticatedItineraryData";
import { useBrowserState } from "@/hooks/useBrowserState";
import { AddItemDialog, ItemType } from "@/components/itinerary/AddItemDialog";
import { supabase } from "@/integrations/supabase/client";

const Itinerary = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const itineraryId = searchParams.get('id');

  // Redirect to dashboard if no itinerary ID is provided
  useEffect(() => {
    if (!itineraryId) {
      console.log('No itinerary ID provided, redirecting to dashboard');
      navigate('/dashboard');
    }
  }, [itineraryId, navigate]);
  
  const { itineraryData, loading, budgetRefreshTrigger, refreshMapData } = useAuthenticatedItineraryData(itineraryId);
  
  const {
    browserState,
    openFlightBrowser,
    openHotelBrowser,
    openActivityBrowser,
    openReservationBrowser,
    closeFlightBrowser,
    closeHotelBrowser,
    closeActivityBrowser,
    closeReservationBrowser,
    setCurrentFlightIndex,
    setCurrentHotelIndex,
    setCurrentActivityIndex,
    setCurrentReservationIndex,
  } = useBrowserState();

  // Edit modal state
  const [editOpen, setEditOpen] = useState(false);
  const [editType, setEditType] = useState<ItemType | null>(null);
  const [editIndex, setEditIndex] = useState<number>(0);
  const [initialItem, setInitialItem] = useState<any | null>(null);

  const openEdit = (type: ItemType, index: number) => {
    if (!itineraryData) return;
    setEditType(type);
    setEditIndex(index);
    const arr = (itineraryData as any)[type] || [];
    setInitialItem(arr[index]);
    setEditOpen(true);
  };

  const handleEditSubmit = async (type: ItemType, item: any) => {
    if (!itineraryData) return;
    const current = ((itineraryData as any)[type] || []) as any[];
    let updated;
    
    if (editIndex === -1) {
      // Adding new item
      updated = [...current, item];
    } else {
      // Editing existing item
      updated = [...current];
      updated[editIndex] = item;
    }

    // Append geocoded location to itin_map_locations for Mapbox, when provided
    let newMapLocations = ([...(itineraryData.itin_map_locations || [])] as any[]);
    const loc = (item as any).location;
    if (loc && typeof loc.lat === 'number' && typeof loc.lng === 'number') {
      const category = type === 'hotels' ? 'hotel' : type === 'activities' ? 'activity' : type === 'reservations' ? 'reservation' : undefined;
      const cityName = loc.name || item.city || '';
      if (category && cityName) {
        const exists = newMapLocations.some((l: any) => l.lat === loc.lat && l.lng === loc.lng && l.city === cityName);
        if (!exists) {
          newMapLocations = [...newMapLocations, { city: cityName, lat: loc.lat, lng: loc.lng, category }];
        }
      }
    }

    await supabase.from('itinerary').update({ [type]: updated, itin_map_locations: newMapLocations }).eq('id', itineraryData.id);
    setEditOpen(false);
    refreshMapData();
  };

  const handleDelete = async (type: string, index: number) => {
    if (!itineraryData) return;
    const itemType = type as ItemType;
    const current = ((itineraryData as any)[itemType] || []) as any[];
    const updated = current.filter((_, i) => i !== index);
    await supabase.from('itinerary').update({ [itemType]: updated }).eq('id', itineraryData.id);
    refreshMapData();
  };

  if (loading) {
    return <ItineraryLoadingState message="Loading your itinerary..." />;
  }

  if (!itineraryData) {
    return <ItineraryLoadingState message="No itinerary found..." />;
  }

  return (
    <div className="min-h-screen bg-[#171821]">
      <ItineraryHeader itineraryId={itineraryData.id} />
      
      <ItineraryContent
        itineraryData={itineraryData}
        budgetRefreshTrigger={budgetRefreshTrigger}
        onFlightClick={openFlightBrowser}
        onHotelClick={openHotelBrowser}
        onActivityClick={openActivityBrowser}
        onReservationClick={openReservationBrowser}
        refreshMapData={refreshMapData}
      />


      {/* Edit Item Dialog */}
      <AddItemDialog
        open={editOpen}
        type={editType}
        onClose={() => setEditOpen(false)}
        onSubmit={handleEditSubmit}
        initialItem={initialItem}
        defaultCity={(itineraryData.itin_locations || [])[0] || ''}
        suggestions={{ cities: itineraryData.itin_locations || [] }}
      />
    </div>
  );
};

export default Itinerary;
