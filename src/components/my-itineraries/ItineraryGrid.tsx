import React from 'react';
import { DraggableItineraryCard } from './DraggableItineraryCard';
import { ItineraryData } from '@/types/itinerary';

interface ItineraryGridProps {
  itineraries: ItineraryData[];
  onAddToCollection?: (itineraryId: number) => void;
  onRemoveFromCollection?: (itineraryId: number) => void;
  collectionId?: string;
}

export const ItineraryGrid: React.FC<ItineraryGridProps> = ({
  itineraries,
  onAddToCollection,
  onRemoveFromCollection,
  collectionId
}) => {
  if (itineraries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4">
          <span className="text-2xl">✈️</span>
        </div>
        <h3 className="text-lg font-medium text-white mb-2">No itineraries found</h3>
        <p className="text-white/60">Create a new itinerary or drag one into this collection</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 justify-items-center md:justify-items-start">
      {itineraries.map((itinerary) => (
        <DraggableItineraryCard
          key={itinerary.id}
          itinerary={itinerary}
          onAddToCollection={onAddToCollection}
          onRemoveFromCollection={onRemoveFromCollection}
          showCollectionActions={true}
          collectionId={collectionId}
        />
      ))}
    </div>
  );
};
