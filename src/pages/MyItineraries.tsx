import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DndContext, DragEndEvent, DragOverlay, pointerWithin } from '@dnd-kit/core';
import { LayoutGrid, Map, List, Plus, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CollectionsSidebar } from '@/components/my-itineraries/CollectionsSidebar';
import { ItineraryGrid } from '@/components/my-itineraries/ItineraryGrid';
import { ItineraryList } from '@/components/my-itineraries/ItineraryList';
import { ItineraryMapView } from '@/components/my-itineraries/ItineraryMapView';
import { CollectionDialog } from '@/components/my-itineraries/CollectionDialog';
import { AddToCollectionDialog } from '@/components/my-itineraries/AddToCollectionDialog';
import { ItineraryCard } from '@/components/my-itineraries/ItineraryCard';
import { useItineraryCollections, Collection } from '@/hooks/useItineraryCollections';
import { useDashboardData } from '@/hooks/useDashboardData';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { ItineraryData } from '@/types/itinerary';

type ViewMode = 'grid' | 'map' | 'list';

const MyItineraries = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [collectionDialogOpen, setCollectionDialogOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [addToCollectionOpen, setAddToCollectionOpen] = useState(false);
  const [selectedItineraryIds, setSelectedItineraryIds] = useState<number[]>([]);
  const [collectionItineraryIds, setCollectionItineraryIds] = useState<number[]>([]);
  const [draggingItinerary, setDraggingItinerary] = useState<ItineraryData | null>(null);

  const { 
    collections, 
    loading: collectionsLoading,
    createCollection,
    updateCollection,
    deleteCollection,
    addToCollection,
    removeFromCollection,
    getCollectionItineraries
  } = useItineraryCollections();

  const { activeItineraries, loading: itinerariesLoading } = useDashboardData();

  // Fetch itinerary IDs for selected collection
  useEffect(() => {
    const fetchCollectionItineraries = async () => {
      if (selectedCollectionId) {
        const ids = await getCollectionItineraries(selectedCollectionId);
        setCollectionItineraryIds(ids);
      } else {
        setCollectionItineraryIds([]);
      }
    };
    fetchCollectionItineraries();
  }, [selectedCollectionId, getCollectionItineraries, collections]);

  // Filter and sort itineraries based on selected collection
  const filteredItineraries = useMemo(() => {
    let result = activeItineraries;
    
    if (selectedCollectionId) {
      result = activeItineraries.filter(it => collectionItineraryIds.includes(it.id));
    }
    
    // Sort by date (newest first)
    return result.sort((a, b) => {
      const dateA = new Date(a.itin_date_start || 0).getTime();
      const dateB = new Date(b.itin_date_start || 0).getTime();
      return dateB - dateA;
    });
  }, [activeItineraries, selectedCollectionId, collectionItineraryIds]);

  const handleCreateCollection = () => {
    setEditingCollection(null);
    setCollectionDialogOpen(true);
  };

  const handleEditCollection = (collection: Collection) => {
    setEditingCollection(collection);
    setCollectionDialogOpen(true);
  };

  const handleSaveCollection = async (name: string, description?: string) => {
    if (editingCollection) {
      await updateCollection(editingCollection.id, name, description);
    } else {
      await createCollection(name, description);
    }
  };

  const handleDeleteCollection = async (deleteItineraries: boolean) => {
    if (editingCollection) {
      await deleteCollection(editingCollection.id, deleteItineraries);
      if (selectedCollectionId === editingCollection.id) {
        setSelectedCollectionId(null);
      }
    }
  };

  const handleAddToCollection = (itineraryId: number) => {
    setSelectedItineraryIds([itineraryId]);
    setAddToCollectionOpen(true);
  };

  const handleBulkAddToCollection = (itineraryIds: number[]) => {
    setSelectedItineraryIds(itineraryIds);
    setAddToCollectionOpen(true);
  };

  const handleSelectCollectionForAdd = async (collectionId: string) => {
    await addToCollection(collectionId, selectedItineraryIds);
  };

  const handleCreateAndAdd = async (name: string) => {
    const newCollection = await createCollection(name);
    if (newCollection) {
      await addToCollection(newCollection.id, selectedItineraryIds);
    }
  };

  const handleRemoveFromCollection = async (itineraryId: number) => {
    if (selectedCollectionId) {
      await removeFromCollection(selectedCollectionId, itineraryId);
    }
  };

  const handleDragStart = (event: any) => {
    const { active } = event;
    if (active.data.current?.type === 'itinerary') {
      setDraggingItinerary(active.data.current.itinerary);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggingItinerary(null);
    
    if (!over) return;
    
    // Check if dropped on a collection
    const overId = over.id.toString();
    if (overId.startsWith('collection-') && active.data.current?.type === 'itinerary') {
      const collectionId = overId.replace('collection-', '');
      const itinerary = active.data.current.itinerary as ItineraryData;
      const collection = collections.find(c => c.id === collectionId);
      
      await addToCollection(collectionId, [itinerary.id]);
      
      toast({
        title: 'Added to collection',
        description: `"${itinerary.itin_name || 'Untitled Trip'}" added to "${collection?.name}"`,
      });
    }
  };

  const loading = collectionsLoading || itinerariesLoading;

  return (
    <DndContext
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="min-h-screen bg-[#171821] flex">
        {/* Sidebar */}
        <CollectionsSidebar
          collections={collections}
          selectedCollectionId={selectedCollectionId}
          onSelectCollection={setSelectedCollectionId}
          onCreateCollection={handleCreateCollection}
          onEditCollection={handleEditCollection}
          totalItineraries={activeItineraries.length}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="border-b border-white/10 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="text-white/60 hover:text-white hover:bg-white/10"
                  onClick={() => navigate('/dashboard')}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    {selectedCollectionId 
                      ? collections.find(c => c.id === selectedCollectionId)?.name || 'Collection'
                      : 'All Itineraries'
                    }
                  </h1>
                  <p className="text-sm text-white/60">
                    {filteredItineraries.length} itinerary{filteredItineraries.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* View Toggle */}
                <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
                  <TabsList className="bg-white/10">
                    <TabsTrigger value="grid" className="gap-2 data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/60">
                      <LayoutGrid className="h-4 w-4" />
                      Grid
                    </TabsTrigger>
                    <TabsTrigger value="map" className="gap-2 data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/60">
                      <Map className="h-4 w-4" />
                      Map
                    </TabsTrigger>
                    <TabsTrigger value="list" className="gap-2 data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/60">
                      <List className="h-4 w-4" />
                      List
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                <Button onClick={() => navigate('/create-itinerary')} className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Itinerary
                </Button>
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 p-6 overflow-auto">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="w-[255px] h-[375px] rounded-lg bg-white/10" />
                ))}
              </div>
            ) : (
              <>
                {viewMode === 'grid' && (
                  <ItineraryGrid
                    itineraries={filteredItineraries}
                    onAddToCollection={handleAddToCollection}
                    onRemoveFromCollection={selectedCollectionId ? handleRemoveFromCollection : undefined}
                    collectionId={selectedCollectionId || undefined}
                  />
                )}
                {viewMode === 'map' && (
                  <ItineraryMapView itineraries={filteredItineraries} />
                )}
                {viewMode === 'list' && (
                  <ItineraryList
                    itineraries={filteredItineraries}
                    onAddToCollection={handleAddToCollection}
                    onRemoveFromCollection={selectedCollectionId ? handleRemoveFromCollection : undefined}
                    onBulkAddToCollection={handleBulkAddToCollection}
                    collectionId={selectedCollectionId || undefined}
                  />
                )}
              </>
            )}
          </main>
        </div>

        {/* Dialogs */}
        <CollectionDialog
          open={collectionDialogOpen}
          onOpenChange={setCollectionDialogOpen}
          collection={editingCollection}
          onSave={handleSaveCollection}
          onDelete={editingCollection ? handleDeleteCollection : undefined}
        />

        <AddToCollectionDialog
          open={addToCollectionOpen}
          onOpenChange={setAddToCollectionOpen}
          collections={collections}
          onSelectCollection={handleSelectCollectionForAdd}
          onCreateNew={handleCreateAndAdd}
          itineraryCount={selectedItineraryIds.length}
        />

        {/* Drag Overlay for visual feedback */}
        <DragOverlay>
          {draggingItinerary ? (
            <div className="opacity-90 rotate-3">
              <ItineraryCard itinerary={draggingItinerary} />
            </div>
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
};

export default MyItineraries;
