import { Plane, Clock, Calendar, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface FlightResultCardProps {
  flight: any;
}

export const FlightResultCard = ({ flight }: FlightResultCardProps) => {
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Parse departure and arrival times
  const parseDatetime = (dateTimeStr: string) => {
    const date = new Date(dateTimeStr);
    return {
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    };
  };

  const departureInfo = flight.departure ? parseDatetime(flight.departure) : { time: '10:00', date: 'TBD' };
  const arrivalInfo = flight.arrival ? parseDatetime(flight.arrival) : { time: '14:30', date: 'TBD' };

  const handleAddToItinerary = async () => {
    setSaving(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Authentication Required',
          description: 'Please log in to save flights to your itinerary.',
          variant: 'destructive',
        });
        return;
      }

      // Get user's itineraries
      const { data: itineraries, error: itinError } = await supabase
        .from('itinerary')
        .select('id, itin_name')
        .eq('userid', user.id)
        .order('created_at', { ascending: false });

      if (itinError) throw itinError;

      if (!itineraries || itineraries.length === 0) {
        toast({
          title: 'No Itineraries Found',
          description: 'Please create an itinerary first before adding flights.',
          variant: 'default',
        });
        return;
      }

      // For now, add to the most recent itinerary
      // TODO: Add a selector modal to let users choose which itinerary
      const targetItinerary = itineraries[0];

      // Save as cart item with reference to search
      const { error: cartError } = await supabase
        .from('cart_items')
        .insert({
          user_id: user.id,
          itinerary_id: targetItinerary.id.toString(),
          type: 'flight',
          external_ref: flight.id,
          price: flight.price || 0,
          item_data: {
            ...flight,
            status: 'inactive',
            savedAt: new Date().toISOString(),
            source: 'search_result',
          },
        });

      if (cartError) throw cartError;

      toast({
        title: 'Flight Saved',
        description: `Added to "${targetItinerary.itin_name || 'Untitled Itinerary'}" as inactive booking.`,
      });

    } catch (error: any) {
      console.error('Error saving flight:', error);
      toast({
        title: 'Save Failed',
        description: error.message || 'Unable to save flight to itinerary.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6">
      {/* Flight header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
          <Plane className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">{flight.airlineName || flight.airline || 'Airline'}</h3>
          <p className="text-white/60">{flight.flight_number || 'Flight Number'}</p>
        </div>
        <Badge className="ml-auto bg-white/10 text-white border-white/20">
          {flight.cabinClass || flight.class || 'Economy'}
        </Badge>
      </div>

      {/* Route visualization */}
      <div className="bg-white/5 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 text-center">
            <p className="text-2xl font-bold text-white">{departureInfo.time}</p>
            <p className="text-white/60 text-sm">{flight.from}</p>
            <p className="text-white/40 text-xs mt-1 flex items-center justify-center gap-1">
              <Calendar className="h-3 w-3" />
              {departureInfo.date}
            </p>
          </div>

          <div className="flex-1 flex flex-col items-center">
            <div className="flex items-center gap-2 text-white/60">
              <div className="h-px w-12 bg-white/20" />
              <Plane className="h-4 w-4" />
              <div className="h-px w-12 bg-white/20" />
            </div>
            <p className="text-white/60 text-sm mt-2 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {flight.duration || '2h 30m'}
            </p>
            {flight.stops !== undefined && (
              <p className="text-[#ff849c] text-xs mt-1 font-medium">
                {flight.stops === 0 ? 'Non-stop' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
              </p>
            )}
          </div>

          <div className="flex-1 text-center">
            <p className="text-2xl font-bold text-white">{arrivalInfo.time}</p>
            <p className="text-white/60 text-sm">{flight.to}</p>
            <p className="text-white/40 text-xs mt-1 flex items-center justify-center gap-1">
              <Calendar className="h-3 w-3" />
              {arrivalInfo.date}
            </p>
          </div>
        </div>
      </div>

      {/* Additional details */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/60">Source</span>
          <span className="text-white">{flight.source || 'Amadeus'}</span>
        </div>
        {flight.aircraft && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/60">Aircraft</span>
            <span className="text-white">{flight.aircraft}</span>
          </div>
        )}
      </div>

      {/* Price and Actions */}
      <div className="pt-4 mt-4 border-t border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/60 text-sm">Total price</p>
            <p className="text-3xl font-bold text-[#ff849c]">
              {flight.priceDisplay || `$${flight.price?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '450.00'}`}
            </p>
          </div>
          <Button
            onClick={handleAddToItinerary}
            disabled={saving}
            className="bg-gradient-to-r from-[#9b87f5] to-[#7E69AB] text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Add to Itinerary'}
          </Button>
        </div>
      </div>
    </div>
  );
};
