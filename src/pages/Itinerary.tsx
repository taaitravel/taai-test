import { useSearchParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ItineraryHeader } from "@/components/itinerary/ItineraryHeader";
import { ItineraryContent } from "@/components/itinerary/ItineraryContent";
import { ItineraryBreadcrumb } from "@/components/itinerary/ItineraryBreadcrumb";
import { AttendeesSection } from "@/components/itinerary/AttendeesSection";
import { ItineraryLoadingState } from "@/components/itinerary/ItineraryLoadingState";
import { useAuthenticatedItineraryData } from "@/hooks/useAuthenticatedItineraryData";
import { useBrowserState } from "@/hooks/useBrowserState";
import { AddItemDialog, ItemType } from "@/components/itinerary/AddItemDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Itinerary = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const itineraryId = searchParams.get('id');

  useEffect(() => {
    if (!itineraryId) {
      console.log('No itinerary ID provided, redirecting to home');
      navigate('/home');
    }
  }, [itineraryId, navigate]);
  
  const { itineraryData, loading, userRole, budgetRefreshTrigger, refreshMapData, refreshBudgetData } = useAuthenticatedItineraryData(itineraryId);
  
  const {
    browserState,
    openFlightBrowser, openHotelBrowser, openActivityBrowser, openReservationBrowser,
    closeFlightBrowser, closeHotelBrowser, closeActivityBrowser, closeReservationBrowser,
    setCurrentFlightIndex, setCurrentHotelIndex, setCurrentActivityIndex, setCurrentReservationIndex,
  } = useBrowserState();

  // Edit modal state
  const [editOpen, setEditOpen] = useState(false);
  const [editType, setEditType] = useState<ItemType | null>(null);
  const [editIndex, setEditIndex] = useState<number>(0);
  const [initialItem, setInitialItem] = useState<any | null>(null);

  const openEdit = (type: ItemType, index: number) => {
    if (!itineraryData) return;
    setEditType(type);
    setEditIndex(index);
    const arr = (itineraryData as any)[type] || [];
    setInitialItem(arr[index]);
    setEditOpen(true);
  };

  const handleEditSubmit = async (type: ItemType, item: any) => {
    if (!itineraryData) return;
    
    try {
      // Check if editing a cart item
      if (initialItem?.from_cart && initialItem?.cart_id) {
        const updateData: any = {
          price: parseFloat(item.cost || item.price || 0),
          item_data: {
            ...item,
            cost: parseFloat(item.cost || item.price || 0),
            price: parseFloat(item.cost || item.price || 0),
          },
          updated_at: new Date().toISOString()
        };
        
        const { error } = await supabase
          .from('cart_items')
          .update(updateData)
          .eq('id', initialItem.cart_id);
        
        if (error) throw error;
        setEditOpen(false);
        refreshMapData();
        refreshBudgetData();
        return;
      }
      
      // Legacy JSON editing
      const current = ((itineraryData as any)[type] || []) as any[];
      let updated;
      
      if (editIndex === -1) {
        updated = [...current, item];
      } else {
        updated = [...current];
        updated[editIndex] = item;
      }

      let newMapLocations = ([...(itineraryData.itin_map_locations || [])] as any[]);
      const loc = (item as any).location;
      if (loc && typeof loc.lat === 'number' && typeof loc.lng === 'number') {
        const category = type === 'hotels' ? 'hotel' : type === 'activities' ? 'activity' : type === 'reservations' ? 'reservation' : undefined;
        const cityName = loc.name || item.city || '';
        if (category && cityName) {
          const exists = newMapLocations.some((l: any) => l.lat === loc.lat && l.lng === loc.lng && l.city === cityName);
          if (!exists) {
            newMapLocations = [...newMapLocations, { city: cityName, lat: loc.lat, lng: loc.lng, category }];
          }
        }
      }

      const { error } = await supabase.from('itinerary').update({ [type]: updated, itin_map_locations: newMapLocations }).eq('id', itineraryData.id);
      if (error) throw error;
      setEditOpen(false);
      refreshMapData();
      refreshBudgetData();
    } catch (error: any) {
      console.error('Error updating item:', error);
      toast.error(error?.message?.includes('row-level security') 
        ? "You don't have permission to edit this item" 
        : "Failed to update item. Please try again.");
    }
  };

  const handleEdit = async (type: ItemType, index: number) => {
    if (!itineraryData) return;
    const items = ((itineraryData as any)[type] || []) as any[];
    const item = items[index];
    
    if (item?.from_cart && item?.cart_id) {
      setEditType(type);
      setEditIndex(index);
      setInitialItem(item);
      setEditOpen(true);
    } else {
      openEdit(type, index);
    }
  };

  const handleDelete = async (type: string, index: number) => {
    if (!itineraryData) return;
    try {
      const itemType = type as ItemType;
      const items = ((itineraryData as any)[itemType] || []) as any[];
      const item = items[index];
      
      if (item?.from_cart && item?.cart_id) {
        const { error } = await supabase
          .from('cart_items')
          .delete()
          .eq('id', item.cart_id);
        
        if (error) throw error;
      } else {
        const updated = items.filter((_, i) => i !== index);
        const { error } = await supabase.from('itinerary').update({ [itemType]: updated }).eq('id', itineraryData.id);
        if (error) throw error;
      }
      refreshMapData();
      refreshBudgetData();
    } catch (error: any) {
      console.error('Error deleting item:', error);
      toast.error(error?.message?.includes('row-level security') 
        ? "You don't have permission to delete this item" 
        : "Failed to delete item. Please try again.");
    }
  };

  if (loading) {
    return <ItineraryLoadingState message="Loading your itinerary..." />;
  }

  if (!itineraryData) {
    return <ItineraryLoadingState message="No itinerary found..." />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="px-4 sm:px-6 lg:px-8 py-4">
        <ItineraryHeader itineraryId={itineraryData.id} itineraryData={itineraryData} userRole={userRole} />
      </div>

      {userRole === 'collaborator' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-accent/50 border border-accent rounded-lg px-4 py-2 text-sm text-muted-foreground">
            You're a collaborator on this trip — you can add and manage items but can't edit trip details.
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ItineraryBreadcrumb
          itineraryId={itineraryData.id}
          itineraryName={itineraryData.itin_name || 'Untitled Trip'}
        />
      </div>
      
      <ItineraryContent
        itineraryData={itineraryData}
        budgetRefreshTrigger={budgetRefreshTrigger}
        refreshBudgetData={refreshBudgetData}
        onFlightClick={openFlightBrowser}
        onHotelClick={openHotelBrowser}
        onActivityClick={openActivityBrowser}
        onReservationClick={openReservationBrowser}
        onEdit={handleEdit}
        onDelete={handleDelete}
        refreshMapData={refreshMapData}
        userRole={userRole}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AttendeesSection itineraryId={itineraryData.id} />
      </div>

      <AddItemDialog
        open={editOpen}
        type={editType}
        onClose={() => setEditOpen(false)}
        onSubmit={handleEditSubmit}
        onDelete={() => editType && handleDelete(editType, editIndex)}
        initialItem={initialItem}
        defaultCity={(itineraryData.itin_locations || [])[0] || ''}
        suggestions={{ cities: itineraryData.itin_locations || [] }}
      />
    </div>
  );
};

export default Itinerary;
