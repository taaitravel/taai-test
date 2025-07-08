import { ItineraryBrowser } from "./ItineraryBrowser";
import { ItineraryData, BrowserState } from "@/types/itinerary";

interface ItineraryBrowsersProps {
  itineraryData: ItineraryData;
  browserState: BrowserState;
  onCloseFlightBrowser: () => void;
  onCloseHotelBrowser: () => void;
  onCloseActivityBrowser: () => void;
  onCloseReservationBrowser: () => void;
  onFlightIndexChange: (index: number) => void;
  onHotelIndexChange: (index: number) => void;
  onActivityIndexChange: (index: number) => void;
  onReservationIndexChange: (index: number) => void;
}

export const ItineraryBrowsers = ({
  itineraryData,
  browserState,
  onCloseFlightBrowser,
  onCloseHotelBrowser,
  onCloseActivityBrowser,
  onCloseReservationBrowser,
  onFlightIndexChange,
  onHotelIndexChange,
  onActivityIndexChange,
  onReservationIndexChange,
}: ItineraryBrowsersProps) => {
  return (
    <>
      <ItineraryBrowser
        isOpen={browserState.flightBrowserOpen}
        onClose={onCloseFlightBrowser}
        items={itineraryData.flights || []}
        currentIndex={browserState.currentFlightIndex}
        onIndexChange={onFlightIndexChange}
        title="Flights"
        type="flights"
      />

      <ItineraryBrowser
        isOpen={browserState.hotelBrowserOpen}
        onClose={onCloseHotelBrowser}
        items={itineraryData.hotels || []}
        currentIndex={browserState.currentHotelIndex}
        onIndexChange={onHotelIndexChange}
        title="Hotels"
        type="hotels"
      />

      <ItineraryBrowser
        isOpen={browserState.activityBrowserOpen}
        onClose={onCloseActivityBrowser}
        items={itineraryData.activities || []}
        currentIndex={browserState.currentActivityIndex}
        onIndexChange={onActivityIndexChange}
        title="Activities"
        type="activities"
      />

      <ItineraryBrowser
        isOpen={browserState.reservationBrowserOpen}
        onClose={onCloseReservationBrowser}
        items={itineraryData.reservations || []}
        currentIndex={browserState.currentReservationIndex}
        onIndexChange={onReservationIndexChange}
        title="Reservations"
        type="reservations"
      />
    </>
  );
};