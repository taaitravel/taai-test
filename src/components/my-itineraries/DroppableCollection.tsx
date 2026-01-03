import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Folder, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collection } from '@/hooks/useItineraryCollections';
import { cn } from '@/lib/utils';

interface DroppableCollectionProps {
  collection: Collection;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
}

export const DroppableCollection: React.FC<DroppableCollectionProps> = ({
  collection,
  isSelected,
  onSelect,
  onEdit,
}) => {
  const { isOver, setNodeRef } = useDroppable({
    id: `collection-${collection.id}`,
    data: {
      type: 'collection',
      collection,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "group flex items-center gap-3 p-3 rounded-lg transition-all duration-200",
        isSelected
          ? "bg-primary/20 text-primary"
          : "hover:bg-white/10 text-white/80",
        isOver && "bg-[#ffce87]/20 border-2 border-[#ffce87] scale-[1.02]"
      )}
    >
      <button
        className="flex-1 flex items-center gap-3 text-left min-w-0"
        onClick={onSelect}
      >
        <Folder className={cn(
          "h-5 w-5 shrink-0 transition-colors",
          isOver && "text-[#ffce87]"
        )} />
        <div className="flex-1 min-w-0">
          <p className={cn(
            "font-medium truncate",
            isOver && "text-[#ffce87]"
          )}>
            {collection.name}
          </p>
          <p className="text-xs text-white/50">
            {collection.itinerary_count || 0} itinerary{(collection.itinerary_count || 0) !== 1 ? 's' : ''}
          </p>
        </div>
      </button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-white/60 hover:text-white hover:bg-white/10"
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
      >
        <Settings className="h-4 w-4" />
      </Button>
    </div>
  );
};
