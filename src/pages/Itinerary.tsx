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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plane, Building2, MapPin, Utensils, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <ItineraryHeader itineraryId={itineraryData.id} itineraryData={itineraryData} userRole={userRole} />

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

      {/* Item Detail Viewer */}
      <ItemDetailDialog
        browserState={browserState}
        itineraryData={itineraryData}
        onClose={() => {
          if (browserState.flightBrowserOpen) closeFlightBrowser();
          else if (browserState.hotelBrowserOpen) closeHotelBrowser();
          else if (browserState.activityBrowserOpen) closeActivityBrowser();
          else if (browserState.reservationBrowserOpen) closeReservationBrowser();
        }}
        onEdit={(type, index) => {
          if (browserState.flightBrowserOpen) closeFlightBrowser();
          else if (browserState.hotelBrowserOpen) closeHotelBrowser();
          else if (browserState.activityBrowserOpen) closeActivityBrowser();
          else if (browserState.reservationBrowserOpen) closeReservationBrowser();
          handleEdit(type, index);
        }}
      />
    </div>
  );
};

/* ---- Item Detail Viewer ---- */
const iconMap = {
  flights: Plane,
  hotels: Building2,
  activities: MapPin,
  reservations: Utensils,
} as const;

const labelMap = { flights: 'Flight', hotels: 'Hotel', activities: 'Activity', reservations: 'Reservation' } as const;

function ItemDetailDialog({ browserState, itineraryData, onClose, onEdit }: {
  browserState: any;
  itineraryData: any;
  onClose: () => void;
  onEdit: (type: ItemType, index: number) => void;
}) {
  const isOpen = browserState.flightBrowserOpen || browserState.hotelBrowserOpen || browserState.activityBrowserOpen || browserState.reservationBrowserOpen;

  let type: ItemType = 'flights';
  let index = 0;
  if (browserState.flightBrowserOpen) { type = 'flights'; index = browserState.currentFlightIndex; }
  else if (browserState.hotelBrowserOpen) { type = 'hotels'; index = browserState.currentHotelIndex; }
  else if (browserState.activityBrowserOpen) { type = 'activities'; index = browserState.currentActivityIndex; }
  else if (browserState.reservationBrowserOpen) { type = 'reservations'; index = browserState.currentReservationIndex; }

  const items = (itineraryData?.[type] || []) as any[];
  const item = items[index];
  const Icon = iconMap[type];

  if (!isOpen || !item) return null;

  const fields: { label: string; value: string | number | undefined }[] = [];
  if (type === 'flights') {
    fields.push({ label: 'Airline', value: item.airline }, { label: 'Flight #', value: item.flight_number }, { label: 'From', value: item.from }, { label: 'To', value: item.to }, { label: 'Departure', value: item.departure }, { label: 'Arrival', value: item.arrival });
  } else if (type === 'hotels') {
    fields.push({ label: 'Name', value: item.name }, { label: 'City', value: item.city }, { label: 'Check-in', value: item.check_in }, { label: 'Check-out', value: item.check_out }, { label: 'Rating', value: item.rating });
  } else if (type === 'activities') {
    fields.push({ label: 'Name', value: item.name }, { label: 'City', value: item.city }, { label: 'Date', value: item.date }, { label: 'Duration', value: item.duration });
  } else {
    fields.push({ label: 'Name', value: item.name }, { label: 'Type', value: item.type }, { label: 'City', value: item.city }, { label: 'Date', value: item.date }, { label: 'Time', value: item.time }, { label: 'Party size', value: item.party_size });
  }
  const cost = item.cost ?? item.price ?? 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-primary" />
            {labelMap[type]} Details
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          {fields.filter(f => f.value != null && f.value !== '').map(f => (
            <div key={f.label} className="flex justify-between">
              <span className="text-muted-foreground">{f.label}</span>
              <span className="font-medium text-right max-w-[60%] truncate">{f.value}</span>
            </div>
          ))}
          {cost > 0 && (
            <div className="flex justify-between border-t pt-2">
              <span className="text-muted-foreground">Cost</span>
              <span className="font-semibold">${Number(cost).toLocaleString()}</span>
            </div>
          )}
        </div>
        <div className="flex justify-end pt-2">
          <Button variant="outline" size="sm" onClick={() => onEdit(type, index)}>
            <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default Itinerary;
