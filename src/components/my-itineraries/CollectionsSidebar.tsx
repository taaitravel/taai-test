import React from 'react';
import { Folder, FolderPlus, Settings, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collection } from '@/hooks/useItineraryCollections';
import { cn } from '@/lib/utils';

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
    <div className="w-64 bg-[#12131a] border-r border-white/10 flex flex-col h-full">
      <div className="p-4 border-b border-white/10">
        <h3 className="font-semibold text-white mb-2">Collections</h3>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2 border-white/20 text-white/80 hover:bg-white/10 hover:text-white"
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
                : "hover:bg-white/10 text-white/80"
            )}
            onClick={() => onSelectCollection(null)}
          >
            <Globe className="h-5 w-5" />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">All Itineraries</p>
              <p className="text-xs text-white/50">
                {totalItineraries} total
              </p>
            </div>
          </button>

          {/* Collections */}
          {collections.map((collection) => (
            <div
              key={collection.id}
              className={cn(
                "group flex items-center gap-3 p-3 rounded-lg transition-colors",
                selectedCollectionId === collection.id
                  ? "bg-primary/20 text-primary"
                  : "hover:bg-white/10 text-white/80"
              )}
            >
              <button
                className="flex-1 flex items-center gap-3 text-left min-w-0"
                onClick={() => onSelectCollection(collection.id)}
              >
                <Folder className="h-5 w-5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{collection.name}</p>
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
                  onEditCollection(collection);
                }}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          ))}

          {collections.length === 0 && (
            <p className="text-center text-white/50 text-sm py-8 px-4">
              Create collections to organize your itineraries
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
