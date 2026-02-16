import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';

interface WorldMapProps {
  visitedCountries: string[];
}

const WorldMap = ({ visitedCountries }: WorldMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    if (!mapContainer.current) return;

    const initializeMap = async () => {
      try {
        // Get Mapbox token from Supabase Edge Function
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        
        if (error) {
          console.error('Error getting Mapbox token:', error);
          setError('Unable to load map. Please check configuration.');
          setIsLoading(false);
          return;
        }

        const mapboxToken = data?.token;
        if (!mapboxToken) {
          console.error('No token in response data');
          setError('Mapbox token not configured.');
          setIsLoading(false);
          return;
        }

        // Initialize map
        mapboxgl.accessToken = mapboxToken;
        
        map.current = new mapboxgl.Map({
          container: mapContainer.current!,
          style: 'mapbox://styles/mapbox/dark-v11',
          projection: 'globe',
          zoom: 1.2,
          center: [0, 30],
          interactive: false, // Make it non-interactive for display purposes
        });

        map.current.on('style.load', () => {
          // Add fog for a nice effect
          map.current?.setFog({
            color: 'rgb(23, 24, 33)',
            'high-color': 'rgb(50, 50, 60)',
            'horizon-blend': 0.1,
          });

          // Add markers for visited countries
          visitedCountries.forEach(country => {
            const coordinates = countryCoordinates[country];
            if (coordinates) {
              // Create a custom marker
              const el = document.createElement('div');
              el.className = 'w-4 h-4 rounded-full border-2 border-white shadow-lg';
              el.style.background = 'linear-gradient(135deg, #fbbf24, #f59e0b)';
              el.style.boxShadow = '0 2px 10px rgba(251, 191, 36, 0.5)';
              
              // Add popup
              const popup = new mapboxgl.Popup({
                offset: 25,
                className: 'custom-popup'
              }).setHTML(`
                <div style="
                  background: #1f2937;
                  color: white;
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

      } catch (err) {
        console.error('Error initializing map:', err);
        setError('Failed to load map');
        setIsLoading(false);
      }
    };

    initializeMap();

    return () => {
      map.current?.remove();
    };
  }, [visitedCountries]);

  if (error) {
    return (
      <div className="h-48 flex items-center justify-center bg-[#171820] rounded-lg border border-yellow-500/20">
        <div className="text-center">
          <div className="text-yellow-400 text-sm">{error}</div>
          {visitedCountries.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1 justify-center">
              {visitedCountries.map((country, index) => (
                <span key={index} className="px-2 py-1 bg-white/20 text-white text-xs rounded border border-white/30">
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
      <div className="h-48 flex items-center justify-center bg-[#171820] rounded-lg border border-yellow-500/20">
        <div className="text-center">
          <div className="text-yellow-200 text-sm animate-pulse">Loading Map...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-48 bg-[#171820] rounded-lg overflow-hidden">
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
};

export default WorldMap;