import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useMapboxToken } from '@/hooks/useMapboxToken';
import { useCountryData } from '@/hooks/useCountryData';
import { useThemeContext } from '@/contexts/ThemeContext';
import { getMarkerBorderColor, getMarkerDotColor, getMarkerGlow, resolvedColorScheme } from '@/lib/mapStyles';
import { defaultMapCamera } from '@/lib/maps/default-view';
import { isVerifiedCoordinate } from '@/lib/dashboard/coordinates';
import { MapFallback } from '@/components/dashboard/MapFallback';

interface CountriesMapProps {
  visitedCountries: string[];
}

const publicStyle = (theme: string | undefined) => (
  resolvedColorScheme(theme) === 'dark'
    ? 'mapbox://styles/mapbox/dark-v11'
    : 'mapbox://styles/mapbox/light-v11'
);

export const CountriesMap = ({ visitedCountries }: CountriesMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapGeneration, setMapGeneration] = useState(0);
  const { countryCoordinates } = useCountryData(visitedCountries);
  const { theme } = useThemeContext();
  const { token: mapboxToken, unavailable, loading: tokenLoading } = useMapboxToken();
  const verified = countryCoordinates.filter((country) => isVerifiedCoordinate(country.latitude, country.longitude));
  const verifiedKey = verified.map((country) => `${country.country_code}:${country.longitude}:${country.latitude}`).join('|');
  const verifiedRef = useRef(verified);
  verifiedRef.current = verified;

  useEffect(() => {
    if (tokenLoading) return;
    if (unavailable || !mapboxToken) {
      setError('Map unavailable');
      setIsLoading(false);
    }
  }, [tokenLoading, unavailable, mapboxToken]);

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || visitedCountries.length === 0) return;
    if (map.current) {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      map.current.remove();
      map.current = null;
    }

    setIsLoading(true);
    setError(null);
    let failed = false;
    const fail = () => {
      if (failed) return;
      failed = true;
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      map.current?.remove();
      map.current = null;
      setError('Map unavailable');
      setIsLoading(false);
    };

    try {
      mapboxgl.accessToken = mapboxToken;
      const camera = defaultMapCamera();
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: publicStyle(theme),
        projection: 'mercator',
        center: camera.center,
        zoom: camera.zoom,
        pitch: 0,
        attributionControl: { compact: true } as unknown as boolean,
        logoPosition: 'bottom-left',
      });
    } catch {
      fail();
      return;
    }

    const timer = window.setTimeout(fail, 8000);
    map.current.on('load', () => {
      window.clearTimeout(timer);
      map.current?.resize();
      setIsLoading(false);
      setMapGeneration((generation) => generation + 1);
    });
    map.current.on('error', fail);

    return () => {
      window.clearTimeout(timer);
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      map.current?.remove();
      map.current = null;
    };
  }, [mapboxToken, theme, visitedCountries.length]);

  useEffect(() => {
    const addMarkers = () => {
      if (!map.current) return;
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      const places = verifiedRef.current;
      if (places.length === 0) return;

      const bounds = new mapboxgl.LngLatBounds();
      places.forEach((country) => {
        const markerEl = document.createElement('div');
        markerEl.style.cssText = `
          width: 12px;
          height: 12px;
          background: ${getMarkerDotColor(theme)};
          border: 2px solid ${getMarkerBorderColor(theme)};
          border-radius: 50%;
          box-shadow: 0 0 10px ${getMarkerGlow(theme)};
        `;
        const popup = new mapboxgl.Popup({ offset: 25 }).setText(country.country_name);
        const marker = new mapboxgl.Marker(markerEl)
          .setLngLat([country.longitude, country.latitude])
          .setPopup(popup)
          .addTo(map.current!);
        markersRef.current.push(marker);
        bounds.extend([country.longitude, country.latitude]);
      });

      if (bounds.isEmpty()) return;
      if (places.length > 1) map.current.fitBounds(bounds, { padding: 40, duration: 800 });
      else map.current.easeTo({ center: [places[0].longitude, places[0].latitude], zoom: 3, duration: 800 });
    };

    if (!map.current || error) return;
    if (map.current.isStyleLoaded()) addMarkers();
    else map.current.once('load', addMarkers);
  }, [verifiedKey, theme, error, mapGeneration]);

  if (visitedCountries.length === 0) {
    return (
      <MapFallback
        title="No countries on your profile"
        detail="Countries you save on your profile will show here. This map does not invent places."
        countries={[]}
      />
    );
  }

  if (error) {
    return (
      <MapFallback
        title="Map unavailable"
        detail="Tiles or the map key did not load. Your profile countries are listed instead."
        countries={visitedCountries}
      />
    );
  }

  return (
    <div className="relative h-full min-h-[220px] w-full overflow-hidden rounded-lg border border-border bg-muted">
      <div ref={mapContainer} className="absolute inset-0" />
      {isLoading && (
        <div className="absolute inset-0">
          <MapFallback title="Loading map" detail="If the tiles do not arrive, this switches to your country list." countries={visitedCountries} />
        </div>
      )}
      {!isLoading && verified.length === 0 && (
        <div className="absolute inset-x-2 bottom-2 rounded-md bg-background/90 px-2 py-1 text-xs text-muted-foreground">
          No verified coordinates for these countries yet.
        </div>
      )}
    </div>
  );
};
