import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { useThemeContext } from '@/contexts/ThemeContext';
import { getMapStyle, getMapFog, getMarkerBorderColor } from '@/lib/mapStyles';

interface WorldMapProps {
  visitedCountries: string[];
}

const WorldMap = ({ visitedCountries }: WorldMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const { theme } = useThemeContext();

  // Countries coordinates mapping
  const countryCoordinates: { [key: string]: [number, number] } = {
    'France': [2.2137, 46.2276],
    'Italy': [12.5674, 41.8719],
    'Spain': [-3.7492, 40.4637],
    'United States': [-95.7129, 37.0902],
    'Japan': [138.2529, 36.2048],
    'United Kingdom': [-3.4360, 55.3781],
    'Germany': [10.4515, 51.1657],
    'Australia': [133.7751, -25.2744],
    'Brazil': [-47.8825, -15.7942],
    'Canada': [-106.3468, 56.1304],
    'Mexico': [-102.5528, 23.6345],
    'Thailand': [100.9925, 15.8700],
    'Greece': [21.8243, 39.0742],
    'Turkey': [35.2433, 38.9637],
    'Egypt': [30.8025, 26.8206],
    'Morocco': [-7.0926, 31.7917],
    'India': [78.9629, 20.5937],
    'China': [104.1954, 35.8617]
  };

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

    if (map.current) {
      map.current.remove();
      map.current = null;
    }

    setIsLoading(true);
    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current!,
      style: getMapStyle(theme, 'world'),
      projection: 'globe',
      zoom: 1.2,
      center: [0, 30],
      interactive: false,
    });

    map.current.on('style.load', () => {
      const fog = getMapFog(theme);
      if (fog) map.current?.setFog(fog);

      const borderColor = getMarkerBorderColor(theme);
      visitedCountries.forEach(country => {
        const coordinates = countryCoordinates[country];
        if (coordinates) {
          const el = document.createElement('div');
          el.className = 'w-4 h-4 rounded-full border-2 shadow-lg';
          el.style.background = 'linear-gradient(135deg, #fbbf24, #f59e0b)';
          el.style.borderColor = borderColor;
          el.style.boxShadow = '0 2px 10px rgba(251, 191, 36, 0.5)';

          const popup = new mapboxgl.Popup({
            offset: 25,
            className: 'custom-popup'
          }).setHTML(`
            <div style="
              background: ${theme === 'light' ? '#ffffff' : '#1f2937'};
              color: ${theme === 'light' ? '#1a1a2e' : 'white'};
              padding: 8px 12px;
              border-radius: 6px;
              font-size: 14px;
              font-weight: 500;
            ">
              ${country}
            </div>
          `);

          new mapboxgl.Marker(el)
            .setLngLat(coordinates)
            .setPopup(popup)
            .addTo(map.current!);
        }
      });

      setIsLoading(false);
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [mapboxToken, theme, visitedCountries]);

  if (error) {
    return (
      <div className="h-48 flex items-center justify-center bg-card rounded-lg border border-border">
        <div className="text-center">
          <div className="text-primary text-sm">{error}</div>
          {visitedCountries.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1 justify-center">
              {visitedCountries.map((country, index) => (
                <span key={index} className="px-2 py-1 bg-secondary text-foreground text-xs rounded border border-border">
                  {country}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-48 flex items-center justify-center bg-card rounded-lg border border-border">
        <div className="text-center">
          <div className="text-muted-foreground text-sm animate-pulse">Loading Map...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-48 bg-card rounded-lg overflow-hidden">
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
};

export default WorldMap;