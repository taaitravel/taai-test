import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Plus, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MapLegend } from './MapLegend';

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;
const INITIAL_MARKER_COUNT = 12;

interface SearchResultsMapProps {
  results: any[];
  searchType?: 'hotels' | 'flights' | 'activities' | 'cars' | 'packages';
}

// Get marker category from search type
const getCategoryFromSearchType = (searchType?: string): string => {
  switch (searchType) {
    case 'hotels': return 'hotel';
    case 'flights': return 'flight';
    case 'activities': return 'activity';
    case 'cars': return 'car';
    case 'packages': return 'package';
    default: return 'destination';
  }
};

// Get category color
const getCategoryColor = (category: string): string => {
  switch (category) {
    case 'hotel': return 'hsl(280, 85%, 70%)';
    case 'activity': return 'hsl(160, 80%, 55%)';
    case 'flight': return 'hsl(220, 90%, 65%)';
    case 'reservation': return 'hsl(30, 95%, 65%)';
    case 'car': return 'hsl(140, 70%, 55%)';
    case 'package': return '#ff849c';
    default: return '#ffce87';
  }
};

// Generate marker HTML based on category shape
const getMarkerHTML = (category: string, price?: number): string => {
  const color = getCategoryColor(category);
  const priceDisplay = price ? `$${Math.round(price)}` : '';
  
  switch (category) {
    case 'hotel':
      // Square marker
      return `
        <div class="marker-container" style="display: flex; flex-direction: column; align-items: center; cursor: pointer; transition: transform 0.2s;">
          <div style="
            width: 32px;
            height: 32px;
            background: ${color};
            border-radius: 6px;
            border: 2px solid white;
            box-shadow: 0 3px 10px rgba(0,0,0,0.4);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            ${priceDisplay ? `<span style="font-size: 9px; color: white; font-weight: bold;">${priceDisplay}</span>` : '<span style="font-size: 12px;">🏨</span>'}
          </div>
        </div>
      `;
      
    case 'activity':
      // Triangle marker
      return `
        <div class="marker-container" style="display: flex; flex-direction: column; align-items: center; cursor: pointer; transition: transform 0.2s;">
          <div style="
            width: 0;
            height: 0;
            border-left: 16px solid transparent;
            border-right: 16px solid transparent;
            border-bottom: 28px solid ${color};
            filter: drop-shadow(0 3px 6px rgba(0,0,0,0.4));
            position: relative;
          ">
            <span style="position: absolute; top: 10px; left: -6px; font-size: 11px;">🎯</span>
          </div>
          ${priceDisplay ? `<div style="
            background: ${color};
            color: white;
            font-size: 9px;
            font-weight: bold;
            padding: 2px 6px;
            border-radius: 4px;
            margin-top: 2px;
          ">${priceDisplay}</div>` : ''}
        </div>
      `;
      
    case 'flight':
      // Circle marker
      return `
        <div class="marker-container" style="display: flex; flex-direction: column; align-items: center; cursor: pointer; transition: transform 0.2s;">
          <div style="
            width: 28px;
            height: 28px;
            background: ${color};
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 3px 10px rgba(0,0,0,0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
          ">✈️</div>
          ${priceDisplay ? `<div style="
            background: ${color};
            color: white;
            font-size: 9px;
            font-weight: bold;
            padding: 2px 6px;
            border-radius: 4px;
            margin-top: 2px;
          ">${priceDisplay}</div>` : ''}
        </div>
      `;
      
    case 'car':
      // Rounded rectangle marker
      return `
        <div class="marker-container" style="display: flex; flex-direction: column; align-items: center; cursor: pointer; transition: transform 0.2s;">
          <div style="
            width: 36px;
            height: 24px;
            background: ${color};
            border-radius: 10px;
            border: 2px solid white;
            box-shadow: 0 3px 10px rgba(0,0,0,0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
          ">🚗</div>
          ${priceDisplay ? `<div style="
            background: ${color};
            color: white;
            font-size: 9px;
            font-weight: bold;
            padding: 2px 6px;
            border-radius: 4px;
            margin-top: 2px;
          ">${priceDisplay}</div>` : ''}
        </div>
      `;
      
    case 'package':
      // Star marker
      return `
        <div class="marker-container" style="display: flex; flex-direction: column; align-items: center; cursor: pointer; transition: transform 0.2s;">
          <div style="
            font-size: 32px;
            color: ${color};
            filter: drop-shadow(0 3px 6px rgba(0,0,0,0.4));
            line-height: 1;
          ">★</div>
          ${priceDisplay ? `<div style="
            background: ${color};
            color: white;
            font-size: 9px;
            font-weight: bold;
            padding: 2px 6px;
            border-radius: 4px;
            margin-top: -6px;
          ">${priceDisplay}</div>` : ''}
        </div>
      `;
      
    default:
      return `
        <div style="
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #ffce87;
          border: 2px solid white;
          box-shadow: 0 2px 8px rgba(255,206,135,0.6);
          cursor: pointer;
        "></div>
      `;
  }
};

export const SearchResultsMap = ({ results, searchType }: SearchResultsMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [visibleCount, setVisibleCount] = useState(INITIAL_MARKER_COUNT);
  const hasInitialFit = useRef(false);

  const category = getCategoryFromSearchType(searchType);

  // Fetch Mapbox token with retry logic
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        if (error) throw error;
        setMapboxToken(data.token);
        setError(null);
      } catch (err) {
        console.error('🗺️ Search Results Map: Error fetching token:', err);
        if (retryCount < MAX_RETRIES) {
          const delay = RETRY_DELAY * Math.pow(2, retryCount);
          setTimeout(() => setRetryCount(prev => prev + 1), delay);
        } else {
          setError('Failed to load map. Please refresh the page.');
          setLoading(false);
        }
      }
    };
    fetchToken();
  }, [retryCount]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || map.current) return;

    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/taai/cme4vu58w01r701s29jan9lw9',
      center: [0, 20],
      zoom: 2,
      projection: 'mercator' as any,
      antialias: true,
      attributionControl: false
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    
    // Disable scroll zoom to prevent accidental zooming
    map.current.scrollZoom.disable();

    map.current.on('load', () => {
      setLoading(false);
    });

    map.current.on('error', (e) => {
      console.error('🗺️ Search Results Map: Error', e);
      setError('Map failed to load. Please refresh the page.');
      setLoading(false);
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [mapboxToken]);

  // Clear markers helper
  const clearMarkers = useCallback(() => {
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
  }, []);

  // Add markers for results
  useEffect(() => {
    if (!map.current || loading) return;

    clearMarkers();

    // Filter valid results with coordinates
    const validResults = results.filter(r => r.latitude && r.longitude);
    if (validResults.length === 0) return;

    // Only show up to visibleCount markers
    const displayResults = validResults.slice(0, visibleCount);
    const bounds = new mapboxgl.LngLatBounds();
    
    displayResults.forEach((result) => {
      const price = result.pricePerNight || result.price || result.totalPrice;
      
      // Create custom marker element with shape
      const markerEl = document.createElement('div');
      markerEl.className = 'search-result-marker';
      markerEl.innerHTML = getMarkerHTML(category, price);
      
      // Add hover effects
      markerEl.addEventListener('mouseenter', () => {
        markerEl.style.transform = 'scale(1.15)';
        markerEl.style.zIndex = '1000';
      });
      markerEl.addEventListener('mouseleave', () => {
        markerEl.style.transform = 'scale(1)';
        markerEl.style.zIndex = '1';
      });

      // Create Expedia-style popup matching dark theme
      const popupContent = `
        <div style="
          min-width: 260px;
          padding: 0;
          font-family: system-ui, -apple-system, sans-serif;
          background: #1a1c2e;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.1);
        ">
          ${result.images?.[0] || result.image ? `
            <div style="
              width: 100%;
              height: 120px;
              background-image: url('${result.images?.[0] || result.image}');
              background-size: cover;
              background-position: center;
            "></div>
          ` : ''}
          
          <div style="padding: 14px;">
            <div style="
              display: flex;
              align-items: center;
              gap: 8px;
              margin-bottom: 8px;
            ">
              <span style="
                background: rgba(255,255,255,0.1);
                padding: 3px 8px;
                border-radius: 4px;
                font-size: 10px;
                color: rgba(255,255,255,0.6);
                text-transform: uppercase;
                letter-spacing: 0.5px;
              ">${category}</span>
              ${result.rating ? `<span style="color: #fbbf24; font-size: 12px;">⭐ ${result.rating.toFixed(1)}</span>` : ''}
            </div>
            
            <h3 style="
              margin: 0 0 6px 0;
              font-size: 15px;
              font-weight: 700;
              color: white;
              line-height: 1.3;
            ">${result.name}</h3>
            
            <div style="
              display: flex;
              align-items: center;
              gap: 6px;
              font-size: 12px;
              color: rgba(255,255,255,0.6);
              margin-bottom: 12px;
            ">
              <span>📍</span>
              <span>${result.cityName || result.location || result.address || ''}</span>
              ${result.distanceFromSearch ? `<span>• ${result.distanceFromSearch.toFixed(1)} mi</span>` : ''}
            </div>
            
            <div style="
              display: flex;
              align-items: baseline;
              justify-content: space-between;
              padding-top: 12px;
              border-top: 1px solid rgba(255,255,255,0.1);
            ">
              <div>
                <div style="font-size: 22px; font-weight: 700; color: #ff849c;">
                  $${Math.ceil(result.pricePerNight || result.price || 0).toLocaleString()}
                </div>
                <div style="font-size: 10px; color: rgba(255,255,255,0.5);">
                  ${searchType === 'hotels' ? 'per night' : 'total'} • incl. taxes
                </div>
              </div>
              
              ${result.review_count ? `
                <div style="text-align: right;">
                  <div style="font-size: 11px; color: rgba(255,255,255,0.5);">
                    ${result.review_count.toLocaleString()} reviews
                  </div>
                </div>
              ` : ''}
            </div>
            
            ${result.bookingUrl ? `
              <a href="${result.bookingUrl}" 
                 target="_blank" 
                 rel="noopener noreferrer"
                 style="
                   display: block;
                   background: linear-gradient(135deg, hsl(280, 85%, 65%) 0%, hsl(280, 85%, 55%) 100%);
                   color: white;
                   text-align: center;
                   padding: 10px 16px;
                   border-radius: 8px;
                   text-decoration: none;
                   font-size: 12px;
                   font-weight: 600;
                   margin-top: 12px;
                   transition: opacity 0.2s;
                 "
                 onmouseover="this.style.opacity='0.9'"
                 onmouseout="this.style.opacity='1'"
              >
                View TAAI Deal →
              </a>
            ` : ''}
          </div>
        </div>
      `;

      const popup = new mapboxgl.Popup({ 
        offset: 25,
        closeButton: true,
        closeOnClick: false,
        maxWidth: '300px',
        className: 'search-results-popup'
      }).setHTML(popupContent);

      const marker = new mapboxgl.Marker({ element: markerEl, anchor: 'bottom' })
        .setLngLat([result.longitude, result.latitude])
        .setPopup(popup)
        .addTo(map.current!);
      
      markersRef.current.push(marker);
      bounds.extend([result.longitude, result.latitude]);
    });

    // Only fit bounds on initial load, not on subsequent updates
    if (!bounds.isEmpty() && !hasInitialFit.current) {
      map.current.fitBounds(bounds, {
        padding: { top: 80, bottom: 80, left: 80, right: 80 },
        maxZoom: 14,
        duration: 1000,
      });
      hasInitialFit.current = true;
    }

    return () => clearMarkers();
  }, [results, loading, visibleCount, category, searchType, clearMarkers]);

  // Reset initial fit when results change significantly
  useEffect(() => {
    hasInitialFit.current = false;
    setVisibleCount(INITIAL_MARKER_COUNT);
  }, [searchType]);

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + INITIAL_MARKER_COUNT);
  };

  const handleResetView = () => {
    if (!map.current) return;
    
    const validResults = results.filter(r => r.latitude && r.longitude);
    if (validResults.length === 0) return;

    const bounds = new mapboxgl.LngLatBounds();
    validResults.slice(0, visibleCount).forEach(result => {
      bounds.extend([result.longitude, result.latitude]);
    });

    if (!bounds.isEmpty()) {
      map.current.fitBounds(bounds, {
        padding: { top: 80, bottom: 80, left: 80, right: 80 },
        maxZoom: 14,
        duration: 1000,
      });
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] bg-[#1a1c2e]/50 rounded-lg border border-white/10">
        <div className="text-red-400 mb-2">⚠️ Map Error</div>
        <p className="text-white/60 text-sm">{error}</p>
      </div>
    );
  }

  const validResults = results.filter(r => r.latitude && r.longitude);
  const hasMoreResults = validResults.length > visibleCount;

  return (
    <div className="relative w-full h-[600px] rounded-lg overflow-hidden border border-white/10">
      {/* Map container - always render so map can initialize */}
      <div ref={mapContainer} className="absolute inset-0" />
      
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1a1c2e]/80 z-20">
          <Loader2 className="h-8 w-8 animate-spin text-purple-400 mb-3" />
          <p className="text-white/70 text-sm">Loading map...</p>
        </div>
      )}

      {/* No locations message */}
      {!loading && validResults.length === 0 && results.length > 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1a1c2e]/80 z-20">
          <p className="text-white/60 text-sm">No locations available for map view</p>
        </div>
      )}
      
      {/* Legend */}
      {!loading && <MapLegend searchType={searchType} />}
      
      {/* Map Controls Overlay */}
      {!loading && validResults.length > 0 && (
        <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-10">
          <div className="bg-[#1a1c2e]/90 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/10 flex items-center gap-3">
            <span className="text-white/70 text-sm">
              Showing {Math.min(visibleCount, validResults.length)} of {validResults.length}
            </span>
            
            {hasMoreResults && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs text-white/80 hover:text-white hover:bg-white/10"
                onClick={handleLoadMore}
              >
                <Plus className="h-3 w-3 mr-1" />
                Load More
              </Button>
            )}
            
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs text-white/80 hover:text-white hover:bg-white/10"
              onClick={handleResetView}
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset
            </Button>
          </div>
        </div>
      )}
      
      {/* Scroll zoom hint */}
      {!loading && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#1a1c2e]/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10 text-white/50 text-xs z-10 pointer-events-none">
          Use controls to zoom • Drag to pan
        </div>
      )}
    </div>
  );
};
