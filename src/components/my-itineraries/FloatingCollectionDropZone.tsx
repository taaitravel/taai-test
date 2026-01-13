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
                ? "border-2 border-dashed border-[#ffce87]/40 bg-[#ffce87]/10 hover:bg-[#ffce87]/20"
                : "border-2 bg-[#1a1c2e] border-white/20 hover:border-[#ffce87]/40",
              isOver && "scale-125 border-[#ffce87] bg-[#ffce87]/20 deck-slot-active"
            )}
          >
            {/* Stacked "cards behind" visual - deck effect */}
            {!isCreateNew && (
              <>
                <div className="absolute inset-0 bg-white/5 rounded-xl -z-10 translate-y-1 translate-x-0.5" />
                <div className="absolute inset-0 bg-white/[0.03] rounded-xl -z-20 translate-y-2 translate-x-1" />
              </>
            )}
            
            {isCreateNew ? (
              <Plus className={cn("h-6 w-6 text-[#ffce87]", isOver && "text-white")} />
            ) : (
              <span className={cn(
                "text-lg font-bold text-white transition-colors",
                isOver && "text-[#ffce87]"
              )}>
                {initial}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="left" className="bg-[#1a1c2e] border-white/20 text-white">
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
        "bg-[#12131a]/95 backdrop-blur-md border border-[#ffce87]/20 shadow-2xl",
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
