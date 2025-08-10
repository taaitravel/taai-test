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
  onEditFlight?: (index: number) => void;
  onEditHotel?: (index: number) => void;
  onEditActivity?: (index: number) => void;
  onEditReservation?: (index: number) => void;
  onDeleteFlight?: (index: number) => void;
  onDeleteHotel?: (index: number) => void;
  onDeleteActivity?: (index: number) => void;
  onDeleteReservation?: (index: number) => void;
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
  onEditFlight,
  onEditHotel,
  onEditActivity,
  onEditReservation,
  onDeleteFlight,
  onDeleteHotel,
  onDeleteActivity,
  onDeleteReservation,
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
        onEdit={onEditFlight}
        onDelete={onDeleteFlight}
      />

      <ItineraryBrowser
        isOpen={browserState.hotelBrowserOpen}
        onClose={onCloseHotelBrowser}
        items={itineraryData.hotels || []}
        currentIndex={browserState.currentHotelIndex}
        onIndexChange={onHotelIndexChange}
        title="Hotels"
        type="hotels"
        onEdit={onEditHotel}
        onDelete={onDeleteHotel}
      />

      <ItineraryBrowser
        isOpen={browserState.activityBrowserOpen}
        onClose={onCloseActivityBrowser}
        items={itineraryData.activities || []}
        currentIndex={browserState.currentActivityIndex}
        onIndexChange={onActivityIndexChange}
        title="Activities"
        type="activities"
        onEdit={onEditActivity}
        onDelete={onDeleteActivity}
      />

      <ItineraryBrowser
        isOpen={browserState.reservationBrowserOpen}
        onClose={onCloseReservationBrowser}
        items={itineraryData.reservations || []}
        currentIndex={browserState.currentReservationIndex}
        onIndexChange={onReservationIndexChange}
        title="Reservations"
        type="reservations"
        onEdit={onEditReservation}
        onDelete={onDeleteReservation}
      />
    </>
  );
};