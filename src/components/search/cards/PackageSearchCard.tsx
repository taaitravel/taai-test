import { Badge } from '@/components/ui/badge';
import { Plane, Hotel, Car, Sparkles, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useState } from 'react';
import { ItineraryMatcherModal } from '../ItineraryMatcherModal';

interface PackageSearchCardProps {
  package: any;
}

export const PackageSearchCard = ({ package: pkg }: PackageSearchCardProps) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const flightPrice = pkg.flight?.price || 450;
  const hotelPrice = pkg.hotel?.price || 199;
  const carPrice = pkg.car?.price || 45;
  const regularTotal = flightPrice + hotelPrice + carPrice;
  const discount = Math.round(regularTotal * 0.15);
  const packagePrice = regularTotal - discount;

  const handleAddToItinerary = () => {
    setShowModal(true);
  };

  const handleModalConfirm = async (itineraryId: string | 'new', newItineraryName?: string, startDate?: string, endDate?: string) => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: 'Authentication Required',
          description: 'Please sign in to add items to your itinerary',
          variant: 'destructive',
        });
        return;
      }

      let targetItineraryId = itineraryId;

      // If 'new', create the itinerary first
      if (itineraryId === 'new') {
        const { data: newItin, error: createError } = await supabase
          .from('itinerary')
          .insert({
            userid: user.id,
            itin_name: newItineraryName,
            itin_date_start: startDate,
            itin_date_end: endDate,
          })
          .select()
          .single();

        if (createError) throw createError;
        targetItineraryId = newItin.id.toString();
      }

      // Fetch the itinerary to get its itin_id (UUID)
      const { data: itinData, error: itinError } = await supabase
        .from('itinerary')
        .select('itin_id')
        .eq('id', parseInt(targetItineraryId))
        .single();

      if (itinError) throw itinError;

      const { error } = await supabase
        .from('cart_items')
        .insert({
          user_id: user.id,
          itinerary_id: itinData.itin_id,
          type: 'package',
          external_ref: pkg.id || `package-${Date.now()}`,
          price: packagePrice,
          item_data: {
            flight: pkg.flight,
            hotel: pkg.hotel,
            car: pkg.car,
            flightPrice: flightPrice,
            hotelPrice: hotelPrice,
            carPrice: carPrice,
            regularTotal: regularTotal,
            discount: discount,
            packagePrice: packagePrice,
            bookingStatus: 'pending'
          }
        });

      if (error) throw error;

      toast({
        title: 'Package Saved',
        description: 'Added to your itinerary as a pending booking',
      });

      setShowModal(false);
    } catch (error) {
      console.error('Error saving package:', error);
      toast({
        title: 'Error',
        description: 'Failed to save package to itinerary',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-[255px] h-[375px] space-y-4 flex flex-col overflow-hidden">
      {/* Package Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Complete Package Deal
          </h3>
          <p className="text-white/70 text-xs">Flight + Hotel + Car</p>
        </div>
        <Badge className="bg-primary/20 text-primary border-primary/30 text-base px-4 py-2">
          Save ${discount}
        </Badge>
      </div>

      {/* Flight Section */}
      <div className="bg-white/5 p-4 rounded-lg border border-white/20">
        <div className="flex items-center gap-2 mb-2">
          <Plane className="h-5 w-5 text-white/60" />
          <h4 className="text-white font-semibold">Flight</h4>
        </div>
        <p className="text-white/70 text-sm">{pkg.flight?.airline} - {pkg.flight?.from} → {pkg.flight?.to}</p>
        <p className="text-white/60 text-sm line-through mt-1">${flightPrice}</p>
      </div>

      {/* Hotel Section */}
      <div className="bg-white/5 p-4 rounded-lg border border-white/20">
        <div className="flex items-center gap-2 mb-2">
          <Hotel className="h-5 w-5 text-white/60" />
          <h4 className="text-white font-semibold">Hotel</h4>
        </div>
        <p className="text-white/70 text-sm">{pkg.hotel?.name}</p>
        <p className="text-white/60 text-sm">{pkg.hotel?.location}</p>
        <p className="text-white/60 text-sm line-through mt-1">${hotelPrice}</p>
      </div>

      {/* Car Section */}
      <div className="bg-white/5 p-4 rounded-lg border border-white/20">
        <div className="flex items-center gap-2 mb-2">
          <Car className="h-5 w-5 text-white/60" />
          <h4 className="text-white font-semibold">Car Rental</h4>
        </div>
        <p className="text-white/70 text-sm">{pkg.car?.name || 'Toyota Camry'}</p>
        <p className="text-white/60 text-sm line-through mt-1">${carPrice}</p>
      </div>

      {/* Package Price */}
      <div className="pt-4 border-t border-white/10">
        <div className="bg-gradient-to-r from-primary/20 to-primary/10 p-6 rounded-lg border border-primary/30 mb-4">
          <div className="text-center">
            <p className="text-white/70 text-xs mb-1">Package Total</p>
            <p className="text-white/60 text-xs line-through mb-2">${Math.ceil(regularTotal).toLocaleString('en-US')}</p>
            <p className="text-3xl font-bold" style={{ color: '#ff849c' }}>
              ${Math.ceil(packagePrice).toLocaleString('en-US')}
            </p>
            <p className="text-white/40 text-xs mt-1">including taxes and fees</p>
            <p className="text-primary font-semibold text-sm mt-2">Save 15% vs booking separately!</p>
          </div>
        </div>
      </div>

      {/* Add to Itinerary Button */}
      <div className="pt-4 border-t border-white/10 mt-auto flex-shrink-0 min-h-[52px]">
        <Button
          onClick={handleAddToItinerary}
          disabled={saving}
          className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
        >
          <Plus className="mr-2 h-4 w-4" />
          {saving ? 'Saving...' : 'Package'}
        </Button>
      </div>

      <ItineraryMatcherModal
        open={showModal}
        onOpenChange={setShowModal}
        searchDates={{
          checkin: pkg.startDate || new Date().toISOString().split('T')[0],
          checkout: pkg.endDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
        }}
        item={pkg}
        onConfirm={handleModalConfirm}
      />
    </div>
  );
};
