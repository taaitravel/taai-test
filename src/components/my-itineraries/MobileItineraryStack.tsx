import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ItineraryCard } from './ItineraryCard';
import { ItineraryData } from '@/types/itinerary';

interface MobileItineraryStackProps {
  itineraries: ItineraryData[];
  onAddToCollection?: (itineraryId: number) => void;
  onRemoveFromCollection?: (itineraryId: number) => void;
  collectionId?: string;
}

export const MobileItineraryStack: React.FC<MobileItineraryStackProps> = ({
  itineraries,
  onAddToCollection,
  onRemoveFromCollection,
  collectionId,
}) => {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  if (itineraries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <span className="text-2xl">✈️</span>
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">No itineraries found</h3>
        <p className="text-muted-foreground">Create a new itinerary to get started</p>
      </div>
    );
  }

  const safeIndex = Math.min(index, itineraries.length - 1);
  const prev = () => setIndex((i) => Math.max(0, i - 1));
  const next = () => setIndex((i) => Math.min(itineraries.length - 1, i + 1));

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) {
      if (dx < 0) next();
      else prev();
    }
    touchStartX.current = null;
  };

  // Show up to 3 cards stacked (current + 2 behind)
  const visible = itineraries.slice(safeIndex, safeIndex + 3);

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <div
        className="relative w-[255px] h-[375px]"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {visible
          .map((it, i) => ({ it, i }))
          .reverse()
          .map(({ it, i }) => (
            <div
              key={it.id}
              className="absolute inset-0 transition-all duration-300"
              style={{
                transform: `translateY(${i * 10}px) translateX(${i * 5}px) scale(${1 - i * 0.04})`,
                zIndex: 10 - i,
                opacity: i === 0 ? 1 : 0.6,
                pointerEvents: i === 0 ? 'auto' : 'none',
              }}
            >
              <ItineraryCard
                itinerary={it}
                onAddToCollection={onAddToCollection}
                onRemoveFromCollection={onRemoveFromCollection}
                showCollectionActions={true}
                collectionId={collectionId}
              />
            </div>
          ))}
      </div>

      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={prev}
          disabled={safeIndex === 0}
          className="h-10 w-10 rounded-full"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <span className="text-sm text-muted-foreground tabular-nums min-w-[60px] text-center">
          {safeIndex + 1} / {itineraries.length}
        </span>
        <Button
          variant="outline"
          size="icon"
          onClick={next}
          disabled={safeIndex >= itineraries.length - 1}
          className="h-10 w-10 rounded-full"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};