
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCityGeocodes } from '@/hooks/useCityGeocodes';

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
  const { coords } = useCityGeocodes(locationNames || []);
  const resolvedLocations: MapLocation[] = (locations && locations.length > 0)
    ? locations
    : coords.map(c => ({ city: c.name, lat: c.lat, lng: c.lng }));

  useEffect(() => {
    console.log('🗺️ Map useEffect triggered');
    console.log('📍 Locations to display:', resolvedLocations.length ? resolvedLocations : locationNames);
    console.log('🏗️ Container exists:', !!mapContainer.current);
    
    if (!mapContainer.current) {
      console.error('❌ No map container found');
      return;
    }

    const initializeMap = async () => {
      try {
        console.log('🚀 Starting map initialization...');
        
        // Get Mapbox token
        console.log('🔑 Fetching Mapbox token...');
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        
        console.log('📤 Token response:', { data, error });
        
        if (error) {
          throw new Error(`Token fetch failed: ${error.message}`);
        }

        const mapboxToken = data?.token;
        if (!mapboxToken) {
          throw new Error('No Mapbox token received');
        }

        console.log('✅ Token received, length:', mapboxToken.length);
        
        // Initialize Mapbox
        mapboxgl.accessToken = mapboxToken;
        
        // Calculate map center and zoom
        let center: [number, number] = [0, 0];
        let zoom = 2;


        console.log('🎯 Map center:', center, 'zoom:', zoom);

        // Create map
        map.current = new mapboxgl.Map({
          container: mapContainer.current!,
          style: 'mapbox://styles/mapbox/dark-v11',
          center: center,
          zoom: zoom,
        });

        // Add navigation controls
        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

        map.current.on('load', () => {
          console.log('🎉 Map loaded successfully!');
          
          // Add markers for each location
          resolvedLocations.forEach((location, index) => {
            console.log(`📍 Adding marker ${index + 1}: ${location.city}`);
            
            // Create popup
            const popup = new mapboxgl.Popup({ offset: 25 })
              .setHTML(`<strong>${location.city}</strong>`);

            // Add marker
            new mapboxgl.Marker()
              .setLngLat([location.lng, location.lat])
              .setPopup(popup)
              .addTo(map.current!);
          });


          setIsLoading(false);
          console.log('✅ Map initialization complete!');
        });

        map.current.on('error', (e) => {
          console.error('💥 Map error:', e);
          setError('Failed to load map');
          setIsLoading(false);
        });

      } catch (err: any) {
        console.error('💥 Initialization error:', err);
        setError(err.message || 'Failed to initialize map');
        setIsLoading(false);
      }
    };

    initializeMap();

    // Cleanup
    return () => {
      if (map.current) {
        console.log('🧹 Cleaning up map...');
        map.current.remove();
      }
    };
  }, [JSON.stringify(resolvedLocations)]);

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
          <p className="text-yellow-200 font-medium">Initializing Map...</p>
          <p className="text-yellow-300/70 text-sm mt-1">Loading Tokyo & Osaka</p>
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
