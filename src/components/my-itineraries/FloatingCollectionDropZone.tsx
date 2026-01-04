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
              "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer",
              isCreateNew
                ? "border-2 border-dashed border-white/30 bg-white/5 hover:bg-white/10"
                : "border-2 bg-[#1a1c2e] border-white/20 hover:border-white/40",
              isOver && "bg-[#ffce87]/20 border-[#ffce87] scale-110"
            )}
          >
            {isCreateNew ? (
              <Plus className={cn("h-4 w-4 text-white/60", isOver && "text-[#ffce87]")} />
            ) : (
              <span className={cn(
                "text-sm font-semibold text-white/80",
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
        "fixed right-4 top-1/2 -translate-y-1/2 z-50",
        "flex flex-col gap-3 p-2 rounded-full",
        "bg-[#12131a]/95 backdrop-blur-sm border border-white/10 shadow-xl",
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
