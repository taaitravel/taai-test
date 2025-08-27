import React, { memo } from "react";
import { Plane, Building2, Activity, UtensilsCrossed } from "lucide-react";
import { OptimizedItinerarySection } from './OptimizedItinerarySection';

interface ItineraryBrowsersProps {
  itineraryData: any;
  onEditItem?: (type: string, index: number) => void;
  onDeleteItem?: (type: string, index: number) => void;
  onAddItem?: (type: string) => void;
}

const ItineraryBrowsers = memo(({ 
  itineraryData, 
  onEditItem, 
  onDeleteItem, 
  onAddItem 
}: ItineraryBrowsersProps) => {
  if (!itineraryData) return null;

  const handleEdit = (type: string) => (index: number) => {
    onEditItem?.(type, index);
  };

  const handleDelete = (type: string) => (index: number) => {
    onDeleteItem?.(type, index);
  };

  const handleAdd = (type: string) => () => {
    onAddItem?.(type);
  };

  return (
    <div className="space-y-6">
      <OptimizedItinerarySection
        title="Flights"
        items={itineraryData.flights || []}
        type="flight"
        onAdd={handleAdd('flights')}
        onEdit={handleEdit('flights')}
        onDelete={handleDelete('flights')}
        emptyMessage="No flights booked yet"
        icon={<Plane className="h-5 w-5 text-white" />}
      />

      <OptimizedItinerarySection
        title="Hotels"
        items={itineraryData.hotels || []}
        type="hotel"
        onAdd={handleAdd('hotels')}
        onEdit={handleEdit('hotels')}
        onDelete={handleDelete('hotels')}
        emptyMessage="No hotels booked yet"
        icon={<Building2 className="h-5 w-5 text-white" />}
      />

      <OptimizedItinerarySection
        title="Activities"
        items={itineraryData.activities || []}
        type="activity"
        onAdd={handleAdd('activities')}
        onEdit={handleEdit('activities')}
        onDelete={handleDelete('activities')}
        emptyMessage="No activities planned yet"
        icon={<Activity className="h-5 w-5 text-white" />}
      />

      <OptimizedItinerarySection
        title="Reservations"
        items={itineraryData.reservations || []}
        type="reservation"
        onAdd={handleAdd('reservations')}
        onEdit={handleEdit('reservations')}
        onDelete={handleDelete('reservations')}
        emptyMessage="No reservations made yet"
        icon={<UtensilsCrossed className="h-5 w-5 text-white" />}
      />
    </div>
  );
});

ItineraryBrowsers.displayName = 'ItineraryBrowsers';

export { ItineraryBrowsers };
export default ItineraryBrowsers;