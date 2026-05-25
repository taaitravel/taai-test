import React, { useEffect, useState } from 'react';
import { Plus, ChevronRight, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MobileItineraryStack } from './MobileItineraryStack';
import { Collection } from '@/hooks/useItineraryCollections';
import { ItineraryData } from '@/types/itinerary';

interface MobileStacksViewProps {
  allItineraries: ItineraryData[];
  collections: Collection[];
  selectedCollectionId: string | null;
  onSelectCollection: (id: string | null) => void;
  onCreateCollection: () => void;
  onAddToCollection: (itineraryId: number) => void;
  onRemoveFromCollection: (collectionId: string, itineraryId: number) => void;
  getCollectionItineraries: (collectionId: string) => Promise<number[]>;
}

export const MobileStacksView: React.FC<MobileStacksViewProps> = ({
  allItineraries,
  collections,
  selectedCollectionId,
  onSelectCollection,
  onCreateCollection,
  onAddToCollection,
  onRemoveFromCollection,
  getCollectionItineraries,
}) => {
  const [idMap, setIdMap] = useState<Record<string, number[]>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        collections.map(async (c) => [c.id, await getCollectionItineraries(c.id)] as const)
      );
      if (cancelled) return;
      setIdMap(Object.fromEntries(entries));
    })();
    return () => { cancelled = true; };
  }, [collections, getCollectionItineraries]);

  const renderSection = (
    key: string,
    label: string,
    items: ItineraryData[],
    collectionId?: string,
    icon?: React.ReactNode,
  ) => (
    <section key={key} className="space-y-3">
      <header className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2 min-w-0">
          {icon}
          <h2 className="text-base font-semibold text-foreground truncate">{label}</h2>
          <span className="text-xs text-muted-foreground">({items.length})</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1 text-xs text-muted-foreground"
          onClick={() => onSelectCollection(collectionId ?? null)}
        >
          Open <ChevronRight className="h-3 w-3" />
        </Button>
      </header>

      {items.length === 0 ? (
        <div className="border border-dashed border-border rounded-lg p-6 text-center text-sm text-muted-foreground">
          No itineraries in this stack yet
        </div>
      ) : (
        <MobileItineraryStack
          itineraries={items}
          onAddToCollection={onAddToCollection}
          onRemoveFromCollection={collectionId ? (id) => onRemoveFromCollection(collectionId, id) : undefined}
          collectionId={collectionId}
        />
      )}
    </section>
  );

  // If a specific stack is selected via the top bubble row, only show that section
  const sectionsToRender: Array<{
    key: string;
    label: string;
    items: ItineraryData[];
    collectionId?: string;
    icon?: React.ReactNode;
  }> = [];

  if (selectedCollectionId === null) {
    sectionsToRender.push({
      key: 'all',
      label: 'All Itineraries',
      items: allItineraries,
      icon: <Globe className="h-4 w-4 text-muted-foreground" />,
    });
    collections.forEach((c) => {
      const ids = idMap[c.id] || [];
      sectionsToRender.push({
        key: c.id,
        label: c.name,
        items: allItineraries.filter((it) => ids.includes(it.id)),
        collectionId: c.id,
      });
    });
  } else {
    const c = collections.find((x) => x.id === selectedCollectionId);
    const ids = idMap[selectedCollectionId] || [];
    if (c) {
      sectionsToRender.push({
        key: c.id,
        label: c.name,
        items: allItineraries.filter((it) => ids.includes(it.id)),
        collectionId: c.id,
      });
    }
  }

  return (
    <div className="space-y-8 pb-8">
      {sectionsToRender.map((s) => renderSection(s.key, s.label, s.items, s.collectionId, s.icon))}

      {/* New Stack action */}
      <button
        onClick={onCreateCollection}
        className="w-full border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center gap-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
      >
        <Plus className="h-6 w-6" />
        <span className="text-sm font-medium">New Stack</span>
      </button>
    </div>
  );
};