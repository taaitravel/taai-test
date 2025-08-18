import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface EnhancedLocation {
  originalQuery: string;
  formattedName: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  type: 'city' | 'poi' | 'region';
}

export const useEnhancedCityFormatting = () => {
  const { toast } = useToast();

  const enhanceCityFormatting = useCallback(async (cities: string[]): Promise<EnhancedLocation[]> => {
    try {
      console.log('useEnhancedCityFormatting: Enhancing cities:', cities);
      
      if (!cities.length) return [];

      const { data, error } = await supabase.functions.invoke('enhance-city-formatting', {
        body: { queries: cities }
      });

      if (error) {
        console.error('useEnhancedCityFormatting: Error:', error);
        toast({
          title: "Enhancement Warning",
          description: "Could not enhance city formatting. Using original names.",
          variant: "default",
        });
        return [];
      }

      const results = data?.results || [];
      console.log('useEnhancedCityFormatting: Enhanced results:', results);
      
      return results;
    } catch (err: any) {
      console.error('useEnhancedCityFormatting: Exception:', err);
      toast({
        title: "Enhancement Error", 
        description: "Failed to enhance city formatting.",
        variant: "destructive",
      });
      return [];
    }
  }, [toast]);

  const updateItineraryWithEnhancedCities = useCallback(async (
    itineraryId: number, 
    originalDestinations: string[]
  ): Promise<boolean> => {
    try {
      console.log('updateItineraryWithEnhancedCities: Processing for itinerary', itineraryId);
      
      const enhancedLocations = await enhanceCityFormatting(originalDestinations);
      
      if (!enhancedLocations.length) {
        console.log('updateItineraryWithEnhancedCities: No enhanced locations returned');
        return false;
      }

      // Update itin_locations with properly formatted names
      const enhancedNames = enhancedLocations.map(loc => loc.formattedName);
      
      // Create/update map locations for destinations
      const mapLocations = enhancedLocations.map(loc => ({
        city: loc.formattedName,
        lat: loc.lat,
        lng: loc.lng,
        category: 'destination'
      }));

      console.log('updateItineraryWithEnhancedCities: Updating with:', {
        enhancedNames,
        mapLocations
      });

      const { error } = await supabase
        .from('itinerary')
        .update({
          itin_locations: enhancedNames,
          itin_map_locations: mapLocations
        })
        .eq('id', itineraryId);

      if (error) {
        console.error('updateItineraryWithEnhancedCities: Update error:', error);
        toast({
          title: "Update Error",
          description: "Failed to update itinerary with enhanced city names.",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Cities Enhanced",
        description: `Updated ${enhancedNames.length} destination${enhancedNames.length !== 1 ? 's' : ''} with proper formatting.`,
        variant: "default",
      });

      console.log('updateItineraryWithEnhancedCities: Successfully updated');
      return true;
      
    } catch (err: any) {
      console.error('updateItineraryWithEnhancedCities: Exception:', err);
      toast({
        title: "Enhancement Failed",
        description: "Could not enhance city formatting.",
        variant: "destructive",
      });
      return false;
    }
  }, [enhanceCityFormatting, toast]);

  return {
    enhanceCityFormatting,
    updateItineraryWithEnhancedCities
  };
};