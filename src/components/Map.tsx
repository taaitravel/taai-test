
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';

interface MapLocation {
  city: string;
  lat: number;
  lng: number;
  category?: 'flight' | 'hotel' | 'activity' | 'reservation';
}

interface MapProps {
  locations?: MapLocation[];
}

const Map = ({ locations = [] }: MapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);

  // Simple validation
  if (locations.some(loc => !loc.lat || !loc.lng)) {
    console.warn('Invalid coordinates detected in locations');
  }

const getCategoryColor = (category?: string) => {
  // Using budget overview colors from BudgetPieChart
  switch (category) {
    case 'flight':
      return '#feb2b2'; // hsl(351, 85%, 75%) - Primary pink
    case 'hotel':
      return '#fdba74'; // hsl(15, 80%, 70%) - Orange  
    case 'activity':
      return '#fcd34d'; // hsl(25, 75%, 65%) - Yellow-orange
    case 'reservation':
      return '#93c5fd'; // hsl(200, 70%, 70%) - Blue
    default:
      return '#feb2b2'; // Default to primary pink
  }
};

const getHoverColor = (category?: string) => {
  // Slightly brighter versions for hover
  switch (category) {
    case 'flight':
      return '#fca5a5'; // Slightly brighter pink
    case 'hotel':
      return '#fb923c'; // Slightly brighter orange
    case 'activity':
      return '#fbbf24'; // Slightly brighter yellow
    case 'reservation':
      return '#60a5fa'; // Slightly brighter blue
    default:
      return '#fca5a5'; // Default hover
  }
};

  // Fetch Mapbox token
  useEffect(() => {
    const fetchMapboxToken = async () => {
      try {
        // Get current session for auth header
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setError('Authentication required for map access');
          return;
        }

        const { data, error } = await supabase.functions.invoke('get-mapbox-token', {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        });
        
        if (error) throw error;
        if (data?.token) {
          setMapboxToken(data.token);
        } else {
          throw new Error('No token received');
        }
      } catch (err: any) {
        setError('Failed to load map: ' + (err?.message || 'Unknown error'));
      }
    };

    fetchMapboxToken();
  }, []);

  // Initialize map with forced refresh
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    // Force cleanup of any existing map
    if (map.current) {
      console.log('🗺️ FORCE REMOVING existing map');
      map.current.remove();
      map.current = null;
    }

    try {
      console.log('🗺️ FORCE CREATING NEW MAP with token:', !!mapboxToken);
      mapboxgl.accessToken = mapboxToken;
      
      const mapCenter: [number, number] = locations.length > 0 
        ? [locations[0].lng, locations[0].lat] 
        : [0, 20];
        
      const mapZoom = locations.length > 1 ? 2 : 8;
      
      console.log('🗺️ CREATING MAP WITH STYLE: dark-v11');
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        projection: 'mercator',
        zoom: mapZoom,
        center: mapCenter,
        hash: false,
        refreshExpiredTiles: true
      });

      console.log('🗺️ Map instance created, style:', map.current.getStyle());

      // Add navigation controls
      map.current.addControl(
        new mapboxgl.NavigationControl({
          visualizePitch: true,
        }),
        'top-right'
      );

      map.current.on('load', () => {
        console.log('🗺️ Map loaded successfully! Style URL:', map.current?.getStyle()?.name);
        setMapLoaded(true);
        setError(null);
      });

      map.current.on('error', (e) => {
        console.error('🗺️ Map error:', e);
        setError('Map failed to load properly: ' + e.error?.message);
      });

      map.current.on('styledata', () => {
        console.log('🗺️ Map style loaded:', map.current?.getStyle()?.name);
      });

    } catch (err: any) {
      console.error('🗺️ Map initialization error:', err);
      setError('Failed to initialize map: ' + err.message);
    }

    return () => {
      console.log('🗺️ Cleanup: removing map');
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [mapboxToken, locations.length]); // Added locations.length to force refresh

  // Add markers to map
  useEffect(() => {
    if (!map.current || !mapLoaded || !locations.length) return;

    // Remove existing markers
    const existingMarkers = document.querySelectorAll('.mapboxgl-marker');
    existingMarkers.forEach(marker => marker.remove());

    locations.forEach((location) => {
      // Create marker element
      const el = document.createElement('div');
      el.className = 'custom-marker';
      
      const categoryColor = getCategoryColor(location.category);
      el.style.cssText = `
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background-color: ${categoryColor};
        border: 3px solid #ffffff;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
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
      new mapboxgl.Marker(el)
        .setLngLat([location.lng, location.lat])
        .setPopup(popup)
        .addTo(map.current!);
    });

    // Fit map to bounds if multiple locations
    if (locations.length > 1) {
      const bounds = new mapboxgl.LngLatBounds();
      locations.forEach(location => {
        bounds.extend([location.lng, location.lat]);
      });
      map.current!.fitBounds(bounds, { 
        padding: { top: 50, bottom: 50, left: 50, right: 50 }
      });
    } else if (locations.length === 1) {
      map.current!.setCenter([locations[0].lng, locations[0].lat]);
      map.current!.setZoom(8);
    }
  }, [mapLoaded, locations]);

  // Show error state
  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-background/80 rounded-lg border border-border">
        <div className="text-center text-muted-foreground">
          <p className="text-sm">{error}</p>
          <p className="text-xs mt-2">Please check your connection and try again</p>
        </div>
      </div>
    );
  }


  // Show loading state
  if (!mapboxToken || !mapLoaded) {
    return (
        <div className="w-full h-full flex items-center justify-center bg-background/80 rounded-lg border border-border">
        <div className="text-center text-muted-foreground">
          <p className="text-sm">
            {!mapboxToken ? 'Loading map...' : 'Initializing map...'}
          </p>
          {locations.length > 0 && (
            <p className="text-xs mt-2">
              Preparing {locations.length} location{locations.length !== 1 ? 's' : ''} for display
            </p>
          )}
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

export { Map };
export default Map;
