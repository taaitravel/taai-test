import React from 'react';
import { ChevronRight, Plane } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MobileItineraryStack } from '@/components/my-itineraries/MobileItineraryStack';
import { ItineraryData } from '@/types/itinerary';

interface StackSectionProps {
  title: string;
  icon?: React.ReactNode;
  items: ItineraryData[];
  loading?: boolean;
  emptyIcon?: React.ReactNode;
  emptyMessage?: string;
  onOpen?: () => void;
  openLabel?: string;
  showCollectionActions?: boolean;
  onAddToCollection?: (itineraryId: number) => void;
  onRemoveFromCollection?: (itineraryId: number) => void;
  collectionId?: string;
}

export const StackSection: React.FC<StackSectionProps> = ({
  title,
  icon,
  items,
  loading = false,
  emptyIcon,
  emptyMessage = 'No itineraries yet',
  onOpen,
  openLabel = 'Open',
  showCollectionActions = false,
  onAddToCollection,
  onRemoveFromCollection,
  collectionId,
}) => {
  return (
    <section className="flex flex-col items-center">
      <h3 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center justify-center">
        {icon}
        <span className={icon ? 'ml-2' : ''}>{title}</span>
        <span className="ml-2 text-xs text-muted-foreground font-normal">({items.length})</span>
      </h3>

      {loading ? (
        <div className="text-center py-8">
          <Plane className="h-8 w-8 text-foreground mx-auto mb-2 animate-pulse" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {emptyIcon}
          <p className="text-sm mt-2">{emptyMessage}</p>
        </div>
      ) : (
        <MobileItineraryStack
          itineraries={items}
          showCollectionActions={showCollectionActions}
          onAddToCollection={onAddToCollection}
          onRemoveFromCollection={onRemoveFromCollection}
          collectionId={collectionId}
        />
      )}

      {onOpen && items.length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 h-7 gap-1 text-xs text-muted-foreground"
          onClick={onOpen}
        >
          {openLabel} <ChevronRight className="h-3 w-3" />
        </Button>
      )}
    </section>
  );
};