import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ItineraryData } from '@/types/itinerary';
import { useToast } from '@/hooks/use-toast';

interface MapLocation {
  city: string;
  lat: number;
  lng: number;
  category?: string;
  expedia_property_id?: string;
}

export const useExpediaMapSync = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const syncExpediaLocations = async (itineraryData: ItineraryData) => {
    setIsUpdating(true);
    
    try {
      const currentMap = Array.isArray(itineraryData.itin_map_locations) ? itineraryData.itin_map_locations as MapLocation[] : [];
      let updatedMap: MapLocation[] = [...currentMap];
      let locationsAdded = 0;

      // Process hotels with potential coordinates from location string
      itineraryData.hotels?.forEach((hotel) => {
        // Try to extract coordinates from location if it's in a specific format
        const locationStr = hotel.location;
        let lat: number | undefined;
        let lng: number | undefined;
        
        if (locationStr && typeof locationStr === 'string') {
          // Look for coordinates in location string (e.g., "City Name (lat,lng)")
          const coordMatch = locationStr.match(/\((-?\d+\.?\d*),\s*(-?\d+\.?\d*)\)/);
          if (coordMatch) {
            lat = parseFloat(coordMatch[1]);
            lng = parseFloat(coordMatch[2]);
          }
        }
        
        if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
          const exists = updatedMap.some((m) => 
            Math.abs(m.lat - lat!) < 0.001 && 
            Math.abs(m.lng - lng!) < 0.001
          );
          
          if (!exists) {
            updatedMap.push({
              city: hotel.name,
              lat,
              lng,
              category: 'hotel',
              expedia_property_id: hotel.expedia_property_id
            });
            locationsAdded++;
          }
        }
      });

      // Process activities with potential coordinates
      itineraryData.activities?.forEach((activity) => {
        const locationStr = activity.location;
        let lat: number | undefined;
        let lng: number | undefined;
        
        if (locationStr && typeof locationStr === 'string') {
          const coordMatch = locationStr.match(/\((-?\d+\.?\d*),\s*(-?\d+\.?\d*)\)/);
          if (coordMatch) {
            lat = parseFloat(coordMatch[1]);
            lng = parseFloat(coordMatch[2]);
          }
        }
        
        if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
          const exists = updatedMap.some((m) => 
            Math.abs(m.lat - lat!) < 0.001 && 
            Math.abs(m.lng - lng!) < 0.001
          );
          
          if (!exists) {
            updatedMap.push({
              city: activity.name,
              lat,
              lng,
              category: 'activity'
            });
            locationsAdded++;
          }
        }
      });

      // Process reservations with potential coordinates
      itineraryData.reservations?.forEach((reservation) => {
        const locationStr = reservation.location;
        let lat: number | undefined;
        let lng: number | undefined;
        
        if (locationStr && typeof locationStr === 'string') {
          const coordMatch = locationStr.match(/\((-?\d+\.?\d*),\s*(-?\d+\.?\d*)\)/);
          if (coordMatch) {
            lat = parseFloat(coordMatch[1]);
            lng = parseFloat(coordMatch[2]);
          }
        }
        
        if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
          const exists = updatedMap.some((m) => 
            Math.abs(m.lat - lat!) < 0.001 && 
            Math.abs(m.lng - lng!) < 0.001
          );
          
          if (!exists) {
            updatedMap.push({
              city: reservation.name,
              lat,
              lng,
              category: 'reservation'
            });
            locationsAdded++;
          }
        }
      });

      // Update database if locations were added
      if (locationsAdded > 0) {
        const { error } = await supabase
          .from('itinerary')
          .update({ itin_map_locations: updatedMap as any })
          .eq('id', itineraryData.id);

        if (error) throw error;

        toast({
          title: "Map Updated",
          description: `Added ${locationsAdded} location${locationsAdded > 1 ? 's' : ''} to map`,
        });

        return true;
      } else {
        toast({
          title: "No Updates Needed",
          description: "All available locations are already on the map",
        });
        return false;
      }
    } catch (error) {
      console.error('Error syncing locations:', error);
      toast({
        title: "Sync Failed",
        description: "Failed to sync locations to map",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    syncExpediaLocations,
    isUpdating
  };
};