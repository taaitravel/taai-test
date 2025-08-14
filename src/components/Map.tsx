
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
  category?: 'hotel' | 'activity' | 'reservation' | 'destination';
}

interface MapProps {
  locations?: MapLocation[];
  locationNames?: string[];
}

const Map = ({ locations = [], locationNames = [] }: MapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
const { coords } = useCityGeocodes(locationNames || []);
const resolvedLocations: MapLocation[] = (locations && locations.length > 0)
  ? locations
  : coords.map(c => ({ city: c.name, lat: c.lat, lng: c.lng }));

// Marker color resolver using semantic tokens
const getMarkerColor = (category?: string) => {
  switch (category) {
    case 'activity':
      return 'hsl(var(--marker-activity))';
    case 'hotel':
      return 'hsl(var(--marker-hotel))';
    case 'reservation':
      return 'hsl(var(--marker-reservation))';
    default:
      return 'hsl(var(--primary))';
  }
};

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

        // Prepare bounds if we have locations
        const hasLocations = resolvedLocations && resolvedLocations.length > 0;
        const bounds = new mapboxgl.LngLatBounds();
        if (hasLocations) {
          resolvedLocations.forEach((loc) => bounds.extend([loc.lng, loc.lat]));
          if (resolvedLocations.length === 1) {
            center = [resolvedLocations[0].lng, resolvedLocations[0].lat];
            zoom = 8;
          } else {
            center = bounds.getCenter().toArray() as [number, number];
            zoom = 2;
          }
        }

        console.log('🎯 Map center:', center, 'zoom:', zoom);

        // Create map
        map.current = new mapboxgl.Map({
          container: mapContainer.current!,
          style: 'mapbox://styles/mapbox/dark-v11',
          projection: 'mercator',
          center: center,
          zoom: zoom,
        });

        // Atmosphere and fog for consistency with dashboard map
        // Default map settings (no fog)


        // Add navigation controls
        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

        map.current.on('load', () => {
          console.log('🎉 Map loaded successfully!');
          setIsLoading(false);
        });

        map.current.on('error', (e) => {
          console.error('💥 Map error:', e);
          setError('Failed to load map');
          setIsLoading(false);
        });

        // Mark initialized for UI parity with dashboard map
        setIsLoading(false);

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
  }, []);

  // Add/Update markers when locations change (aligned with CountriesMap flow)
  useEffect(() => {
    const addMarkers = () => {
      if (!map.current) return;
      if (!resolvedLocations || resolvedLocations.length === 0) return;
      
      // Clear old markers
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

const bounds = new mapboxgl.LngLatBounds();
resolvedLocations.forEach((location) => {
  const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`<strong>${location.city}</strong>`);

  // Custom marker element with category-based styling
  const el = document.createElement('div');
  el.style.width = '14px';
  el.style.height = '14px';
  el.style.borderRadius = '50%';
  el.style.backgroundColor = getMarkerColor(location.category);
  el.style.border = '2px solid rgba(0,0,0,0.5)';
  el.style.boxShadow = '0 0 0 2px rgba(255,255,255,0.2)';

  const marker = new mapboxgl.Marker({ element: el })
    .setLngLat([location.lng, location.lat])
    .setPopup(popup)
    .addTo(map.current!);

  markersRef.current.push(marker);
  bounds.extend([location.lng, location.lat]);
});

      if (resolvedLocations.length > 1) {
        map.current.fitBounds(bounds, { padding: 40, duration: 800 });
      } else {
        map.current.easeTo({ center: [resolvedLocations[0].lng, resolvedLocations[0].lat], zoom: 8, duration: 800 });
      }
    };

    if (!map.current) return;
    if (map.current.isStyleLoaded()) {
      addMarkers();
    } else {
      map.current.once('load', addMarkers);
    }
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
          <p className="text-yellow-300/70 text-sm mt-1">Loading destinations…</p>
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
