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
              "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer shadow-lg",
              isCreateNew
                ? "border-2 border-dashed border-[#ffce87]/40 bg-[#ffce87]/10 hover:bg-[#ffce87]/20"
                : "border-2 bg-[#1a1c2e] border-white/30 hover:border-[#ffce87]/60",
              isOver && "bg-[#ffce87]/30 border-[#ffce87] scale-110 shadow-[0_0_12px_rgba(255,206,135,0.4)]"
            )}
          >
            {isCreateNew ? (
              <Plus className={cn("h-5 w-5 text-[#ffce87]", isOver && "text-[#ffce87]")} />
            ) : (
              <span className={cn(
                "text-sm font-bold text-white",
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
