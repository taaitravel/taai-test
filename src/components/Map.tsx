import React from 'react';
import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { escapeHtml, sanitizeCategory, sanitizePrice } from '@/lib/sanitize';

interface MapLocation {
  city: string;
  lat: number;
  lng: number;
  category?: 'flight' | 'hotel' | 'activity' | 'reservation' | 'car' | 'package' | 'destination';
  name?: string;
  address?: string;
  price?: number;
}

interface MapProps {
  locations?: MapLocation[];
}

const getCategoryColor = (category?: string) => {
  switch (category) {
    case 'hotel':
    case 'property':
      return 'hsl(280, 85%, 70%)'; // Purple
    case 'activity':
      return 'hsl(160, 80%, 55%)'; // Teal
    case 'flight':
      return 'hsl(220, 90%, 65%)'; // Blue
    case 'reservation':
    case 'restaurant':
      return 'hsl(30, 95%, 65%)'; // Orange
    case 'car':
      return 'hsl(140, 70%, 55%)'; // Green
    case 'package':
      return '#ff849c'; // Pink
    case 'destination':
      return '#ffce87'; // Golden
    default:
      return '#ffce87'; // Golden default
  }
};

// Generate marker HTML based on category shape
const getMarkerHTML = (category?: string, price?: number): string => {
  // Validate inputs to prevent XSS
  const safeCategory = sanitizeCategory(category);
  const safePrice = sanitizePrice(price);
  
  const color = getCategoryColor(safeCategory);
  const priceDisplay = safePrice ? `$${Math.round(safePrice)}` : '';
  
  switch (category) {
    case 'hotel':
    case 'property':
      // Square marker
      return `
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
        ">
          <div style="
            width: 28px;
            height: 28px;
            background: ${color};
            border-radius: 4px;
            border: 2px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            color: white;
            font-weight: bold;
          ">🏨</div>
          ${priceDisplay ? `<div style="
            background: ${color};
            color: white;
            font-size: 9px;
            font-weight: bold;
            padding: 2px 6px;
            border-radius: 4px;
            margin-top: 2px;
            white-space: nowrap;
          ">${priceDisplay}</div>` : ''}
        </div>
      `;
      
    case 'activity':
      // Triangle marker
      return `
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
        ">
          <div style="
            width: 0;
            height: 0;
            border-left: 14px solid transparent;
            border-right: 14px solid transparent;
            border-bottom: 24px solid ${color};
            filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
            position: relative;
          ">
            <span style="
              position: absolute;
              top: 8px;
              left: -5px;
              font-size: 10px;
            ">🎯</span>
          </div>
          ${priceDisplay ? `<div style="
            background: ${color};
            color: white;
            font-size: 9px;
            font-weight: bold;
            padding: 2px 6px;
            border-radius: 4px;
            margin-top: 2px;
            white-space: nowrap;
          ">${priceDisplay}</div>` : ''}
        </div>
      `;
      
    case 'flight':
      // Circle marker
      return `
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
        ">
          <div style="
            width: 24px;
            height: 24px;
            background: ${color};
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
          ">✈️</div>
          ${priceDisplay ? `<div style="
            background: ${color};
            color: white;
            font-size: 9px;
            font-weight: bold;
            padding: 2px 6px;
            border-radius: 4px;
            margin-top: 2px;
            white-space: nowrap;
          ">${priceDisplay}</div>` : ''}
        </div>
      `;
      
    case 'reservation':
    case 'restaurant':
      // Diamond marker
      return `
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
        ">
          <div style="
            width: 20px;
            height: 20px;
            background: ${color};
            transform: rotate(45deg);
            border: 2px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <span style="transform: rotate(-45deg); font-size: 10px;">🍽️</span>
          </div>
          ${priceDisplay ? `<div style="
            background: ${color};
            color: white;
            font-size: 9px;
            font-weight: bold;
            padding: 2px 6px;
            border-radius: 4px;
            margin-top: 6px;
            white-space: nowrap;
          ">${priceDisplay}</div>` : ''}
        </div>
      `;
      
    case 'car':
      // Rounded rectangle marker
      return `
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
        ">
          <div style="
            width: 30px;
            height: 20px;
            background: ${color};
            border-radius: 8px;
            border: 2px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
          ">🚗</div>
          ${priceDisplay ? `<div style="
            background: ${color};
            color: white;
            font-size: 9px;
            font-weight: bold;
            padding: 2px 6px;
            border-radius: 4px;
            margin-top: 2px;
            white-space: nowrap;
          ">${priceDisplay}</div>` : ''}
        </div>
      `;
      
    case 'package':
      // Star marker
      return `
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
        ">
          <div style="
            font-size: 28px;
            color: ${color};
            filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
            line-height: 1;
          ">★</div>
          ${priceDisplay ? `<div style="
            background: ${color};
            color: white;
            font-size: 9px;
            font-weight: bold;
            padding: 2px 6px;
            border-radius: 4px;
            margin-top: -4px;
            white-space: nowrap;
          ">${priceDisplay}</div>` : ''}
        </div>
      `;
      
    default:
      // Default golden circle (destination)
      return `
        <div style="
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #ffce87;
          border: 2px solid #ffce87;
          box-shadow: 0 0 10px rgba(255,206,135,0.6);
          cursor: pointer;
        "></div>
      `;
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

  // Fetch Mapbox token with retry
  useEffect(() => {
    const fetchMapboxToken = async () => {
      try {
        setError(null);
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        
        if (error) {
          throw new Error(error.message || 'Token fetch failed');
        }

        const mapboxToken = data?.token || data;
        if (!mapboxToken || typeof mapboxToken !== 'string') {
          throw new Error('Invalid token received');
        }
        
        setMapboxToken(mapboxToken);
        setRetryCount(0);
      } catch (err: any) {
        console.error('🗺️ Map: Error getting token:', err);
        
        if (retryCount < 3) {
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
      return;
    }
    
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

      newMap.addControl(new mapboxgl.NavigationControl(), 'top-right');

      const loadTimeout = setTimeout(() => {
        setLoading(false);
      }, 5000);

      const handleMapReady = () => {
        clearTimeout(loadTimeout);
        setLoading(false);
        setError(null);
      };

      newMap.once('load', handleMapReady);
      newMap.once('idle', handleMapReady);
      
      newMap.on('error', (e) => {
        console.error('🗺️ Map: Map error:', e);
        clearTimeout(loadTimeout);
        setError('Map failed to load properly');
        setLoading(false);
      });

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
      return;
    }

    clearMarkers();

    if (!locations.length) {
      return;
    }

    const bounds = new mapboxgl.LngLatBounds();
    let validLocations = 0;

    locations.forEach((location) => {
      if (!location.lat || !location.lng || 
          typeof location.lat !== 'number' || typeof location.lng !== 'number' ||
          location.lat < -90 || location.lat > 90 || 
          location.lng < -180 || location.lng > 180) {
        return;
      }

      validLocations++;
      bounds.extend([location.lng, location.lat]);

      // Create marker element with shape based on category
      const el = document.createElement('div');
      el.className = 'custom-marker';
      el.innerHTML = getMarkerHTML(location.category, location.price);
      
      // Add hover effect
      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.15)';
        el.style.zIndex = '1000';
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
        el.style.zIndex = '1';
      });

      // Enhanced popup with more details - escape all dynamic content to prevent XSS
      const safeCategory = location.category ? escapeHtml(location.category) : '';
      const safeName = escapeHtml(location.name || location.city);
      const safeAddress = location.address ? escapeHtml(location.address) : '';
      const safePrice = sanitizePrice(location.price);
      
      const popup = new mapboxgl.Popup({
        offset: 35,
        closeButton: true,
        className: 'custom-popup',
        maxWidth: '300px'
      }).setHTML(`
        <div style="
          color: white; 
          font-weight: 600; 
          padding: 16px; 
          background: #1a1c2e; 
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          min-width: 200px;
        ">
          ${safeCategory ? `<div style="
            font-size: 10px; 
            color: rgba(255,255,255,0.5); 
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 6px;
          ">${safeCategory}</div>` : ''}
          <div style="font-size: 16px; margin-bottom: 4px; line-height: 1.4;">
            ${safeName}
          </div>
          ${safeAddress ? `<div style="font-size: 12px; color: rgba(255,255,255,0.6); margin-bottom: 8px;">
            📍 ${safeAddress}
          </div>` : ''}
          ${safePrice ? `<div style="font-size: 20px; font-weight: bold; color: #ff849c;">
            $${safePrice.toLocaleString()}
          </div>` : ''}
        </div>
      `);

      try {
        const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([location.lng, location.lat])
          .setPopup(popup)
          .addTo(map.current!);
        
        markersRef.current.push(marker);
      } catch (markerErr) {
        console.error(`🗺️ Map: Error adding marker for ${location.city}:`, markerErr);
      }
    });

    // Fit map to markers
    if (validLocations > 0) {
      try {
        if (validLocations === 1) {
          const location = locations.find(l => l.lat && l.lng);
          if (location) {
            map.current?.flyTo({
              center: [location.lng, location.lat],
              zoom: 11,
              duration: 1500
            });
          }
        } else {
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

    return () => clearMarkers();
  }, [locations, loading, clearMarkers]);

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
    <div className="h-full w-full relative rounded-xl overflow-hidden bg-background">
      <div ref={mapContainer} className="absolute inset-0" />
    </div>
  );
};

export { Map };
export default Map;
