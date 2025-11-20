import { Plane, Building, Calendar, Utensils } from "lucide-react";
import { ItineraryStackedSection } from "./ItineraryStackedSection";
import { 
  EnhancedHotelCardRenderer,
  EnhancedFlightCardRenderer,
  EnhancedActivityCardRenderer,
  EnhancedReservationCardRenderer
} from "./EnhancedStackedCardRenderer";

interface ItineraryStackedCardsProps {
  flights: any[];
  hotels: any[];
  activities: any[];
  reservations: any[];
  onFlightClick: (index: number) => void;
  onHotelClick: (index: number) => void;
  onActivityClick: (index: number) => void;
  onReservationClick: (index: number) => void;
  onAddFlight?: () => void;
  onAddHotel?: () => void;
  onAddActivity?: () => void;
  onAddReservation?: () => void;
  onEdit?: (type: any, index: number) => void;
  onDelete?: (type: string, index: number) => void;
}

export const ItineraryStackedCards = ({
  flights,
  hotels,
  activities,
  reservations,
  onFlightClick,
  onHotelClick,
  onActivityClick,
  onReservationClick,
  onAddFlight,
  onAddHotel,
  onAddActivity,
  onAddReservation,
  onEdit,
  onDelete,
}: ItineraryStackedCardsProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <ItineraryStackedSection
        title="Flights"
        icon={Plane}
        items={flights}
        itemType="flights"
        onCardClick={onFlightClick}
        renderCard={EnhancedFlightCardRenderer}
        emptyMessage="No flights yet. Add a flight to get started!"
        onAddClick={onAddFlight}
        onEdit={onEdit}
        onDelete={onDelete}
      />
      <ItineraryStackedSection
        title="Hotels"
        icon={Building}
        items={hotels}
        itemType="hotels"
        onCardClick={onHotelClick}
        renderCard={EnhancedHotelCardRenderer}
        emptyMessage="No hotels yet. Add a hotel to get started!"
        onAddClick={onAddHotel}
        onEdit={onEdit}
        onDelete={onDelete}
      />
      <ItineraryStackedSection
        title="Activities"
        icon={Calendar}
        items={activities}
        itemType="activities"
        onCardClick={onActivityClick}
        renderCard={EnhancedActivityCardRenderer}
        emptyMessage="No activities yet. Add an activity to get started!"
        onAddClick={onAddActivity}
        onEdit={onEdit}
        onDelete={onDelete}
      />
      <ItineraryStackedSection
        title="Reservations"
        icon={Utensils}
        items={reservations}
        itemType="reservations"
        onCardClick={onReservationClick}
        renderCard={EnhancedReservationCardRenderer}
        emptyMessage="No reservations yet. Add a reservation to get started!"
        onAddClick={onAddReservation}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  );
};
