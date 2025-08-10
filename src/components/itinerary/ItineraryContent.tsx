import { useState } from "react";
import { ItineraryData } from "@/types/itinerary";
import { ItineraryInfoHeader } from "./ItineraryInfoHeader";
import { TripOverviewSection } from "./TripOverviewSection";
import { ItineraryMapSection } from "./ItineraryMapSection";
import { ItineraryStackedCards } from "./ItineraryStackedCards";
import { DailyScheduleSection } from "./DailyScheduleSection";
import { ItinerarySidebar } from "./ItinerarySidebar";
import { AddItemDialog, ItemType } from "./AddItemDialog";
import { supabase } from "@/integrations/supabase/client";

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
    await supabase
      .from('itinerary')
      .update({ [type]: newArray })
      .eq('id', itineraryData.id);
    setAddOpen(false);
    // Ask parent hook to refetch
    refreshMapData?.();
  };
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
          locationNames={itineraryData.itin_locations || []}
        />
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