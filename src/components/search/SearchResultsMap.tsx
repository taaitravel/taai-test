import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

interface SearchResultsMapProps {
  results: any[];
}

export const SearchResultsMap = ({ results }: SearchResultsMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Fetch Mapbox token with retry logic
  useEffect(() => {
    const fetchToken = async () => {
      try {
        console.log('🗺️ Search Results Map: Fetching Mapbox token...');
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        if (error) throw error;
        console.log('🗺️ Search Results Map: Token received');
        setMapboxToken(data.token);
        setError(null);
      } catch (err) {
        console.error('🗺️ Search Results Map: Error fetching token:', err);
        if (retryCount < MAX_RETRIES) {
          const delay = RETRY_DELAY * Math.pow(2, retryCount);
          console.log(`🗺️ Search Results Map: Retrying in ${delay}ms... (attempt ${retryCount + 1}/${MAX_RETRIES})`);
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, delay);
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

    console.log('🗺️ Search Results Map: Initializing map...');
    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/taai/cme4vu58w01r801s29jan9lw9',
      center: [0, 20],
      zoom: 2,
      projection: 'mercator' as any,
      antialias: true,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      console.log('🗺️ Search Results Map: Loaded successfully');
      setLoading(false);
    });

    map.current.on('error', (e) => {
      console.error('🗺️ Search Results Map: Error', e);
      setError('Map failed to load. Please refresh the page.');
      setLoading(false);
    });

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken]);

  // Add markers for results
  useEffect(() => {
    if (!map.current || !results.length) return;

    console.log('🗺️ Search Results Map: Adding markers for', results.length, 'results');

    // Clear existing markers
    const clearMarkers = () => {
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
    };
    clearMarkers();

    // Filter valid results with coordinates
    const validResults = results.filter(r => r.latitude && r.longitude);
    console.log('🗺️ Search Results Map: Valid locations:', validResults.length);

    if (validResults.length === 0) return;

    // Add markers for each result with coordinates
    const bounds = new mapboxgl.LngLatBounds();
    
    validResults.forEach((result) => {
      // Create custom marker element
      const markerEl = document.createElement('div');
      markerEl.className = 'custom-hotel-marker';
      markerEl.innerHTML = `
        <div class="marker-pin" style="
          width: 32px;
          height: 32px;
          background: hsl(280, 85%, 70%);
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 3px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
          cursor: pointer;
          transition: all 0.3s ease;
        ">
          <div class="marker-inner" style="
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            transform: rotate(45deg);
            color: white;
            font-weight: bold;
            font-size: 11px;
          ">
            $${Math.round(result.pricePerNight || result.price || 0)}
          </div>
        </div>
      `;

      // Add hover effects
      markerEl.addEventListener('mouseenter', () => {
        const pin = markerEl.querySelector('.marker-pin') as HTMLElement;
        if (pin) {
          pin.style.background = 'hsl(280, 95%, 80%)';
          pin.style.transform = 'rotate(-45deg) scale(1.15)';
        }
      });

      markerEl.addEventListener('mouseleave', () => {
        const pin = markerEl.querySelector('.marker-pin') as HTMLElement;
        if (pin) {
          pin.style.background = 'hsl(280, 85%, 70%)';
          pin.style.transform = 'rotate(-45deg) scale(1)';
        }
      });

      // Create enhanced popup content
      const popupContent = `
        <div class="hotel-popup" style="
          min-width: 240px;
          padding: 0;
          font-family: system-ui, -apple-system, sans-serif;
        ">
          <div style="
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px;
            border-radius: 8px 8px 0 0;
          ">
            <h3 style="margin: 0 0 6px 0; font-size: 16px; font-weight: 700;">
              ${result.name}
            </h3>
            <div style="display: flex; align-items: center; gap: 8px; font-size: 12px; opacity: 0.9;">
              <span>⭐ ${result.rating?.toFixed(1) || 'N/A'}</span>
              <span>•</span>
              <span>📍 ${result.cityName || result.location || ''}</span>
              ${result.distanceFromSearch ? `<span>• ${result.distanceFromSearch.toFixed(1)} mi</span>` : ''}
            </div>
          </div>
          
          <div style="padding: 12px; background: white;">
            <div style="margin-bottom: 8px;">
              <div style="font-size: 24px; font-weight: 700; color: #667eea;">
                $${result.pricePerNight || result.price || 0}
                <span style="font-size: 14px; font-weight: 400; color: #666;">/night</span>
              </div>
              ${result.totalPrice ? `
                <div style="font-size: 11px; color: #999; margin-top: 2px;">
                  Total: $${result.totalPrice}${result.nights ? ` for ${result.nights} night${result.nights > 1 ? 's' : ''}` : ''}
                </div>
              ` : ''}
              <div style="font-size: 10px; color: #999; margin-top: 1px;">
                including taxes and fees
              </div>
            </div>
            
            ${result.review_count ? `
              <div style="font-size: 12px; color: #666; margin-bottom: 8px;">
                ${result.review_count.toLocaleString()} reviews
              </div>
            ` : ''}
            
            ${result.bookingUrl ? `
              <a href="${result.bookingUrl}" 
                 target="_blank" 
                 rel="noopener noreferrer"
                 style="
                   display: block;
                   background: #667eea;
                   color: white;
                   text-align: center;
                   padding: 8px 16px;
                   border-radius: 6px;
                   text-decoration: none;
                   font-size: 13px;
                   font-weight: 600;
                   transition: background 0.2s;
                 "
                 onmouseover="this.style.background='#764ba2'"
                 onmouseout="this.style.background='#667eea'"
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
        maxWidth: '280px'
      }).setHTML(popupContent);

      const marker = new mapboxgl.Marker({ element: markerEl })
        .setLngLat([result.longitude, result.latitude])
        .setPopup(popup)
        .addTo(map.current!);
      
      markersRef.current.push(marker);
      bounds.extend([result.longitude, result.latitude]);
    });

    // Fit map to show all markers
    if (!bounds.isEmpty()) {
      console.log('🗺️ Search Results Map: Fitting bounds to show all markers');
      map.current.fitBounds(bounds, {
        padding: { top: 80, bottom: 80, left: 80, right: 80 },
        maxZoom: 14,
        duration: 1000,
      });
    }

    return () => {
      clearMarkers();
    };
  }, [results]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] bg-[#1a1c2e]/50 rounded-lg border border-white/10">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400 mb-3" />
        <p className="text-white/70 text-sm">Loading search results map...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] bg-[#1a1c2e]/50 rounded-lg border border-white/10">
        <div className="text-red-400 mb-2">⚠️ Map Error</div>
        <p className="text-white/60 text-sm">{error}</p>
      </div>
    );
  }

  const validResults = results.filter(r => r.latitude && r.longitude);
  
  if (validResults.length === 0 && results.length > 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] bg-[#1a1c2e]/50 rounded-lg border border-white/10">
        <p className="text-white/60 text-sm">No locations available for map view</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[600px] rounded-lg overflow-hidden border border-white/10">
      <div ref={mapContainer} className="absolute inset-0" />
    </div>
  );
};
