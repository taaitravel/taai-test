import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface SearchResultsMapProps {
  results: any[];
}

export const SearchResultsMap = ({ results }: SearchResultsMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch Mapbox token
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        if (error) throw error;
        setMapboxToken(data.token);
      } catch (err) {
        console.error('Error fetching Mapbox token:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchToken();
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || map.current) return;

    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [0, 0],
      zoom: 2,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken]);

  // Add markers for results
  useEffect(() => {
    if (!map.current || !results.length) return;

    // Clear existing markers
    const markers: mapboxgl.Marker[] = [];

    // Add markers for each result with coordinates
    const bounds = new mapboxgl.LngLatBounds();
    
    results.forEach((result) => {
      if (result.latitude && result.longitude) {
        const marker = new mapboxgl.Marker({ color: '#FF6B6B' })
          .setLngLat([result.longitude, result.latitude])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 })
              .setHTML(`
                <div class="p-2">
                  <h3 class="font-bold text-sm mb-1">${result.name}</h3>
                  <p class="text-xs text-gray-600 mb-2">${result.cityName || result.location || ''}</p>
                  <p class="text-sm font-semibold text-primary">$${result.pricePerNight || result.price || 0}/night</p>
                  ${result.bookingUrl ? `<a href="${result.bookingUrl}" target="_blank" class="text-xs text-blue-600 hover:underline mt-1 block">View Deal</a>` : ''}
                </div>
              `)
          )
          .addTo(map.current!);
        
        markers.push(marker);
        bounds.extend([result.longitude, result.latitude]);
      }
    });

    // Fit map to show all markers
    if (!bounds.isEmpty()) {
      map.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 12,
      });
    }

    return () => {
      markers.forEach(marker => marker.remove());
    };
  }, [results]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[600px] bg-white/5 rounded-lg">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-[600px] rounded-lg overflow-hidden">
      <div ref={mapContainer} className="absolute inset-0" />
    </div>
  );
};
