import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useMapLocationSync = (itineraryId: string | null) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const syncMapLocations = async () => {
    if (!itineraryId) return;

    setIsUpdating(true);
    
    try {
      // Get current itinerary data
      const { data: itineraryData, error: fetchError } = await supabase
        .from('itinerary')
        .select('itin_locations, itin_map_locations')
        .eq('id', parseInt(itineraryId))
        .single();

      if (fetchError) throw fetchError;

      const currentLocations = Array.isArray(itineraryData.itin_locations) ? itineraryData.itin_locations : [];
      const currentMapLocations = Array.isArray(itineraryData.itin_map_locations) ? itineraryData.itin_map_locations : [];

      // Check if we need to geocode any missing locations
      const locationsToGeocode: string[] = [];
      
      currentLocations.forEach((location: any) => {
        if (typeof location === 'string') {
          const hasMapLocation = currentMapLocations.some((mapLoc: any) => 
            mapLoc?.city && mapLoc.city.toLowerCase().includes(location.toLowerCase())
          );
          
          if (!hasMapLocation) {
            locationsToGeocode.push(location);
          }
        }
      });

      if (locationsToGeocode.length > 0) {
        console.log('Geocoding missing locations:', locationsToGeocode);
        
        // Geocode missing locations
        const { data: geocodeData, error: geocodeError } = await supabase.functions.invoke('geocode-countries', {
          body: { countries: locationsToGeocode }
        });

        if (!geocodeError && geocodeData?.countries?.length > 0) {
          const newMapLocations = [...currentMapLocations];
          
          geocodeData.countries.forEach((geocodedLocation: any) => {
            newMapLocations.push({
              city: geocodedLocation.country_name,
              lat: geocodedLocation.latitude,
              lng: geocodedLocation.longitude
            });
          });

          // Update itinerary with new map locations
          const { error: updateError } = await supabase
            .from('itinerary')
            .update({
              itin_map_locations: newMapLocations
            })
            .eq('id', parseInt(itineraryId));

          if (updateError) throw updateError;
          
          console.log('Successfully synced map locations');
          toast({
            title: "Success",
            description: "Map locations updated"
          });
        }
      }
    } catch (error) {
      console.error('Error syncing map locations:', error);
      toast({
        title: "Error",
        description: "Failed to sync map locations",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Auto-sync on component mount if there are missing map locations
  useEffect(() => {
    const autoSync = async () => {
      if (!itineraryId) return;
      
      try {
        const { data, error } = await supabase
          .from('itinerary')
          .select('itin_locations, itin_map_locations')
          .eq('id', parseInt(itineraryId))
          .single();

        if (!error && data) {
          const locations = Array.isArray(data.itin_locations) ? data.itin_locations : [];
          const mapLocations = Array.isArray(data.itin_map_locations) ? data.itin_map_locations : [];
          
          // If we have locations but no map locations, trigger sync
          if (locations.length > 0 && mapLocations.length === 0) {
            console.log('Auto-syncing missing map locations for itinerary:', itineraryId);
            await syncMapLocations();
          }
        }
      } catch (error) {
        console.error('Error checking for auto-sync:', error);
      }
    };

    autoSync();
  }, [itineraryId]);

  return {
    syncMapLocations,
    isUpdating
  };
};