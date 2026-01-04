import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DndContext, DragEndEvent, DragOverlay, pointerWithin } from '@dnd-kit/core';
import { LayoutGrid, Map, List, Plus, ArrowLeft, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CollectionsSidebar } from '@/components/my-itineraries/CollectionsSidebar';
import { ItineraryGrid } from '@/components/my-itineraries/ItineraryGrid';
import { ItineraryList } from '@/components/my-itineraries/ItineraryList';
import { ItineraryMapView } from '@/components/my-itineraries/ItineraryMapView';
import { CollectionDialog } from '@/components/my-itineraries/CollectionDialog';
import { AddToCollectionDialog } from '@/components/my-itineraries/AddToCollectionDialog';
import { ItineraryCard } from '@/components/my-itineraries/ItineraryCard';
import { GridFilters, GridSortField, GridSortDirection } from '@/components/my-itineraries/GridFilters';
import { FloatingCollectionDropZone } from '@/components/my-itineraries/FloatingCollectionDropZone';
import { useItineraryCollections, Collection } from '@/hooks/useItineraryCollections';
import { useDashboardData } from '@/hooks/useDashboardData';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { ItineraryData } from '@/types/itinerary';
import { useIsMobile } from '@/hooks/use-mobile';

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
  
  // Grid sorting state
  const [gridSortField, setGridSortField] = useState<GridSortField>('date');
  const [gridSortDirection, setGridSortDirection] = useState<GridSortDirection>('desc');

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

  // Filter and sort itineraries based on selected collection and grid sort
  const filteredItineraries = useMemo(() => {
    let result = activeItineraries;
    
    if (selectedCollectionId) {
      result = activeItineraries.filter(it => collectionItineraryIds.includes(it.id));
    }
    
    // Sort based on grid sort settings
    return result.sort((a, b) => {
      let comparison = 0;
      
      switch (gridSortField) {
        case 'date':
          const dateA = new Date(a.itin_date_start || 0).getTime();
          const dateB = new Date(b.itin_date_start || 0).getTime();
          comparison = dateA - dateB;
          break;
        case 'spending':
          comparison = (a.spending || 0) - (b.spending || 0);
          break;
        case 'name':
          comparison = (a.itin_name || '').localeCompare(b.itin_name || '');
          break;
        case 'attendees':
          comparison = (a.attendees?.length || 1) - (b.attendees?.length || 1);
          break;
      }
      
      return gridSortDirection === 'asc' ? comparison : -comparison;
    });
  }, [activeItineraries, selectedCollectionId, collectionItineraryIds, gridSortField, gridSortDirection]);

  const handleGridSortChange = (field: GridSortField, direction: GridSortDirection) => {
    setGridSortField(field);
    setGridSortDirection(direction);
  };

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
      const itinerary = active.data.current.itinerary as ItineraryData;
      
      // Handle "Create new collection" drop
      if (overId === 'collection-new') {
        setSelectedItineraryIds([itinerary.id]);
        setAddToCollectionOpen(true);
        return;
      }
      
      const collectionId = overId.replace('collection-', '');
      const collection = collections.find(c => c.id === collectionId);
      
      await addToCollection(collectionId, [itinerary.id]);
      
      toast({
        title: 'Added to collection',
        description: `"${itinerary.itin_name || 'Untitled Trip'}" added to "${collection?.name}"`,
      });
    }
  };

  const loading = collectionsLoading || itinerariesLoading;
  const isMobile = useIsMobile();

  // Mobile collections component (circular avatars)
  const MobileCollections = () => (
    <div className="w-full bg-[#12131a] border-b border-white/10 p-4">
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide justify-start">
        {/* All Itineraries */}
        <button
          className="flex flex-col items-center gap-1.5 flex-shrink-0"
          onClick={() => setSelectedCollectionId(null)}
        >
          <div className={`w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all ${
            selectedCollectionId === null
              ? 'bg-primary/20 border-[#ffce87]'
              : 'bg-white/10 border-transparent hover:bg-white/20'
          }`}>
            <Globe className={`h-6 w-6 ${selectedCollectionId === null ? 'text-[#ffce87]' : 'text-white/80'}`} />
          </div>
          <span className="text-xs text-white/60 max-w-[56px] truncate">All</span>
        </button>

        {/* User Collections */}
        {collections.map((collection) => (
          <button
            key={collection.id}
            className="flex flex-col items-center gap-1.5 flex-shrink-0"
            onClick={() => setSelectedCollectionId(collection.id)}
          >
            <div className={`w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all ${
              selectedCollectionId === collection.id
                ? 'bg-primary/20 border-[#ffce87]'
                : 'bg-white/10 border-transparent hover:bg-white/20'
            }`}>
              <span className={`text-lg font-semibold ${
                selectedCollectionId === collection.id ? 'text-[#ffce87]' : 'text-white/80'
              }`}>
                {collection.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-xs text-white/60 max-w-[56px] truncate">{collection.name}</span>
          </button>
        ))}

        {/* New Collection */}
        <button
          className="flex flex-col items-center gap-1.5 flex-shrink-0"
          onClick={handleCreateCollection}
        >
          <div className="w-14 h-14 rounded-full bg-white/10 border-2 border-dashed border-white/30 flex items-center justify-center hover:bg-white/20 transition-all">
            <Plus className="h-6 w-6 text-white/60" />
          </div>
          <span className="text-xs text-white/60">New</span>
        </button>
      </div>
    </div>
  );

  return (
    <DndContext
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="min-h-screen bg-[#171821] flex flex-col md:flex-row">
        {/* Desktop Sidebar - hidden on mobile */}
        {!isMobile && (
          <CollectionsSidebar
            collections={collections}
            selectedCollectionId={selectedCollectionId}
            onSelectCollection={setSelectedCollectionId}
            onCreateCollection={handleCreateCollection}
            onEditCollection={handleEditCollection}
            totalItineraries={activeItineraries.length}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="border-b border-white/10 px-4 md:px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
                  <h1 className="text-xl md:text-2xl font-bold text-white">
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

              <div className="flex items-center gap-2 sm:gap-4">
                {/* View Toggle */}
                <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
                  <TabsList className="bg-white/10">
                    <TabsTrigger value="grid" className="gap-1 sm:gap-2 px-2 sm:px-3 data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/60">
                      <LayoutGrid className="h-4 w-4" />
                      <span className="hidden sm:inline">Grid</span>
                    </TabsTrigger>
                    <TabsTrigger value="map" className="gap-1 sm:gap-2 px-2 sm:px-3 data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/60">
                      <Map className="h-4 w-4" />
                      <span className="hidden sm:inline">Map</span>
                    </TabsTrigger>
                    <TabsTrigger value="list" className="gap-1 sm:gap-2 px-2 sm:px-3 data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/60">
                      <List className="h-4 w-4" />
                      <span className="hidden sm:inline">List</span>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                <Button onClick={() => navigate('/create-itinerary')} className="gap-2" size={isMobile ? 'icon' : 'default'}>
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">New Itinerary</span>
                </Button>
              </div>
            </div>
          </header>

          {/* Mobile Collections - shown above content on mobile for grid/list views */}
          {isMobile && viewMode !== 'map' && <MobileCollections />}

          {/* Content */}
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            {loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="w-full aspect-[255/375] rounded-lg bg-white/10" />
                ))}
              </div>
            ) : (
              <>
                {viewMode === 'grid' && (
                  <>
                    <GridFilters
                      sortField={gridSortField}
                      sortDirection={gridSortDirection}
                      onSortChange={handleGridSortChange}
                    />
                    <ItineraryGrid
                      itineraries={filteredItineraries}
                      onAddToCollection={handleAddToCollection}
                      onRemoveFromCollection={selectedCollectionId ? handleRemoveFromCollection : undefined}
                      collectionId={selectedCollectionId || undefined}
                    />
                  </>
                )}
                {viewMode === 'map' && (
                  <div className="flex flex-col h-full">
                    {/* Map takes full width on mobile */}
                    <div className="w-full h-[50vh] md:h-[calc(100vh-200px)] rounded-lg overflow-hidden">
                      <ItineraryMapView itineraries={filteredItineraries} />
                    </div>
                    {/* Collections below map on mobile */}
                    {isMobile && <MobileCollections />}
                  </div>
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

        {/* Floating Collection Drop Zone - appears during drag */}
        <FloatingCollectionDropZone
          collections={collections}
          isVisible={draggingItinerary !== null}
          onCreateCollection={handleCreateCollection}
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
