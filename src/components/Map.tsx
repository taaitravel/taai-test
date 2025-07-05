
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface MapLocation {
  city: string;
  lat: number;
  lng: number;
}

interface MapProps {
  locations?: MapLocation[];
  locationNames?: string[];
}

const Map = ({ locations = [], locationNames = [] }: MapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          setError('Mapbox token not configured.');
          setIsLoading(false);
          return;
        }

        // Initialize map
        mapboxgl.accessToken = mapboxToken;
        
        // Determine map center and zoom based on locations
        let center: [number, number] = [0, 0];
        let zoom = 2;

        if (locations.length > 0) {
          // Calculate center of all locations
          const avgLat = locations.reduce((sum, loc) => sum + loc.lat, 0) / locations.length;
          const avgLng = locations.reduce((sum, loc) => sum + loc.lng, 0) / locations.length;
          center = [avgLng, avgLat];
          zoom = locations.length === 1 ? 10 : 6;
        }

        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/dark-v11',
          center: center,
          zoom: zoom,
        });

        // Add navigation controls
        map.current.addControl(
          new mapboxgl.NavigationControl({
            visualizePitch: true,
          }),
          'top-right'
        );

        map.current.on('load', () => {
          // Add markers for each location
          locations.forEach((location, index) => {
            // Create custom marker element
            const markerEl = document.createElement('div');
            markerEl.className = 'custom-marker';
            markerEl.innerHTML = `
              <div style="
                background: linear-gradient(135deg, #fbbf24, #f59e0b);
                width: 30px;
                height: 30px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #1f2937;
                font-weight: bold;
                font-size: 12px;
                box-shadow: 0 2px 10px rgba(251, 191, 36, 0.3);
                border: 2px solid white;
              ">
                ${index + 1}
              </div>
            `;

            // Create popup
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
                ${location.city}
              </div>
            `);

            // Add marker to map
            new mapboxgl.Marker(markerEl)
              .setLngLat([location.lng, location.lat])
              .setPopup(popup)
              .addTo(map.current!);
          });

          // If there are multiple locations, fit the map to show all markers
          if (locations.length > 1) {
            const bounds = new mapboxgl.LngLatBounds();
            locations.forEach(location => {
              bounds.extend([location.lng, location.lat]);
            });
            map.current!.fitBounds(bounds, { padding: 50 });
          }

          setIsLoading(false);
        });

      } catch (err) {
        console.error('Error initializing map:', err);
        setError('Failed to load map');
        setIsLoading(false);
      }
    };

    initializeMap();

    // Cleanup
    return () => {
      map.current?.remove();
    };
  }, [locations]);

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-[#2d2a1f] rounded-lg border border-yellow-500/20">
        <div className="text-center">
          <MapPin className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
          <p className="text-yellow-200 font-medium">Map Unavailable</p>
          <p className="text-yellow-300/70 text-sm mt-1">{error}</p>
          {locationNames.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-yellow-300/70 text-sm">Your destinations:</p>
              {locationNames.map((location, index) => (
                <div key={index} className="flex items-center justify-center space-x-2 text-sm text-yellow-300/70">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <span>{location}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#2d2a1f] rounded-lg border border-yellow-500/20">
        <div className="text-center">
          <MapPin className="h-12 w-12 text-yellow-400 mx-auto mb-4 animate-pulse" />
          <p className="text-yellow-200 font-medium">Loading Map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="absolute inset-0 rounded-lg" />
    </div>
  );
};

export default Map;
