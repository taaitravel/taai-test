import React from 'react';
import { FolderPlus, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collection } from '@/hooks/useItineraryCollections';
import { cn } from '@/lib/utils';
import { DroppableCollection } from './DroppableCollection';

interface CollectionsSidebarProps {
  collections: Collection[];
  selectedCollectionId: string | null;
  onSelectCollection: (collectionId: string | null) => void;
  onCreateCollection: () => void;
  onEditCollection: (collection: Collection) => void;
  totalItineraries: number;
}

export const CollectionsSidebar: React.FC<CollectionsSidebarProps> = ({
  collections,
  selectedCollectionId,
  onSelectCollection,
  onCreateCollection,
  onEditCollection,
  totalItineraries
}) => {
  return (
    <div className="w-64 bg-secondary border-r border-border flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-foreground mb-2">Collections</h3>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2 border-border text-muted-foreground hover:bg-accent hover:text-foreground"
          onClick={onCreateCollection}
        >
          <FolderPlus className="h-4 w-4" />
          New Collection
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {/* All Itineraries */}
          <button
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left",
              selectedCollectionId === null
                ? "bg-primary/20 text-primary"
                : "hover:bg-accent text-muted-foreground"
            )}
            onClick={() => onSelectCollection(null)}
          >
            <Globe className="h-5 w-5" />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">All Itineraries</p>
              <p className="text-xs text-muted-foreground">
                {totalItineraries} total
              </p>
            </div>
          </button>

          {/* Collections */}
          {collections.map((collection) => (
            <DroppableCollection
              key={collection.id}
              collection={collection}
              isSelected={selectedCollectionId === collection.id}
              onSelect={() => onSelectCollection(collection.id)}
              onEdit={() => onEditCollection(collection)}
            />
          ))}

          {collections.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-8 px-4">
              Create collections to organize your itineraries
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
