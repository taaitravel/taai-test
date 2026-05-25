import React, { useEffect, useState } from 'react';
import { Plus, Globe, Folder } from 'lucide-react';
import { StackSection } from '@/components/itinerary-stacks/StackSection';
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

  const collectionIdsKey = collections.map((c) => c.id).join(',');
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        collections.map(async (c) => [c.id, await getCollectionItineraries(c.id)] as const)
      );
      if (cancelled) return;
      setIdMap(Object.fromEntries(entries));
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionIdsKey]);

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
      icon: <Globe className="h-5 w-5" />,
    });
    collections.forEach((c) => {
      const ids = idMap[c.id] || [];
      sectionsToRender.push({
        key: c.id,
        label: c.name,
        items: allItineraries.filter((it) => ids.includes(it.id)),
        collectionId: c.id,
        icon: <Folder className="h-5 w-5" />,
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
        icon: <Folder className="h-5 w-5" />,
      });
    }
  }

  return (
    <div className="space-y-10 pb-8">
      {sectionsToRender.map((s) => (
        <StackSection
          key={s.key}
          title={s.label}
          icon={s.icon}
          items={s.items}
          showCollectionActions
          collectionId={s.collectionId}
          onAddToCollection={onAddToCollection}
          onRemoveFromCollection={
            s.collectionId ? (id) => onRemoveFromCollection(s.collectionId!, id) : undefined
          }
          onOpen={() => onSelectCollection(s.collectionId ?? null)}
          emptyMessage="No itineraries in this stack yet"
        />
      ))}

      {/* New Stack action */}
      <button
        onClick={onCreateCollection}
        className="mx-auto w-full max-w-[255px] border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center gap-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
      >
        <Plus className="h-6 w-6" />
        <span className="text-sm font-medium">New Stack</span>
      </button>
    </div>
  );
};