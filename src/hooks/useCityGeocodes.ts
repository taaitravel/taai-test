import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CityCoord {
  name: string;
  lat: number;
  lng: number;
}

export const useCityGeocodes = (cities: string[]) => {
  const [coords, setCoords] = useState<CityCoord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      const unique = Array.from(new Set((cities || []).filter(c => typeof c === 'string' && c.trim().length > 0)));
      if (unique.length === 0) {
        setCoords([]);
        return;
      }
      setLoading(true);
      setError(null);
      const results: CityCoord[] = [];
      for (const query of unique) {
        try {
          const { data, error } = await supabase.functions.invoke('search-cities', { body: { query } });
          if (!error && Array.isArray(data?.locations) && data.locations.length > 0) {
            const best = data.locations[0];
            results.push({ name: best.fullName || best.city || query, lat: best.lat, lng: best.lng });
          }
        } catch (e) {
          console.warn('useCityGeocodes: error geocoding', query, e);
        }
      }
      setCoords(results);
      setLoading(false);
    };
    run();
  }, [JSON.stringify(cities)]);

  return { coords, loading, error };
};