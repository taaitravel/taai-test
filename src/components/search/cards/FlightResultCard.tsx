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
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Plane className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{flight.airlineName || flight.airline}</h3>
            <p className="text-white/50 text-sm">{flight.flight_number}</p>
          </div>
        </div>
        <Badge className="bg-white/10 text-white/80 border-white/20 text-xs capitalize">
          {flight.cabinClass || flight.class || 'Economy'}
        </Badge>
      </div>

      {/* Route visualization */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-5 mb-5">
        <div className="flex items-center justify-between">
          {/* Departure */}
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{flight.from}</div>
            <div className="text-white/60 text-sm mt-0.5">{departureInfo.time}</div>
          </div>

          {/* Flight path */}
          <div className="flex-1 mx-6">
            <div className="flex items-center justify-center">
              <div className="flex-1 h-px bg-white/20"></div>
              <div className="px-3">
                <Plane className="h-4 w-4 text-white/30 transform rotate-90" />
              </div>
              <div className="flex-1 h-px bg-white/20"></div>
            </div>
            <div className="text-center mt-1.5">
              <p className="text-white/50 text-xs">{flight.duration}</p>
            </div>
          </div>

          {/* Arrival */}
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{flight.to}</div>
            <div className="text-white/60 text-sm mt-0.5">{arrivalInfo.time}</div>
          </div>
        </div>
        
        {/* Stops info */}
        <div className="flex items-center justify-center gap-1.5 mt-3 pt-3 border-t border-white/10">
          <Clock className="h-3.5 w-3.5 text-white/40" />
          <span className="text-white/50 text-xs">
            {flight.stops === 0 ? 'Non-stop' : `${flight.stops} ${flight.stops === 1 ? 'stop' : 'stops'}`}
          </span>
        </div>
      </div>

      {/* Price and action */}
      <div className="flex items-end justify-between pt-3">
        <div>
          <p className="text-white/50 text-xs mb-0.5">Total Price</p>
          <p className="text-3xl font-bold" style={{ color: '#ff849c' }}>
            {flight.priceDisplay || `$${flight.price?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '450.00'}`}
          </p>
        </div>
        <Button 
          onClick={handleAddToItinerary}
          disabled={saving}
          className="bg-gradient-to-r from-primary to-[#7E69AB] hover:opacity-90 text-white px-6"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          {saving ? 'Saving...' : 'Add to Itinerary'}
        </Button>
      </div>
    </div>
  );
};
