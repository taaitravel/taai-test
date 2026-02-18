import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { ItineraryData } from '@/types/itinerary';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useThemeContext } from '@/contexts/ThemeContext';
import { getMapStyle, getMapFog, getPopupColors, getMarkerBorderColor, getMarkerDotColor } from '@/lib/mapStyles';

interface ItineraryMapViewProps {
  itineraries: ItineraryData[];
}

export const ItineraryMapView: React.FC<ItineraryMapViewProps> = ({ itineraries }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapToken, setMapToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { theme } = useThemeContext();

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

  // Initialize map - re-create on theme change
  useEffect(() => {
    if (!mapContainer.current || !mapToken) return;

    // Destroy existing map on theme change
    if (map.current) {
      map.current.remove();
      map.current = null;
    }

    mapboxgl.accessToken = mapToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: getMapStyle(theme, 'itinerary-overview'),
      center: [0, 20],
      zoom: 1.5,
      projection: 'globe'
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.scrollZoom.disable();

    map.current.on('style.load', () => {
      const fog = getMapFog(theme);
      if (fog) map.current?.setFog(fog);
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [mapToken, theme]);

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

        const popupColors = getPopupColors(theme);
        const markerBorder = getMarkerBorderColor(theme);

        // Create marker element
        const el = document.createElement('div');
        el.className = 'flex items-center justify-center';
        el.style.width = '36px';
        el.style.height = '36px';
        el.style.backgroundColor = getMarkerDotColor(theme);
        el.style.borderRadius = '50%';
        el.style.border = `3px solid ${markerBorder}`;
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
              <h3 style="font-size: 16px; font-weight: 700; margin-bottom: 6px; color: ${popupColors.text};">${itinerary.itin_name || 'Untitled Trip'}</h3>
              <p style="font-size: 11px; color: ${popupColors.mutedText}; margin-bottom: 10px;">${dateRange}</p>
              <span style="display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 10px; font-weight: 600; color: ${status === 'Upcoming' ? popupColors.statusTextDark : 'white'}; background: ${statusColor}; margin-bottom: 12px;">
                ${status}
              </span>
              <button 
                id="view-${itinerary.id}-${location.lat}" 
                style="display: block; width: 100%; background: ${popupColors.buttonBg}; color: ${popupColors.buttonText}; padding: 8px 12px; border-radius: 6px; font-size: 12px; font-weight: 500; border: none; cursor: pointer;"
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
      <div className="absolute bottom-4 left-4 bg-card/95 backdrop-blur-sm rounded-lg p-3 border border-border">
        <p className="text-xs font-medium text-foreground mb-2">Itineraries</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-4 h-4 rounded-full bg-[#ffce87] border-2 border-border" />
          <span>{itineraries.length} trip{itineraries.length !== 1 ? 's' : ''}</span>
        </div>
      </div>
    </div>
  );
};
