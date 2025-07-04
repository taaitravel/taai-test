import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface WorldMapProps {
  visitedCountries: string[];
}

const WorldMap = ({ visitedCountries }: WorldMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  // Countries coordinates mapping
  const countryCoordinates: { [key: string]: [number, number] } = {
    'France': [2.2137, 46.2276],
    'Italy': [12.5674, 41.8719],
    'Spain': [-3.7492, 40.4637],
    'United States': [-95.7129, 37.0902],
    'Japan': [138.2529, 36.2048],
    'United Kingdom': [-3.4360, 55.3781],
    'Germany': [10.4515, 51.1657],
    'Australia': [133.7751, -25.2744],
    'Brazil': [-47.8825, -15.7942],
    'Canada': [-106.3468, 56.1304],
    'Mexico': [-102.5528, 23.6345],
    'Thailand': [100.9925, 15.8700],
    'Greece': [21.8243, 39.0742],
    'Turkey': [35.2433, 38.9637],
    'Egypt': [30.8025, 26.8206],
    'Morocco': [-7.0926, 31.7917],
    'India': [78.9629, 20.5937],
    'China': [104.1954, 35.8617]
  };

  useEffect(() => {
    if (!mapContainer.current) return;

    // You'll need to add your Mapbox token here
    mapboxgl.accessToken = 'YOUR_MAPBOX_TOKEN'; // Replace with actual token

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      projection: 'globe',
      zoom: 1.2,
      center: [0, 30],
      interactive: false, // Make it non-interactive for display purposes
    });

    map.current.on('style.load', () => {
      // Add fog for a nice effect
      map.current?.setFog({
        color: 'rgb(245, 245, 245)',
        'high-color': 'rgb(230, 230, 240)',
        'horizon-blend': 0.1,
      });

      // Add markers for visited countries
      visitedCountries.forEach(country => {
        const coordinates = countryCoordinates[country];
        if (coordinates) {
          // Create a custom marker
          const el = document.createElement('div');
          el.className = 'w-3 h-3 bg-primary rounded-full border-2 border-white shadow-lg animate-pulse';
          
          new mapboxgl.Marker(el)
            .setLngLat(coordinates)
            .addTo(map.current!);
        }
      });
    });

    return () => {
      map.current?.remove();
    };
  }, [visitedCountries]);

  return (
    <div className="relative w-full h-48 bg-gray-50 rounded-lg overflow-hidden">
      <div ref={mapContainer} className="w-full h-full" />
      {!mapboxgl.accessToken || mapboxgl.accessToken === 'YOUR_MAPBOX_TOKEN' ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="text-center p-4">
            <p className="text-sm text-gray-600 mb-2">World Map (Mapbox token required)</p>
            <div className="flex flex-wrap gap-1">
              {visitedCountries.map(country => (
                <span key={country} className="px-2 py-1 bg-primary text-primary-foreground text-xs rounded">
                  {country}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default WorldMap;