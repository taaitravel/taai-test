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
      return '#feb2b2';
    case 'hotel':
      return '#fdba74';
    case 'activity':
      return '#fcd34d';
    case 'reservation':
      return '#93c5fd';
    case 'destination':
      return '#a78bfa';
    default:
      return '#feb2b2';
  }
};

const getHoverColor = (category?: string) => {
  switch (category) {
    case 'flight':
      return '#fca5a5';
    case 'hotel':
      return '#fb923c';
    case 'activity':
      return '#fbbf24';
    case 'reservation':
      return '#60a5fa';
    case 'destination':
      return '#8b5cf6';
    default:
      return '#fca5a5';
  }
};

const Map = ({ locations = [] }: MapProps) => {
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
        
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
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
        style: 'mapbox://styles/mapbox/light-v11',
        center: [0, 20],
        zoom: 2,
        projection: 'mercator' as any,
      });

      console.log('🗺️ Map: Map instance created');

      map.current.on('load', () => {
        console.log('🗺️ Map: Map loaded successfully');
        setLoading(false);
        setError(null);
      });

      map.current.on('idle', () => {
        console.log('🗺️ Map: Map is idle and ready');
        setLoading(false);
        setError(null);
      });

      map.current.on('error', (e) => {
        console.error('🗺️ Map: Map error:', e);
        setError('Map failed to load');
        setLoading(false);
      });

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
      
      if (!location.lat || !location.lng || 
          location.lat < -90 || location.lat > 90 || 
          location.lng < -180 || location.lng > 180) {
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
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background-color: ${categoryColor};
        border: 2px solid #ffffff;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        cursor: pointer;
        transition: all 0.2s ease;
      `;

      // Add hover effects
      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.2)';
        el.style.backgroundColor = getHoverColor(location.category);
      });

      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
        el.style.backgroundColor = categoryColor;
      });

      // Create popup
      const popup = new mapboxgl.Popup({ 
        offset: 25,
        closeButton: false,
        className: 'custom-popup'
      }).setHTML(`
        <div style="color: #171821; font-weight: 600; padding: 8px; background: white; border-radius: 6px;">
          <div style="font-size: 14px;">${location.city}</div>
          ${location.category ? `<div style="font-size: 12px; color: #666; text-transform: capitalize;">${location.category}</div>` : ''}
        </div>
      `);

      // Add marker to map
      try {
        new mapboxgl.Marker(el)
          .setLngLat([location.lng, location.lat])
          .setPopup(popup)
          .addTo(map.current!);
        
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
    return (
      <div className="h-full flex items-center justify-center bg-muted text-muted-foreground">
        <div className="text-center">
          <p className="text-lg font-medium mb-2">Unable to load map</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    console.log('🗺️ Map: Rendering loading state');
    return (
      <div className="h-full flex items-center justify-center bg-muted text-muted-foreground">
        <div className="text-center">
          <p className="text-lg font-medium mb-2">Loading map...</p>
          <p className="text-sm">Initializing Mapbox</p>
        </div>
      </div>
    );
  }

  console.log('🗺️ Map: Rendering map container');
  return (
    <div className="h-full w-full relative">
      <div ref={mapContainer} className="absolute inset-0" />
    </div>
  );
};

export { Map };
export default Map;