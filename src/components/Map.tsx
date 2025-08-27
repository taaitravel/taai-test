import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
interface MapLocation {
  city: string;
  lat: number;
  lng: number;
  category?: 'flight' | 'hotel' | 'activity' | 'reservation' | 'destination';
}
interface MapProps {
  locations?: MapLocation[];
}
const getCategoryColor = (category?: string) => {
  switch (category) {
    case 'flight':
      return 'hsl(var(--primary))';
    case 'hotel':
      return 'hsl(var(--accent))';
    case 'activity':
      return 'hsl(var(--secondary))';
    case 'reservation':
      return 'hsl(var(--chart-1))';
    case 'destination':
      return 'hsl(var(--chart-2))';
    default:
      return 'hsl(var(--primary))';
  }
};
const getHoverColor = (category?: string) => {
  switch (category) {
    case 'flight':
      return 'hsl(var(--primary) / 0.8)';
    case 'hotel':
      return 'hsl(var(--accent) / 0.8)';
    case 'activity':
      return 'hsl(var(--secondary) / 0.8)';
    case 'reservation':
      return 'hsl(var(--chart-1) / 0.8)';
    case 'destination':
      return 'hsl(var(--chart-2) / 0.8)';
    default:
      return 'hsl(var(--primary) / 0.8)';
  }
};
const Map = ({
  locations = []
}: MapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  console.log('🗺️ Map component rendered with locations:', locations.length);
  console.log('🗺️ Map locations details:', locations);

  // Fetch Mapbox token
  useEffect(() => {
    const fetchMapboxToken = async () => {
      try {
        console.log('🗺️ Map: Attempting to get Mapbox token...');
        const {
          data,
          error
        } = await supabase.functions.invoke('get-mapbox-token');
        console.log('🗺️ Map: Token response data:', data);
        console.log('🗺️ Map: Token response error:', error);
        if (error) {
          console.error('🗺️ Map: Token error:', error);
          setError('Unable to load map. Please check configuration.');
          setLoading(false);
          return;
        }

        // The token might be directly in data or nested in data.token
        const mapboxToken = data?.token || data;
        console.log('🗺️ Map: Extracted token:', mapboxToken ? 'Token received' : 'No token');
        if (!mapboxToken || typeof mapboxToken !== 'string') {
          console.error('🗺️ Map: Invalid token received:', typeof mapboxToken);
          setError('Invalid Mapbox token received.');
          setLoading(false);
          return;
        }
        console.log('🗺️ Map: Token received successfully, length:', mapboxToken.length);
        setMapboxToken(mapboxToken);
      } catch (err: any) {
        console.error('🗺️ Map: Error getting token:', err);
        setError('Failed to load map: ' + (err?.message || 'Unknown error'));
        setLoading(false);
      }
    };
    fetchMapboxToken();
  }, []);

  // Initialize map when token is available
  useEffect(() => {
    if (!mapboxToken || !mapContainer.current || map.current) return;
    console.log('🗺️ Map: Initializing map with token');
    try {
      mapboxgl.accessToken = mapboxToken;
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [0, 20],
        zoom: 2,
        projection: 'mercator' as any,
        antialias: true
      });

      // Add subtle styling when map loads
      map.current.on('style.load', () => {
        // Add a subtle overlay to make the map lighter
        map.current?.addLayer({
          id: 'light-overlay',
          type: 'background',
          paint: {
            'background-color': 'hsl(var(--background))',
            'background-opacity': 0.3
          }
        });
      });
      console.log('🗺️ Map: Map instance created');

      // Set a timeout to force loading to false if map doesn't load
      const loadTimeout = setTimeout(() => {
        console.log('🗺️ Map: Load timeout reached, setting loading to false');
        setLoading(false);
      }, 5000);
      map.current.on('load', () => {
        console.log('🗺️ Map: Map loaded successfully');
        clearTimeout(loadTimeout);
        setLoading(false);
        setError(null);
      });
      map.current.on('idle', () => {
        console.log('🗺️ Map: Map is idle and ready');
        clearTimeout(loadTimeout);
        setLoading(false);
        setError(null);
      });
      map.current.on('error', e => {
        console.error('🗺️ Map: Map error:', e);
        clearTimeout(loadTimeout);
        setError('Map failed to load');
        setLoading(false);
      });

      // Also check if map is already loaded (sometimes events don't fire)
      if (map.current.loaded()) {
        console.log('🗺️ Map: Map already loaded');
        clearTimeout(loadTimeout);
        setLoading(false);
        setError(null);
      }
    } catch (err: any) {
      console.error('🗺️ Map: Error initializing map:', err);
      setError('Failed to initialize map: ' + err.message);
      setLoading(false);
    }
    return () => {
      if (map.current) {
        console.log('🗺️ Map: Cleaning up map');
        map.current.remove();
        map.current = null;
      }
    };
  }, [mapboxToken]);

  // Add markers when locations change
  useEffect(() => {
    if (!map.current || !locations.length || loading) {
      console.log('🗺️ Map: Not ready for markers - map:', !!map.current, 'locations:', locations.length, 'loading:', loading);
      return;
    }
    console.log('🗺️ Map: Adding markers for locations:', locations);

    // Clear existing markers
    const existingMarkers = document.querySelectorAll('.mapboxgl-marker');
    existingMarkers.forEach(marker => marker.remove());
    const bounds = new mapboxgl.LngLatBounds();
    let validLocations = 0;
    locations.forEach((location, index) => {
      console.log(`🗺️ Map: Processing location ${index}:`, location);
      if (!location.lat || !location.lng || location.lat < -90 || location.lat > 90 || location.lng < -180 || location.lng > 180) {
        console.warn('🗺️ Map: Invalid coordinates for location:', location);
        return;
      }
      validLocations++;
      bounds.extend([location.lng, location.lat]);

      // Create marker element
      const el = document.createElement('div');
      el.className = 'custom-marker';
      const categoryColor = getCategoryColor(location.category);
      el.style.cssText = `
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: ${categoryColor};
        border: 3px solid hsl(var(--background));
        box-shadow: 0 4px 12px hsl(var(--foreground) / 0.15), 
                    0 2px 4px hsl(var(--foreground) / 0.1);
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
      `;

      // Add inner glow effect
      const innerEl = document.createElement('div');
      innerEl.style.cssText = `
        position: absolute;
        top: 2px;
        left: 2px;
        right: 2px;
        bottom: 2px;
        border-radius: 50%;
        background: linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 70%);
        pointer-events: none;
      `;
      el.appendChild(innerEl);

      // Add hover effects
      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.3)';
        el.style.background = getHoverColor(location.category);
        el.style.boxShadow = `0 6px 20px hsl(var(--foreground) / 0.25), 
                             0 4px 8px hsl(var(--foreground) / 0.15)`;
        el.style.zIndex = '1000';
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
        el.style.background = categoryColor;
        el.style.boxShadow = `0 4px 12px hsl(var(--foreground) / 0.15), 
                             0 2px 4px hsl(var(--foreground) / 0.1)`;
        el.style.zIndex = 'auto';
      });

      // Create popup
      const popup = new mapboxgl.Popup({
        offset: 30,
        closeButton: false,
        className: 'custom-popup'
      }).setHTML(`
        <div style="
          color: hsl(var(--foreground)); 
          font-weight: 600; 
          padding: 12px 16px; 
          background: hsl(var(--background)); 
          border: 1px solid hsl(var(--border));
          border-radius: 12px;
          box-shadow: 0 8px 24px hsl(var(--foreground) / 0.15);
          backdrop-filter: blur(8px);
          font-family: inherit;
        ">
          <div style="font-size: 15px; margin-bottom: 4px;">${location.city}</div>
          ${location.category ? `<div style="font-size: 13px; color: hsl(var(--muted-foreground)); text-transform: capitalize;">${location.category}</div>` : ''}
        </div>
      `);

      // Add marker to map
      try {
        new mapboxgl.Marker(el).setLngLat([location.lng, location.lat]).setPopup(popup).addTo(map.current!);
        console.log(`🗺️ Map: Added marker for ${location.city} at [${location.lng}, ${location.lat}]`);
      } catch (markerErr) {
        console.error(`🗺️ Map: Error adding marker for ${location.city}:`, markerErr);
      }
    });
    console.log(`🗺️ Map: Added ${validLocations} valid markers out of ${locations.length} locations`);

    // Fit map to markers or center on single location
    if (validLocations > 0) {
      try {
        if (validLocations === 1) {
          const location = locations.find(l => l.lat && l.lng);
          if (location) {
            console.log('🗺️ Map: Centering on single location:', location);
            map.current?.setCenter([location.lng, location.lat]);
            map.current?.setZoom(10);
          }
        } else {
          console.log('🗺️ Map: Fitting to bounds for multiple locations');
          map.current?.fitBounds(bounds, {
            padding: 50,
            maxZoom: 15
          });
        }
      } catch (err) {
        console.error('🗺️ Map: Error setting map bounds:', err);
      }
    } else {
      console.warn('🗺️ Map: No valid locations to display');
    }
  }, [locations, loading]);
  console.log('🗺️ Map: Current state - loading:', loading, 'error:', error, 'token:', !!mapboxToken);
  if (error) {
    console.error('🗺️ Map: Rendering error state:', error);
    return <div className="h-full flex items-center justify-center bg-background border border-border rounded-xl">
        <div className="text-center p-8">
          <p className="text-lg font-medium mb-2 text-foreground">Unable to load map</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>;
  }
  if (loading) {
    console.log('🗺️ Map: Rendering loading state');
    return;
  }
  console.log('🗺️ Map: Rendering map container');
  return <div className="h-full w-full relative rounded-xl overflow-hidden border border-border bg-background shadow-lg">
      <div ref={mapContainer} className="absolute inset-0" />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-background/5" />
    </div>;
};
export { Map };
export default Map;