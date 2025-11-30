import { Badge } from '@/components/ui/badge';
import { Car, Users, Settings, Navigation, Fuel, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useState } from 'react';
import { ItineraryMatcherModal } from '../ItineraryMatcherModal';

interface CarSearchCardProps {
  car: any;
}

export const CarSearchCard = ({ car }: CarSearchCardProps) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const pricePerDay = car.price || car.pricePerDay || 45;
  const days = car.days || 4;
  const totalPrice = pricePerDay * days;

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
          type: 'car',
          external_ref: car.id || `car-${Date.now()}`,
          price: totalPrice,
          item_data: {
            name: car.name || 'Toyota Camry',
            type: car.type || 'Sedan',
            seats: car.seats || 5,
            transmission: car.transmission || 'Automatic',
            fuelType: car.fuelType || 'Gasoline',
            pickupLocation: car.pickupLocation || 'Airport',
            dropoffLocation: car.dropoffLocation || 'Airport',
            mileageLimit: car.mileageLimit || 'Unlimited',
            pricePerDay: pricePerDay,
            days: days,
            totalPrice: totalPrice,
            image: car.image,
            bookingStatus: 'pending'
          }
        });

      if (error) throw error;

      toast({
        title: 'Car Saved',
        description: 'Added to your itinerary as a pending booking',
      });

      setShowModal(false);
    } catch (error) {
      console.error('Error saving car:', error);
      toast({
        title: 'Error',
        description: 'Failed to save car to itinerary',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-[270px] h-[385px] flex flex-col overflow-hidden rounded-lg border border-white/20 bg-gradient-to-br from-white/10 to-white/5 pb-[20px]">
      {/* Car Image */}
      {car.image && (
        <div className="overflow-hidden bg-white/5 p-4 flex-shrink-0 h-28">
          <img src={car.image} alt={car.name} className="w-full h-full object-contain" />
        </div>
      )}

      {/* Car Content */}
      <div className="p-4 flex-1 flex flex-col space-y-4">
        {/* Car Header */}
        <div>
          <h3 className="text-xl font-bold text-white mb-1">{car.name || 'Toyota Camry'}</h3>
          <p className="text-white/70 text-sm">{car.type || 'Sedan'}</p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-2 gap-3">
          <Badge className="bg-white/10 text-white/80 border-white/20 flex items-center gap-1 justify-center py-2 text-xs">
            <Users className="h-4 w-4" />
            {car.seats || 5} seats
          </Badge>
          <Badge className="bg-white/10 text-white/80 border-white/20 flex items-center gap-1 justify-center py-2 text-xs">
            <Settings className="h-4 w-4" />
            {car.transmission || 'Automatic'}
          </Badge>
          <Badge className="bg-white/10 text-white/80 border-white/20 flex items-center gap-1 justify-center py-2 text-xs">
            <Fuel className="h-4 w-4" />
            {car.fuelType || 'Gasoline'}
          </Badge>
          <Badge className="bg-white/10 text-white/80 border-white/20 flex items-center gap-1 justify-center py-2 text-xs">
            <Navigation className="h-4 w-4" />
            GPS Included
          </Badge>
        </div>

        {/* Pickup/Dropoff */}
        <div className="bg-white/5 p-4 rounded-lg border border-white/20">
          <div className="space-y-2 text-xs text-white/70">
            <p><strong className="text-white">Pickup:</strong> {car.pickupLocation || 'Airport'}</p>
            <p><strong className="text-white">Dropoff:</strong> {car.dropoffLocation || 'Airport'}</p>
            <p><strong className="text-white">Mileage:</strong> {car.mileageLimit || 'Unlimited'}</p>
          </div>
        </div>

        {/* Price */}
        <div className="pt-4 border-t border-white/10">
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <p className="text-white/60 text-xs">Price per day</p>
              <p className="text-2xl font-bold" style={{ color: '#ff849c' }}>
                ${Math.ceil(pricePerDay).toLocaleString('en-US')}
              </p>
              <p className="text-white/40 text-xs mt-1">including taxes and fees</p>
            </div>
            <div className="text-right">
              <p className="text-white/60 text-xs">Total for {days} days</p>
              <p className="text-xl font-semibold" style={{ color: '#ff849c' }}>
                ${Math.ceil(totalPrice).toLocaleString('en-US')}
              </p>
            </div>
          </div>
        </div>

        {/* Add to Itinerary Button */}
        <div className="pt-2 border-t border-white/10 mt-auto flex-shrink-0">
          <Button
            onClick={handleAddToItinerary}
            disabled={saving}
            className="w-full h-8 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-xs text-white"
          >
            <Plus className="mr-1 h-3 w-3" />
            {saving ? 'Saving...' : 'Car'}
          </Button>
        </div>
      </div>

      <ItineraryMatcherModal
        open={showModal}
        onOpenChange={setShowModal}
        searchDates={{
          checkin: car.pickupDate || new Date().toISOString().split('T')[0],
          checkout: car.dropoffDate || new Date(Date.now() + days * 86400000).toISOString().split('T')[0]
        }}
        item={car}
        onConfirm={handleModalConfirm}
      />
    </div>
  );
};
