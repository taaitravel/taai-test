import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Plus } from 'lucide-react';
import { Collection } from '@/hooks/useItineraryCollections';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface DroppableCircleProps {
  id: string;
  label: string;
  initial: string;
  isCreateNew?: boolean;
}

const DroppableCircle: React.FC<DroppableCircleProps> = ({ id, label, initial, isCreateNew }) => {
  const { isOver, setNodeRef } = useDroppable({
    id,
    data: {
      type: 'collection',
    },
  });

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            ref={setNodeRef}
            className={cn(
              "relative w-16 h-16 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer",
              isCreateNew
                ? "border-2 border-dashed border-primary/40 bg-primary/10 hover:bg-primary/20"
                : "border-2 bg-card border-border hover:border-primary/40",
              isOver && "scale-125 border-primary bg-primary/20 deck-slot-active"
            )}
          >
            {/* Stacked "cards behind" visual - deck effect */}
            {!isCreateNew && (
              <>
                <div className="absolute inset-0 bg-foreground/5 rounded-xl -z-10 translate-y-1 translate-x-0.5" />
                <div className="absolute inset-0 bg-foreground/[0.03] rounded-xl -z-20 translate-y-2 translate-x-1" />
              </>
            )}
            
            {isCreateNew ? (
              <Plus className={cn("h-6 w-6 text-primary", isOver && "text-foreground")} />
            ) : (
              <span className={cn(
                "text-lg font-bold text-foreground transition-colors",
                isOver && "text-primary"
              )}>
                {initial}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="left" className="bg-card border-border text-foreground">
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

interface FloatingCollectionDropZoneProps {
  collections: Collection[];
  isVisible: boolean;
  onCreateCollection?: () => void;
}

export const FloatingCollectionDropZone: React.FC<FloatingCollectionDropZoneProps> = ({
  collections,
  isVisible,
  onCreateCollection,
}) => {
  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "fixed right-16 top-1/2 -translate-y-1/2 z-50",
        "flex flex-col gap-3 p-3 rounded-2xl",
        "bg-secondary/95 backdrop-blur-md border border-primary/20 shadow-2xl",
        "animate-in slide-in-from-right duration-200"
      )}
    >
      {collections.map((collection) => (
        <DroppableCircle
          key={collection.id}
          id={`collection-${collection.id}`}
          label={collection.name}
          initial={collection.name.charAt(0).toUpperCase()}
        />
      ))}
      
      {onCreateCollection && (
        <DroppableCircle
          id="collection-new"
          label="Create new collection"
          initial="+"
          isCreateNew
        />
      )}
    </div>
  );
};
