import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { ItineraryCard } from './ItineraryCard';
import { ItineraryData } from '@/types/itinerary';

interface DraggableItineraryCardProps {
  itinerary: ItineraryData;
  onAddToCollection?: (itineraryId: number) => void;
  onRemoveFromCollection?: (itineraryId: number) => void;
  showCollectionActions?: boolean;
  collectionId?: string;
}

export const DraggableItineraryCard: React.FC<DraggableItineraryCardProps> = ({
  itinerary,
  ...props
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `itinerary-${itinerary.id}`,
    data: {
      type: 'itinerary',
      itinerary,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.7 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
    zIndex: isDragging ? 1000 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`transition-shadow duration-200 ${isDragging ? 'shadow-xl shadow-[#ffce87]/30 scale-105' : ''}`}
    >
      <ItineraryCard itinerary={itinerary} {...props} />
    </div>
  );
};
