import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CountryCoordinate {
  country_name: string;
  latitude: number;
  longitude: number;
  country_code: string;
}

export const useCountryData = (visitedCountries: string[]) => {
  const [countryCoordinates, setCountryCoordinates] = useState<CountryCoordinate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visitedCountries || visitedCountries.length === 0) {
      setCountryCoordinates([]);
      return;
    }

    const fetchCountryData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // First, try to get coordinates from our database
        const { data: coordinates, error: coordError } = await supabase
          .from('country_coordinates')
          .select('country_name, latitude, longitude, country_code')
          .in('country_name', visitedCountries);

        let finalCoordinates = coordinates || [];

        if (coordError) {
          console.error('Error fetching country coordinates:', coordError);
          setError('Failed to fetch country data');
        }

        // Check if we have coordinates for all visited countries
        const foundCountries = finalCoordinates.map(c => c.country_name);
        const missingCountries = visitedCountries.filter(country => !foundCountries.includes(country));

        // Geocode missing countries if any
        if (missingCountries.length > 0) {
          try {
            const { data: geocodedData, error: geocodeError } = await supabase.functions.invoke('geocode-countries', {
              body: { countries: missingCountries }
            });

            if (!geocodeError && geocodedData?.countries) {
              finalCoordinates = [...finalCoordinates, ...geocodedData.countries];
            } else if (geocodeError) {
              console.error('Error geocoding countries:', geocodeError);
            }
          } catch (error) {
            console.error('Error calling geocode function:', error);
          }
        }

        setCountryCoordinates(finalCoordinates);
      } catch (error) {
        console.error('Error in fetchCountryData:', error);
        setError('Failed to load country data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCountryData();
  }, [visitedCountries]);

  return {
    countryCoordinates,
    isLoading,
    error
  };
};