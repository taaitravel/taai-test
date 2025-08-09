import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCountryData } from '@/hooks/useCountryData';

interface CountriesMapProps {
  visitedCountries: string[];
}

export const CountriesMap = ({ visitedCountries }: CountriesMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { countryCoordinates } = useCountryData(visitedCountries);

  useEffect(() => {
    if (!mapContainer.current) return;

    const initializeMap = async () => {
      try {
        console.log('CountriesMap: Attempting to get Mapbox token...');
        
        // Get Mapbox token from Supabase Edge Function
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        console.log('CountriesMap: Token response:', { data, error });
        
        if (error) {
          setError('Unable to load map. Please check configuration.');
          setIsLoading(false);
          return;
        }

        const mapboxToken = data?.token;
        if (!mapboxToken) {
          setError('Mapbox token not configured.');
          setIsLoading(false);
          return;
        }

        // Initialize map
        mapboxgl.accessToken = mapboxToken;
        
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/dark-v11',
          projection: 'globe',
          center: [30, 15],
          zoom: 1.5,
          pitch: 45,
        });

        // Add atmosphere and fog effects
        map.current.on('style.load', () => {
          map.current?.setFog({
            color: 'rgb(35, 35, 35)',
            'high-color': 'rgb(100, 100, 125)',
            'horizon-blend': 0.2,
          });
        });

        // Rotation animation settings
        const secondsPerRevolution = 180;
        const maxSpinZoom = 4;
        const slowSpinZoom = 2;
        let userInteracting = false;
        let spinEnabled = true;

        // Spin globe function
        function spinGlobe() {
          if (!map.current) return;
          
          const zoom = map.current.getZoom();
          if (spinEnabled && !userInteracting && zoom < maxSpinZoom) {
            let distancePerSecond = 360 / secondsPerRevolution;
            if (zoom > slowSpinZoom) {
              const zoomDif = (maxSpinZoom - zoom) / (maxSpinZoom - slowSpinZoom);
              distancePerSecond *= zoomDif;
            }
            const center = map.current.getCenter();
            center.lng -= distancePerSecond;
            map.current.easeTo({ center, duration: 1000, easing: (n) => n });
          }
        }

        // Event listeners for interaction
        map.current.on('mousedown', () => {
          userInteracting = true;
        });
        
        map.current.on('dragstart', () => {
          userInteracting = true;
        });
        
        map.current.on('mouseup', () => {
          userInteracting = false;
          spinGlobe();
        });
        
        map.current.on('touchend', () => {
          userInteracting = false;
          spinGlobe();
        });

        map.current.on('moveend', () => {
          spinGlobe();
        });

        // Add markers for visited countries when they become available
        const addCountryMarkers = () => {
          if (countryCoordinates && countryCoordinates.length > 0) {
            countryCoordinates.forEach((country) => {
              if (country.latitude && country.longitude) {
                // Create custom marker element
                const markerEl = document.createElement('div');
                markerEl.className = 'country-marker';
                markerEl.style.cssText = `
                  width: 12px;
                  height: 12px;
                  background: #ffce87;
                  border: 2px solid #ffffff;
                  border-radius: 50%;
                  box-shadow: 0 0 10px rgba(255, 206, 135, 0.6);
                  cursor: pointer;
                `;

                // Create popup
                const popup = new mapboxgl.Popup({ offset: 25 })
                  .setHTML(`<div style="color: #171821; font-weight: 500; padding: 4px;">${country.country_name}</div>`);

                // Add marker to map
                new mapboxgl.Marker(markerEl)
                  .setLngLat([country.longitude, country.latitude])
                  .setPopup(popup)
                  .addTo(map.current!);
              }
            });
          }
        };

        // Add markers when map loads and when country coordinates are available
        map.current.on('load', addCountryMarkers);

        // Start the globe spinning
        spinGlobe();

        setIsLoading(false);

      } catch (err) {
        console.error('Error initializing map:', err);
        setError('Failed to load map');
        setIsLoading(false);
      }
    };

    initializeMap();

    // Cleanup
    return () => {
      map.current?.remove();
    };
  }, []);

  // Add markers when country coordinates change
  useEffect(() => {
    if (map.current && countryCoordinates.length > 0) {
      countryCoordinates.forEach((country) => {
        if (country.latitude && country.longitude) {
          // Create custom marker element
          const markerEl = document.createElement('div');
          markerEl.className = 'country-marker';
          markerEl.style.cssText = `
            width: 12px;
            height: 12px;
            background: #ffce87;
            border: 2px solid #ffffff;
            border-radius: 50%;
            box-shadow: 0 0 10px rgba(255, 206, 135, 0.6);
            cursor: pointer;
          `;

          // Create popup
          const popup = new mapboxgl.Popup({ offset: 25 })
            .setHTML(`<div style="color: #171821; font-weight: 500; padding: 4px;">${country.country_name}</div>`);

          // Add marker to map
          new mapboxgl.Marker(markerEl)
            .setLngLat([country.longitude, country.latitude])
            .setPopup(popup)
            .addTo(map.current!);
        }
      });
    }
  }, [countryCoordinates]);

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-[#171821]/80 rounded-lg border border-white/20">
        <div className="text-center">
          <MapPin className="h-8 w-8 text-white/60 mx-auto mb-2" />
          <p className="text-white/80 font-medium text-sm">Map Unavailable</p>
          {visitedCountries.length > 0 && (
            <div className="mt-3 space-y-1">
              <p className="text-white/60 text-xs">Your countries:</p>
              <div className="flex flex-wrap gap-1 justify-center">
                {visitedCountries.slice(0, 3).map((country, index) => (
                  <div key={index} className="text-xs text-white/70 bg-white/10 px-2 py-1 rounded">
                    {country}
                  </div>
                ))}
                {visitedCountries.length > 3 && (
                  <div className="text-xs text-white/60">+{visitedCountries.length - 3}</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden">
      <div ref={mapContainer} className="absolute inset-0" />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent to-background/10 rounded-lg" />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#171821]/80 rounded-lg border border-white/20">
          <div className="text-center">
            <MapPin className="h-8 w-8 text-white/60 mx-auto mb-2 animate-pulse" />
            <p className="text-white/80 font-medium text-sm">Loading Globe...</p>
          </div>
        </div>
      )}
      {visitedCountries.length > 0 && !isLoading && (
        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm rounded px-2 py-1">
          <p className="text-xs text-white/80 font-medium">{visitedCountries.length} countries</p>
        </div>
      )}
    </div>
  );
};