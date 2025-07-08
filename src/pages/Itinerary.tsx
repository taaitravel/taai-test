
import { useSearchParams } from "react-router-dom";
import { ItineraryHeader } from "@/components/itinerary/ItineraryHeader";
import { ItineraryContent } from "@/components/itinerary/ItineraryContent";
import { ItineraryBrowsers } from "@/components/itinerary/ItineraryBrowsers";
import { ItineraryLoadingState } from "@/components/itinerary/ItineraryLoadingState";
import { useItineraryData } from "@/hooks/useItineraryData";
import { useBrowserState } from "@/hooks/useBrowserState";

const Itinerary = () => {
  const [searchParams] = useSearchParams();
  const itineraryId = searchParams.get('id');
  
  const { itineraryData, loading, budgetRefreshTrigger } = useItineraryData(itineraryId);
  
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
      />
    </div>
  );
};

export default Itinerary;
