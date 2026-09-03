import { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { guardRead, stableListKey, parseListKey } from '@/lib/data/read-guard';

interface CountryCoordinate {
  country_name: string;
  latitude: number;
  longitude: number;
  country_code: string;
}

/** Session-scoped caches so the same country is never fetched/geocoded twice. */
const coordinateCache = new Map<string, CountryCoordinate>();
const failedGeocodes = new Set<string>();

export const __resetCountryCache = () => {
  coordinateCache.clear();
  failedGeocodes.clear();
};

export const useCountryData = (visitedCountries: string[]) => {
  const [countryCoordinates, setCountryCoordinates] = useState<CountryCoordinate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sorted + deduplicated stable key — array identity is irrelevant.
  const countriesKey = stableListKey(visitedCountries);
  const countries = useMemo(() => parseListKey(countriesKey), [countriesKey]);

  const requestIdRef = useRef(0);

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    let cancelled = false;

    if (countries.length === 0) {
      setCountryCoordinates([]);
      setIsLoading(false);
      return;
    }

    const cached = countries
      .map(c => coordinateCache.get(c))
      .filter((c): c is CountryCoordinate => Boolean(c));

    const uncached = countries.filter(c => !coordinateCache.has(c));

    if (uncached.length === 0) {
      setCountryCoordinates(cached);
      setIsLoading(false);
      return;
    }

    const fetchCountryData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        guardRead(`country_coordinates:${stableListKey(uncached)}`);
        const { data: coordinates, error: coordError } = await supabase
          .from('country_coordinates')
          .select('country_name, latitude, longitude, country_code')
          .in('country_name', uncached);

        if (cancelled || requestId !== requestIdRef.current) return;

        if (coordError) {
          console.error('Error fetching country coordinates:', coordError.message);
          setError('Failed to fetch country data');
        }

        (coordinates || []).forEach(c => coordinateCache.set(c.country_name, c as CountryCoordinate));

        // Only geocode countries we have neither cached nor previously failed on.
        const missingCountries = uncached.filter(
          c => !coordinateCache.has(c) && !failedGeocodes.has(c)
        );

        if (missingCountries.length > 0) {
          try {
            guardRead(`geocode-countries:${stableListKey(missingCountries)}`);
            const { data: geocodedData, error: geocodeError } = await supabase.functions.invoke(
              'geocode-countries',
              { body: { countries: missingCountries } }
            );

            if (cancelled || requestId !== requestIdRef.current) return;

            if (!geocodeError && geocodedData?.countries) {
              (geocodedData.countries as CountryCoordinate[]).forEach(c =>
                coordinateCache.set(c.country_name, c)
              );
            } else if (geocodeError) {
              console.error('Error geocoding countries:', geocodeError.message);
            }
          } catch (e) {
            console.error('Error calling geocode function:', (e as Error)?.message);
          }
          // Do not retry these within the session.
          missingCountries.forEach(c => {
            if (!coordinateCache.has(c)) failedGeocodes.add(c);
          });
        }

        if (cancelled || requestId !== requestIdRef.current) return;
        setCountryCoordinates(
          countries.map(c => coordinateCache.get(c)).filter((c): c is CountryCoordinate => Boolean(c))
        );
      } catch (e) {
        if (cancelled || requestId !== requestIdRef.current) return;
        console.error('Error in fetchCountryData:', (e as Error)?.message);
        setError('Failed to load country data');
      } finally {
        if (!cancelled && requestId === requestIdRef.current) setIsLoading(false);
      }
    };

    fetchCountryData();

    return () => {
      cancelled = true;
    };
  }, [countries]);

  return {
    countryCoordinates,
    isLoading,
    error
  };
};
