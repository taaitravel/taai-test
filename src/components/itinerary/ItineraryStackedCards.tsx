import { Plane, MapPin, Calendar, Clock } from "lucide-react";
import { ItineraryStackedSection, FlightCardRenderer, HotelCardRenderer, ActivityCardRenderer, ReservationCardRenderer } from "./ItineraryStackedSection";

interface ItineraryData {
  flights: any[];
  hotels: any[];
  activities: any[];
  reservations: any[];
}

interface ItineraryStackedCardsProps {
  itineraryData: ItineraryData;
  onFlightClick: (index: number) => void;
  onHotelClick: (index: number) => void;
  onActivityClick: (index: number) => void;
  onReservationClick: (index: number) => void;
}

export const ItineraryStackedCards = ({
  itineraryData,
  onFlightClick,
  onHotelClick,
  onActivityClick,
  onReservationClick
}: ItineraryStackedCardsProps) => {
  return (
    <div className="mb-8">
      {/* Mobile Layout - 2 columns */}
      <div className="grid grid-cols-2 lg:hidden gap-4">
        {/* Column 1: Flights and Hotels */}
        <div className="space-y-8">
          <ItineraryStackedSection
            title="Flights"
            icon={Plane}
            items={itineraryData.flights || []}
            onCardClick={onFlightClick}
            renderCard={FlightCardRenderer}
            emptyMessage="No flights booked"
          />
          <ItineraryStackedSection
            title="Hotels"
            icon={MapPin}
            items={itineraryData.hotels || []}
            onCardClick={onHotelClick}
            renderCard={HotelCardRenderer}
            emptyMessage="No hotels booked"
          />
        </div>
        
        {/* Column 2: Activities and Reservations */}
        <div className="space-y-8">
          <ItineraryStackedSection
            title="Activities"
            icon={Calendar}
            items={itineraryData.activities || []}
            onCardClick={onActivityClick}
            renderCard={ActivityCardRenderer}
            emptyMessage="No activities planned"
          />
          <ItineraryStackedSection
            title="Reservations"
            icon={Clock}
            items={itineraryData.reservations || []}
            onCardClick={onReservationClick}
            renderCard={ReservationCardRenderer}
            emptyMessage="No reservations made"
          />
        </div>
      </div>

      {/* Desktop Layout - 4 columns */}
      <div className="hidden lg:grid lg:grid-cols-4 gap-6">
        {/* Flights */}
        <div>
          <ItineraryStackedSection
            title="Flights"
            icon={Plane}
            items={itineraryData.flights || []}
            onCardClick={onFlightClick}
            renderCard={FlightCardRenderer}
            emptyMessage="No flights booked"
          />
        </div>
        
        {/* Hotels */}
        <div>
          <ItineraryStackedSection
            title="Hotels"
            icon={MapPin}
            items={itineraryData.hotels || []}
            onCardClick={onHotelClick}
            renderCard={HotelCardRenderer}
            emptyMessage="No hotels booked"
          />
        </div>

        {/* Activities */}
        <div>
          <ItineraryStackedSection
            title="Activities"
            icon={Calendar}
            items={itineraryData.activities || []}
            onCardClick={onActivityClick}
            renderCard={ActivityCardRenderer}
            emptyMessage="No activities planned"
          />
        </div>
        
        {/* Reservations */}
        <div>
          <ItineraryStackedSection
            title="Reservations"
            icon={Clock}
            items={itineraryData.reservations || []}
            onCardClick={onReservationClick}
            renderCard={ReservationCardRenderer}
            emptyMessage="No reservations made"
          />
        </div>
      </div>
    </div>
  );
};