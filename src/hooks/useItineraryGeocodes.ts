import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ItineraryMapLocation {
  city: string;
  lat: number;
  lng: number;
}

interface UseItineraryGeocodesOptions {
  itineraryId: string | number | null;
}

interface UseItineraryGeocodesResult {
  locations: ItineraryMapLocation[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Fetches itinerary destinations and returns geocoded map markers.
// 1) If itin_map_locations exist, uses them directly
// 2) Else, geocodes itin_locations via the `search-cities` Edge Function
export const useItineraryGeocodes = (
  { itineraryId }: UseItineraryGeocodesOptions
): UseItineraryGeocodesResult => {
  const [locations, setLocations] = useState<ItineraryMapLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGeocodes = useCallback(async () => {
    try {
      if (!itineraryId && itineraryId !== 0) {
        setLocations([]);
        return;
      }
      setLoading(true);
      setError(null);

      const idNum = typeof itineraryId === 'string' ? Number(itineraryId) : itineraryId;
      if (Number.isNaN(idNum as number)) {
        setLocations([]);
        setLoading(false);
        return;
      }

      // Pull itinerary destinations and any precomputed map locations
      const { data, error } = await supabase
        .from('itinerary')
        .select('itin_locations, itin_map_locations')
        .eq('id', idNum as number)
        .maybeSingle();

      if (error) throw error;

      const savedMapLocationsRaw = Array.isArray((data as any)?.itin_map_locations)
        ? ((data as any)!.itin_map_locations as any[])
        : [];
      const savedMapLocations: ItineraryMapLocation[] = savedMapLocationsRaw
        .map((m: any) => ({ city: m.city, lat: Number(m.lat), lng: Number(m.lng) }))
        .filter((m) => !!m.city && !Number.isNaN(m.lat) && !Number.isNaN(m.lng));

      // If we already have saved map coordinates, use them
      if (savedMapLocations.length > 0) {
        setLocations(savedMapLocations);
        setLoading(false);
        return;
      }

      const rawNames = Array.isArray(data?.itin_locations) ? (data!.itin_locations as string[]) : [];
      const unique = Array.from(
        new Set(
          rawNames
            .filter((c) => typeof c === 'string')
            .map((c) => c.trim())
            .filter((c) => c.length > 0)
        )
      );

      if (unique.length === 0) {
        setLocations([]);
        setLoading(false);
        return;
      }

      // Geocode all destinations concurrently via Edge Function
      const geocodePromises = unique.map(async (query) => {
        try {
          const { data, error } = await supabase.functions.invoke('search-cities', {
            body: { query },
          });
          if (!error && Array.isArray(data?.locations) && data.locations.length > 0) {
            const best = data.locations[0];
            return {
              city: best.fullName || best.city || query,
              lat: best.lat,
              lng: best.lng,
            } as ItineraryMapLocation;
          }
        } catch (e) {
          console.warn('useItineraryGeocodes: error geocoding', query, e);
        }
        return undefined;
      });

      const results = (await Promise.all(geocodePromises)).filter(Boolean) as ItineraryMapLocation[];
      setLocations(results);
    } catch (e: any) {
      console.error('useItineraryGeocodes error', e);
      setError(e?.message || 'Failed to resolve itinerary locations');
    } finally {
      setLoading(false);
    }
  }, [itineraryId]);

  useEffect(() => {
    fetchGeocodes();
  }, [fetchGeocodes]);

  return { locations, loading, error, refetch: fetchGeocodes };
};
