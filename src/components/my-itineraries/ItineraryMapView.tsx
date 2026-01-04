import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { ItineraryData } from '@/types/itinerary';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface ItineraryMapViewProps {
  itineraries: ItineraryData[];
}

export const ItineraryMapView: React.FC<ItineraryMapViewProps> = ({ itineraries }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapToken, setMapToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        if (error) throw error;
        setMapToken(data.token);
      } catch (error) {
        console.error('Error fetching mapbox token:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchToken();
  }, []);

  useEffect(() => {
    if (!mapContainer.current || !mapToken || map.current) return;

    mapboxgl.accessToken = mapToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [0, 20],
      zoom: 1.5,
      projection: 'globe'
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.scrollZoom.disable();

    map.current.on('style.load', () => {
      map.current?.setFog({
        color: 'rgb(20, 20, 30)',
        'high-color': 'rgb(40, 40, 60)',
        'horizon-blend': 0.1
      });
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [mapToken]);

  useEffect(() => {
    if (!map.current || !mapToken) return;

    // Clear existing markers
    const markers = document.querySelectorAll('.mapboxgl-marker');
    markers.forEach(m => m.remove());

    // Add markers for each itinerary
    itineraries.forEach(itinerary => {
      if (!itinerary.itin_map_locations?.length) return;

      itinerary.itin_map_locations.forEach((location) => {
        if (!location.lat || !location.lng) return;

        // Create marker element
        const el = document.createElement('div');
        el.className = 'flex items-center justify-center';
        el.style.width = '36px';
        el.style.height = '36px';
        el.style.backgroundColor = '#ffce87';
        el.style.borderRadius = '50%';
        el.style.border = '3px solid #1a1c2e';
        el.style.cursor = 'pointer';
        el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
        el.innerHTML = `<span style="font-size: 14px;">✈️</span>`;

        // Determine status based on dates
        const now = new Date();
        const startDate = itinerary.itin_date_start ? new Date(itinerary.itin_date_start) : null;
        const endDate = itinerary.itin_date_end ? new Date(itinerary.itin_date_end) : null;
        
        let status = 'Draft';
        let statusColor = '#6b7280'; // gray
        if (startDate && endDate) {
          if (now > endDate) {
            status = 'Completed';
            statusColor = '#22c55e'; // green
          } else if (now >= startDate && now <= endDate) {
            status = 'In Progress';
            statusColor = '#3b82f6'; // blue
          } else if (now < startDate) {
            status = 'Upcoming';
            statusColor = '#ffce87'; // gold
          }
        }

        // Format dates
        const formatDate = (date: Date | null) => {
          if (!date) return '';
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        };
        const dateRange = startDate && endDate 
          ? `${formatDate(startDate)} - ${formatDate(endDate)}`
          : 'Dates not set';

        // Create popup
        const popup = new mapboxgl.Popup({ offset: 25, closeButton: false })
          .setHTML(`
            <div style="padding: 16px; max-width: 220px; text-align: center;">
              <h3 style="font-size: 16px; font-weight: 700; margin-bottom: 6px; color: #1a1c2e;">${itinerary.itin_name || 'Untitled Trip'}</h3>
              <p style="font-size: 11px; color: #666; margin-bottom: 10px;">${dateRange}</p>
              <span style="display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 10px; font-weight: 600; color: ${status === 'Upcoming' ? '#1a1c2e' : 'white'}; background: ${statusColor}; margin-bottom: 12px;">
                ${status}
              </span>
              <button 
                id="view-${itinerary.id}-${location.lat}" 
                style="display: block; width: 100%; background: #1a1c2e; color: white; padding: 8px 12px; border-radius: 6px; font-size: 12px; font-weight: 500; border: none; cursor: pointer;"
              >
                View Itinerary
              </button>
            </div>
          `);

        const marker = new mapboxgl.Marker(el)
          .setLngLat([location.lng, location.lat])
          .setPopup(popup)
          .addTo(map.current!);

        // Add click handler for popup button
        popup.on('open', () => {
          const btn = document.getElementById(`view-${itinerary.id}-${location.lat}`);
          if (btn) {
            btn.addEventListener('click', () => {
              navigate(`/itinerary?id=${itinerary.id}`);
            });
          }
        });
      });
    });

    // Fit bounds to all markers
    const allCoords = itineraries.flatMap(it => 
      (it.itin_map_locations || [])
        .filter(loc => loc.lat && loc.lng)
        .map(loc => [loc.lng, loc.lat] as [number, number])
    );

    if (allCoords.length > 1) {
      const bounds = new mapboxgl.LngLatBounds();
      allCoords.forEach(coord => bounds.extend(coord));
      map.current.fitBounds(bounds, { padding: 50, maxZoom: 5 });
    } else if (allCoords.length === 1) {
      map.current.setCenter(allCoords[0]);
      map.current.setZoom(4);
    }
  }, [itineraries, mapToken, navigate]);

  if (loading) {
    return (
      <div className="h-[600px] rounded-lg bg-muted flex items-center justify-center">
        <div className="text-muted-foreground">Loading map...</div>
      </div>
    );
  }

  if (!mapToken) {
    return (
      <div className="h-[600px] rounded-lg bg-muted flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <p>Unable to load map</p>
          <p className="text-sm">Please check your Mapbox configuration</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full rounded-lg overflow-hidden">
      <div ref={mapContainer} className="absolute inset-0" />
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-[#12131a]/95 backdrop-blur-sm rounded-lg p-3 border border-white/10">
        <p className="text-xs font-medium text-white mb-2">Itineraries</p>
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <div className="w-4 h-4 rounded-full bg-[#ffce87] border-2 border-[#1a1c2e]" />
          <span>{itineraries.length} trip{itineraries.length !== 1 ? 's' : ''}</span>
        </div>
      </div>
    </div>
  );
};
