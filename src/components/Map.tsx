import React from 'react';
import { useEffect, useRef, useState, useCallback } from 'react';
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
      return 'hsl(220, 90%, 65%)'; // Bright blue
    case 'hotel':
      return 'hsl(280, 85%, 70%)'; // Bright purple
    case 'activity':
      return 'hsl(160, 80%, 55%)'; // Bright teal
    case 'reservation':
      return 'hsl(30, 95%, 65%)'; // Bright orange
    case 'destination':
      return '#ff849c'; // Soft pink/coral
    default:
      return 'hsl(220, 90%, 65%)'; // Bright blue
  }
};
const getHoverColor = (category?: string) => {
  switch (category) {
    case 'flight':
      return 'hsl(220, 100%, 75%)';
    case 'hotel':
      return 'hsl(280, 95%, 80%)';
    case 'activity':
      return 'hsl(160, 90%, 65%)';
    case 'reservation':
      return 'hsl(30, 100%, 75%)';
    case 'destination':
      return '#ffaec0'; // Lighter pink for hover
    default:
      return 'hsl(220, 100%, 75%)';
  }
};
const Map = ({
  locations = []
}: MapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  console.log('🗺️ Map component rendered with locations:', locations.length);
  console.log('🗺️ Map locations details:', locations);

  // Fetch Mapbox token with retry
  useEffect(() => {
    const fetchMapboxToken = async () => {
      try {
        setError(null);
        console.log('🗺️ Map: Attempting to get Mapbox token...');
        
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        
        if (error) {
          throw new Error(error.message || 'Token fetch failed');
        }

        const mapboxToken = data?.token || data;
        if (!mapboxToken || typeof mapboxToken !== 'string') {
          throw new Error('Invalid token received');
        }
        
        console.log('🗺️ Map: Token received successfully');
        setMapboxToken(mapboxToken);
        setRetryCount(0);
      } catch (err: any) {
        console.error('🗺️ Map: Error getting token:', err);
        
        if (retryCount < 3) {
          console.log(`🗺️ Map: Retrying token fetch (${retryCount + 1}/3)...`);
          setTimeout(() => setRetryCount(prev => prev + 1), 2000 * Math.pow(2, retryCount));
        } else {
          setError('Unable to load map. Please check your connection and try refreshing.');
          setLoading(false);
        }
      }
    };
    
    fetchMapboxToken();
  }, [retryCount]);

  // Initialize map when token is available
  useEffect(() => {
    if (!mapboxToken || !mapContainer.current || map.current) {
      console.log('🗺️ Map: Skipping init - token:', !!mapboxToken, 'container:', !!mapContainer.current, 'existing map:', !!map.current);
      return;
    }
    
    console.log('🗺️ Map: Initializing map with token');
    setLoading(true);
    
    try {
      mapboxgl.accessToken = mapboxToken;
      
      const newMap = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/taai/cme4vu58w01r701s29jan9lw9',
        center: [0, 20],
        zoom: 2,
        projection: 'mercator' as any,
        antialias: true,
        attributionControl: false
      });

      map.current = newMap;

      // Add navigation controls
      newMap.addControl(new mapboxgl.NavigationControl(), 'top-right');

      const loadTimeout = setTimeout(() => {
        console.log('🗺️ Map: Load timeout reached - forcing ready state');
        setLoading(false);
      }, 5000);

      const handleMapReady = () => {
        console.log('🗺️ Map: Map is ready!');
        clearTimeout(loadTimeout);
        setLoading(false);
        setError(null);
      };

      newMap.once('load', () => {
        console.log('🗺️ Map: Load event fired');
        handleMapReady();
      });
      
      newMap.once('idle', () => {
        console.log('🗺️ Map: Idle event fired');
        handleMapReady();
      });
      
      newMap.on('error', (e) => {
        console.error('🗺️ Map: Map error:', e);
        clearTimeout(loadTimeout);
        setError('Map failed to load properly');
        setLoading(false);
      });

      // Handle resize
      const resizeObserver = new ResizeObserver(() => {
        map.current?.resize();
      });

      if (mapContainer.current) {
        resizeObserver.observe(mapContainer.current);
      }

      return () => {
        clearTimeout(loadTimeout);
        resizeObserver.disconnect();
        if (map.current) {
          console.log('🗺️ Map: Cleaning up map');
          map.current.remove();
          map.current = null;
        }
      };
    } catch (err: any) {
      console.error('🗺️ Map: Error initializing map:', err);
      setError('Failed to initialize map: ' + err.message);
      setLoading(false);
    }
  }, [mapboxToken]);

  // Clear existing markers helper
  const clearMarkers = useCallback(() => {
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
  }, []);

  // Add markers when locations change
  useEffect(() => {
    if (!map.current || loading) {
      console.log('🗺️ Map: Not ready for markers - map:', !!map.current, 'loading:', loading);
      return;
    }

    clearMarkers();

    if (!locations.length) {
      console.log('🗺️ Map: No locations to display');
      return;
    }

    console.log('🗺️ Map: Adding markers for locations:', locations);

    const bounds = new mapboxgl.LngLatBounds();
    let validLocations = 0;

    locations.forEach((location, index) => {
      // Validate coordinates
      if (!location.lat || !location.lng || 
          typeof location.lat !== 'number' || typeof location.lng !== 'number' ||
          location.lat < -90 || location.lat > 90 || 
          location.lng < -180 || location.lng > 180) {
        console.warn('🗺️ Map: Invalid coordinates for location:', location);
        return;
      }

      validLocations++;
      bounds.extend([location.lng, location.lat]);

      // Create marker element with improved styling
      const el = document.createElement('div');
      el.className = 'custom-marker';
      const categoryColor = getCategoryColor(location.category);
      
      el.style.cssText = `
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: #ffce87;
        border: 2px solid #ffce87;
        box-shadow: 0 0 10px ${categoryColor}99;
        cursor: pointer;
        transition: all 0.3s ease;
        position: relative;
        z-index: 1;
      `;

      // Add inner highlight
      const innerEl = document.createElement('div');
      innerEl.style.cssText = `
        position: absolute;
        top: 1px;
        left: 1px;
        right: 1px;
        bottom: 1px;
        border-radius: 50%;
        background: linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 60%);
        pointer-events: none;
      `;
      el.appendChild(innerEl);

      // Enhanced hover effects
      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.3)';
        el.style.background = '#ffce87';
        el.style.border = '2px solid #ffce87';
        el.style.boxShadow = `0 0 15px #ffce87cc`;
        el.style.zIndex = '1000';
      });

      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
        el.style.background = '#ffce87';
        el.style.border = '2px solid #ffce87';
        el.style.boxShadow = `0 0 10px ${categoryColor}99`;
        el.style.zIndex = '1';
      });

      // Enhanced popup
      const popup = new mapboxgl.Popup({
        offset: 35,
        closeButton: false,
        className: 'custom-popup',
        maxWidth: '300px'
      }).setHTML(`
        <div style="
          color: hsl(var(--foreground)); 
          font-weight: 600; 
          padding: 16px 20px; 
          background: hsl(var(--background)); 
          border: 1px solid hsl(var(--border));
          border-radius: 16px;
          box-shadow: 0 12px 32px hsl(var(--foreground) / 0.2);
          backdrop-filter: blur(12px);
          font-family: inherit;
          min-width: 200px;
        ">
          <div style="font-size: 16px; margin-bottom: 6px; line-height: 1.4;">${location.city}</div>
          ${location.category ? `<div style="
            font-size: 14px; 
            color: hsl(var(--muted-foreground)); 
            text-transform: capitalize;
            padding: 4px 8px;
            background: hsl(var(--muted) / 0.5);
            border-radius: 8px;
            display: inline-block;
          ">${location.category}</div>` : ''}
        </div>
      `);

      try {
        const marker = new mapboxgl.Marker(el)
          .setLngLat([location.lng, location.lat])
          .setPopup(popup)
          .addTo(map.current!);
        
        markersRef.current.push(marker);
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
            map.current?.flyTo({
              center: [location.lng, location.lat],
              zoom: 11,
              duration: 1500
            });
          }
        } else {
          console.log('🗺️ Map: Fitting to bounds for multiple locations');
          map.current?.fitBounds(bounds, {
            padding: { top: 60, bottom: 60, left: 60, right: 60 },
            maxZoom: 12,
            duration: 1500
          });
        }
      } catch (err) {
        console.error('🗺️ Map: Error setting map bounds:', err);
      }
    }

    // Cleanup function
    return () => clearMarkers();
  }, [locations, loading, clearMarkers]);
  console.log('🗺️ Map: Current state - loading:', loading, 'error:', error, 'token:', !!mapboxToken);
  if (error) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-muted/50 border border-border rounded-xl">
        <div className="text-center p-8 max-w-sm">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-lg font-semibold mb-2 text-foreground">Map Unavailable</p>
          <p className="text-sm text-muted-foreground leading-relaxed">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }


  return (
    <div className="h-full w-full relative rounded-xl overflow-hidden border border-border bg-background shadow-lg">
      <div ref={mapContainer} className="absolute inset-0" />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-background/5 rounded-xl" />
      
      {/* Map Legend */}
      {locations.length > 0 && (
        <div className="absolute top-4 left-4 bg-slate-900/95 backdrop-blur-md border-2 border-white/20 rounded-lg p-4 shadow-2xl">
          <div className="text-sm font-bold text-white mb-3 tracking-wide">LOCATIONS</div>
          <div className="space-y-2">
            {Array.from(new Set(locations.map(l => l.category).filter(Boolean))).map(category => (
              <div key={category} className="flex items-center gap-3 text-sm">
                <div 
                  className="w-4 h-4 rounded-full border-2 border-white shadow-lg" 
                  style={{ background: getCategoryColor(category) }}
                />
                <span className="text-white font-medium capitalize tracking-wide">{category}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
export { Map };
export default Map;