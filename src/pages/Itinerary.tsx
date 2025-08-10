import { useSearchParams } from "react-router-dom";
import { useState } from "react";
import { ItineraryHeader } from "@/components/itinerary/ItineraryHeader";
import { ItineraryContent } from "@/components/itinerary/ItineraryContent";
import { ItineraryBrowsers } from "@/components/itinerary/ItineraryBrowsers";
import { ItineraryLoadingState } from "@/components/itinerary/ItineraryLoadingState";
import { useItineraryData } from "@/hooks/useItineraryData";
import { useBrowserState } from "@/hooks/useBrowserState";
import { AddItemDialog, ItemType } from "@/components/itinerary/AddItemDialog";
import { supabase } from "@/integrations/supabase/client";

const Itinerary = () => {
  const [searchParams] = useSearchParams();
  const itineraryId = searchParams.get('id');
  
  const { itineraryData, loading, budgetRefreshTrigger, refreshMapData } = useItineraryData(itineraryId);
  
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
    const updated = [...current];
    updated[editIndex] = item;
    await supabase.from('itinerary').update({ [type]: updated }).eq('id', itineraryData.id);
    setEditOpen(false);
    refreshMapData();
  };

  const handleDelete = async (type: ItemType, index: number) => {
    if (!itineraryData) return;
    const current = ((itineraryData as any)[type] || []) as any[];
    const updated = current.filter((_, i) => i !== index);
    await supabase.from('itinerary').update({ [type]: updated }).eq('id', itineraryData.id);
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

      <ItineraryBrowsers
        itineraryData={itineraryData}
        browserState={browserState}
        onCloseFlightBrowser={closeFlightBrowser}
        onCloseHotelBrowser={closeHotelBrowser}
        onCloseActivityBrowser={closeActivityBrowser}
        onCloseReservationBrowser={closeReservationBrowser}
        onFlightIndexChange={setCurrentFlightIndex}
        onHotelIndexChange={setCurrentHotelIndex}
        onActivityIndexChange={setCurrentActivityIndex}
        onReservationIndexChange={setCurrentReservationIndex}
        onEditFlight={(i) => openEdit('flights', i)}
        onEditHotel={(i) => openEdit('hotels', i)}
        onEditActivity={(i) => openEdit('activities', i)}
        onEditReservation={(i) => openEdit('reservations', i)}
        onDeleteFlight={(i) => handleDelete('flights', i)}
        onDeleteHotel={(i) => handleDelete('hotels', i)}
        onDeleteActivity={(i) => handleDelete('activities', i)}
        onDeleteReservation={(i) => handleDelete('reservations', i)}
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
