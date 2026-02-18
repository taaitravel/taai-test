import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCountryData } from '@/hooks/useCountryData';
import { useThemeContext } from '@/contexts/ThemeContext';
import { getMapStyle, getMarkerBorderColor, getMarkerDotColor, getMarkerGlow } from '@/lib/mapStyles';

interface CountriesMapProps {
  visitedCountries: string[];
}

export const CountriesMap = ({ visitedCountries }: CountriesMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { countryCoordinates } = useCountryData(visitedCountries);
  const { theme } = useThemeContext();
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);

  // Fetch token once
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        if (error || !data?.token) {
          setError('Unable to load map. Please check configuration.');
          setIsLoading(false);
          return;
        }
        setMapboxToken(data.token);
      } catch {
        setError('Failed to load map');
        setIsLoading(false);
      }
    };
    fetchToken();
  }, []);

  // Initialize / re-initialize map on token or theme change
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    // Destroy existing map on theme change
    if (map.current) {
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];
      map.current.remove();
      map.current = null;
    }

    setIsLoading(true);
    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: getMapStyle(theme, 'countries'),
      projection: 'mercator',
      center: [0, 0],
      zoom: 2,
      pitch: 0,
    });

    map.current.on('load', () => setIsLoading(false));

    return () => {
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];
      map.current?.remove();
      map.current = null;
    };
  }, [mapboxToken, theme]);

  // Add/Update markers when country coordinates change
  useEffect(() => {
    const addMarkers = () => {
      if (!map.current) return;
      // Clear old markers
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      if (!countryCoordinates || countryCoordinates.length === 0) return;

      const bounds = new mapboxgl.LngLatBounds();
      countryCoordinates.forEach((country) => {
        if (country.longitude && country.latitude) {
          const markerEl = document.createElement('div');
          markerEl.className = 'country-marker';
          const borderColor = getMarkerBorderColor(theme);
          const dotColor = getMarkerDotColor(theme);
          const glowColor = getMarkerGlow(theme);
          markerEl.style.cssText = `
            width: 12px;
            height: 12px;
            background: ${dotColor};
            border: 2px solid ${borderColor};
            border-radius: 50%;
            box-shadow: 0 0 10px ${glowColor};
            cursor: pointer;
          `;
          const popup = new mapboxgl.Popup({ offset: 25 })
            .setHTML(`<div style="color: #171821; font-weight: 500; padding: 4px;">${country.country_name}</div>`);
          const marker = new mapboxgl.Marker(markerEl)
            .setLngLat([country.longitude, country.latitude])
            .setPopup(popup)
            .addTo(map.current!);
          markersRef.current.push(marker);
          bounds.extend([country.longitude, country.latitude]);
        }
      });

      if (bounds.isEmpty()) return;
      if (countryCoordinates.length > 1) {
        map.current.fitBounds(bounds, { padding: 40, duration: 800 });
      } else {
        const first = countryCoordinates[0];
        map.current.easeTo({ center: [Number(first.longitude), Number(first.latitude)], zoom: 3, duration: 800 });
      }
    };

    if (!map.current) return;
    if (map.current.isStyleLoaded()) {
      addMarkers();
    } else {
      map.current.once('load', addMarkers);
    }
  }, [JSON.stringify(countryCoordinates)]);

  if (error) {
    return (
      <div className="h-[250px] flex items-center justify-center bg-card/80 rounded-lg border border-border">
        <div className="text-center">
          <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-foreground font-medium text-sm">Map Unavailable</p>
          {visitedCountries.length > 0 && (
            <div className="mt-3 space-y-1">
              <p className="text-muted-foreground text-xs">Your countries:</p>
              <div className="flex flex-wrap gap-1 justify-center">
                {visitedCountries.slice(0, 3).map((country, index) => (
                  <div key={index} className="text-xs text-foreground/70 bg-secondary px-2 py-1 rounded">
                    {country}
                  </div>
                ))}
                {visitedCountries.length > 3 && (
                  <div className="text-xs text-muted-foreground">+{visitedCountries.length - 3}</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[250px] rounded-lg overflow-hidden">
      <div ref={mapContainer} className="absolute inset-0" />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent to-background/10 rounded-lg" />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-card/80 rounded-lg border border-border">
          <div className="text-center">
            <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2 animate-pulse" />
            <p className="text-foreground font-medium text-sm">Loading Map...</p>
          </div>
        </div>
      )}
      {visitedCountries.length > 0 && !isLoading && (
        <div className="absolute top-2 right-2 bg-card/60 backdrop-blur-sm rounded px-2 py-1">
          <p className="text-xs text-foreground/80 font-medium">{visitedCountries.length} countries</p>
        </div>
      )}
    </div>
  );
};