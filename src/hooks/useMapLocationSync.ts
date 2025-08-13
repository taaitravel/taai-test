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
        .select('itin_locations, itin_map_locations, hotels, activities, reservations, flights')
        .eq('id', parseInt(itineraryId))
        .single();

      if (fetchError) throw fetchError;

const currentMapLocations = Array.isArray(itineraryData.itin_map_locations) ? itineraryData.itin_map_locations : [];

// Build a unified list of location names from itinerary + details and a category map
const baseLocations = Array.isArray(itineraryData.itin_locations) ? itineraryData.itin_locations : [];
const hotelCities = Array.isArray(itineraryData.hotels) ? itineraryData.hotels.map((h: any) => h?.city).filter(Boolean) : [];
const activityCities = Array.isArray(itineraryData.activities) ? itineraryData.activities.map((a: any) => a?.city).filter(Boolean) : [];
const reservationCities = Array.isArray(itineraryData.reservations) ? itineraryData.reservations.map((r: any) => r?.city).filter(Boolean) : [];
const flightCities = Array.isArray(itineraryData.flights)
  ? itineraryData.flights.flatMap((f: any) => [f?.from, f?.to]).filter(Boolean)
  : [];

const categoryMap = new Map<string, 'destination' | 'hotel' | 'activity' | 'reservation'>();
baseLocations.forEach((n: string) => categoryMap.set(n, 'destination'));
hotelCities.forEach((n: string) => categoryMap.set(n, 'hotel'));
activityCities.forEach((n: string) => categoryMap.set(n, 'activity'));
reservationCities.forEach((n: string) => categoryMap.set(n, 'reservation'));

const allLocationNames: string[] = Array.from(new Set([
  ...baseLocations,
  ...hotelCities,
  ...activityCities,
  ...reservationCities,
  ...flightCities
].filter((v: any) => typeof v === 'string' && v.trim().length > 0)));

      // Determine which names need geocoding
      const locationsToGeocode: string[] = [];
      allLocationNames.forEach((name: string) => {
        const hasMapLocation = currentMapLocations.some((mapLoc: any) =>
          mapLoc?.city && mapLoc.city.toLowerCase().includes(name.toLowerCase())
        );
        if (!hasMapLocation) locationsToGeocode.push(name);
      });

if (locationsToGeocode.length > 0) {
  console.log('Batch geocoding missing locations:', locationsToGeocode);

  const newMapLocations = [...currentMapLocations];

  try {
    const { data: batchResp, error: batchErr } = await supabase.functions.invoke('batch-geocode', {
      body: { queries: locationsToGeocode }
    });
    if (batchErr) throw batchErr;

    const results: Array<{ query: string; fullName: string; city: string; lat: number; lng: number }> = batchResp?.results || [];
    results.forEach((res) => {
      if (typeof res?.lat === 'number' && typeof res?.lng === 'number') {
        const label = res.fullName || res.city || res.query;
        const category = categoryMap.get(res.query) || 'destination';
        newMapLocations.push({ city: label, lat: res.lat, lng: res.lng, category });
      }
    });
  } catch (e) {
    console.warn('Batch geocode error', e);
  }

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
    title: 'Success',
    description: 'Map locations updated'
  });
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