import { useEffect, useRef, useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { AuthProvider } from '@/contexts/AuthContext';
import { useThemeContext } from '@/contexts/ThemeContext';
import { getMapStyle, getMarkerBorderColor } from '@/lib/mapStyles';
import { Loader2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MapLegend } from './MapLegend';
import { MapPopupCard } from './MapPopupCard';
import { Toaster } from '@/components/ui/toaster';

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

// ============================================
// MARKER CONFIGURATION - Easy to modify for sales, themes, etc.
// ============================================
const MARKER_CONFIG = {
  // Cluster marker styling
  cluster: {
    background: '#ffce87',      // Gold background
    textColor: '#1a1c2e',       // Dark text
    borderColor: '#ffffff',     // White border
    borderWidth: 3,
    // Size based on point count
    sizes: {
      small: 20,    // < 10 points
      medium: 25,   // 10-49 points
      large: 30,    // 50-99 points
      xlarge: 40    // 100+ points
    }
  },
  // Individual point marker styling
  point: {
    background: '#ffce87',      // Gold background
    textColor: '#1a1c2e',       // Dark text
    borderColor: '#ffffff',     // White border
    borderWidth: 2,
    radius: 18,                 // Circle radius
    textSize: 10
  }
};

interface SearchResultsMapProps {
  results: any[];
  searchType?: 'hotels' | 'flights' | 'activities' | 'cars' | 'packages' | 'dining';
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

// Get category color (for legend/UI, not markers)
const getCategoryColor = (category: string): string => {
  switch (category) {
    case 'hotel': return '#c084fc';
    case 'activity': return '#34d399';
    case 'flight': return '#60a5fa';
    case 'reservation': return '#fb923c';
    case 'car': return '#4ade80';
    case 'package': return '#ff849c';
    default: return '#ffce87';
  }
};

export const SearchResultsMap = ({ results, searchType }: SearchResultsMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const sourceAdded = useRef(false);
  const { theme } = useThemeContext();

  const category = getCategoryFromSearchType(searchType);
  const categoryColor = getCategoryColor(category);

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

  // Initialize map - re-create on theme change
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    // Destroy existing map on theme change
    if (map.current) {
      if (popupRef.current) { popupRef.current.remove(); popupRef.current = null; }
      map.current.remove();
      map.current = null;
      sourceAdded.current = false;
    }

    setLoading(true);

    const borderColor = getMarkerBorderColor(theme);
    
    mapboxgl.accessToken = mapboxToken;
    
    // Use clean base style based on theme
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: getMapStyle(theme, 'search'),
      center: [0, 20],
      zoom: 2,
      projection: 'mercator' as any,
      antialias: true,
      attributionControl: false
    });

    // Update marker border config for this theme
    MARKER_CONFIG.cluster.borderColor = borderColor;
    MARKER_CONFIG.point.borderColor = borderColor;

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
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
      sourceAdded.current = false;
    };
  }, [mapboxToken, theme]);

  // Add/update GeoJSON source with clustering
  useEffect(() => {
    if (!map.current || loading) return;

    const validResults = results.filter(r => r.latitude && r.longitude);
    if (validResults.length === 0) return;

    // Convert results to GeoJSON
    const geojsonData: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: validResults.map((result, index) => ({
        type: 'Feature' as const,
        id: index,
        geometry: {
          type: 'Point' as const,
          coordinates: [result.longitude, result.latitude]
        },
        properties: {
          id: result.id || index,
          name: result.name || 'Unknown',
          price: result.pricePerNight || result.price || result.totalPrice || 0,
          rating: result.rating || null,
          image: result.images?.[0] || result.image || null,
          location: result.cityName || result.location || result.address || '',
          distance: result.distanceFromSearch || null,
          reviews: result.review_count || null,
          bookingUrl: result.bookingUrl || null
        }
      }))
    };

    const setupLayers = () => {
      if (!map.current) return;

      // Remove existing layers and source if they exist
      if (map.current.getLayer('cluster-count')) map.current.removeLayer('cluster-count');
      if (map.current.getLayer('clusters')) map.current.removeLayer('clusters');
      if (map.current.getLayer('unclustered-point')) map.current.removeLayer('unclustered-point');
      if (map.current.getLayer('unclustered-price')) map.current.removeLayer('unclustered-price');
      if (map.current.getSource('search-results')) map.current.removeSource('search-results');

      // Add clustered source
      map.current.addSource('search-results', {
        type: 'geojson',
        data: geojsonData,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50
      });

      // ============================================
      // CLUSTER CIRCLES - Gold bubbles for grouped points
      // ============================================
      map.current.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'search-results',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': MARKER_CONFIG.cluster.background,
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            MARKER_CONFIG.cluster.sizes.small,
            10, MARKER_CONFIG.cluster.sizes.medium,
            50, MARKER_CONFIG.cluster.sizes.large,
            100, MARKER_CONFIG.cluster.sizes.xlarge
          ],
          'circle-stroke-width': MARKER_CONFIG.cluster.borderWidth,
          'circle-stroke-color': MARKER_CONFIG.cluster.borderColor
        }
      });

      // ============================================
      // CLUSTER COUNT TEXT - Number inside cluster bubbles
      // ============================================
      map.current.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'search-results',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': ['get', 'point_count_abbreviated'],
          'text-font': ['DIN Pro Bold', 'Arial Unicode MS Bold'],
          'text-size': 14,
          'text-allow-overlap': true
        },
        paint: {
          'text-color': MARKER_CONFIG.cluster.textColor
        }
      });

      // ============================================
      // INDIVIDUAL POINT CIRCLES - Gold bubbles for single items
      // ============================================
      map.current.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'search-results',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': MARKER_CONFIG.point.background,
          'circle-radius': MARKER_CONFIG.point.radius,
          'circle-stroke-width': MARKER_CONFIG.point.borderWidth,
          'circle-stroke-color': MARKER_CONFIG.point.borderColor
        }
      });

      // ============================================
      // PRICE LABELS - Text on individual point markers
      // ============================================
      map.current.addLayer({
        id: 'unclustered-price',
        type: 'symbol',
        source: 'search-results',
        filter: ['!', ['has', 'point_count']],
        layout: {
          'text-field': ['concat', '$', ['to-string', ['round', ['get', 'price']]]],
          'text-font': ['DIN Pro Bold', 'Arial Unicode MS Bold'],
          'text-size': MARKER_CONFIG.point.textSize,
          'text-offset': [0, 0],
          'text-allow-overlap': true
        },
        paint: {
          'text-color': MARKER_CONFIG.point.textColor
        }
      });

      // Fit bounds to show all points
      const bounds = new mapboxgl.LngLatBounds();
      validResults.forEach(result => {
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

    // Wait for style to load before adding layers
    if (map.current.isStyleLoaded()) {
      setupLayers();
    } else {
      map.current.once('style.load', setupLayers);
    }
  }, [results, loading, category, categoryColor]);

  // Handle click events for popups and clusters
  useEffect(() => {
    if (!map.current || loading) return;

    // Click on cluster to zoom in
    const handleClusterClick = (e: mapboxgl.MapMouseEvent) => {
      const features = map.current?.queryRenderedFeatures(e.point, {
        layers: ['clusters']
      });

      if (!features?.length || !map.current) return;

      const clusterId = features[0].properties?.cluster_id;
      const source = map.current.getSource('search-results') as mapboxgl.GeoJSONSource;
      
      source?.getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (err || !map.current) return;

        const geometry = features[0].geometry;
        if (geometry.type === 'Point') {
          map.current.easeTo({
            center: geometry.coordinates as [number, number],
            zoom: zoom || 10
          });
        }
      });
    };

    // Click on individual point to show popup
    const handlePointClick = (e: mapboxgl.MapMouseEvent) => {
      const features = map.current?.queryRenderedFeatures(e.point, {
        layers: ['unclustered-point']
      });

      if (!features?.length || !map.current) return;

      const feature = features[0];
      const geometry = feature.geometry;
      
      if (geometry.type !== 'Point') return;

      const coordinates = geometry.coordinates.slice() as [number, number];
      const properties = feature.properties;

      // Find the original result data for full item info
      const itemId = properties?.id;
      const originalItem = results.find((r, idx) => 
        (r.id === itemId) || idx === itemId
      ) || properties;

      // Close existing popup
      if (popupRef.current) {
        popupRef.current.remove();
      }

      // Create popup container
      const popupContainer = document.createElement('div');
      popupContainer.className = 'map-popup-container';

      // Create new popup at the correct position
      popupRef.current = new mapboxgl.Popup({
        offset: [0, -20],
        closeButton: true,
        closeOnClick: true,
        anchor: 'bottom',
        maxWidth: '320px',
        className: 'map-popup-dark'
      })
        .setLngLat(coordinates)
        .setDOMContent(popupContainer)
        .addTo(map.current);

      // Render React component into popup with required context providers
      const root = createRoot(popupContainer);
      const queryClient = new QueryClient();
      root.render(
        <BrowserRouter>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <MapPopupCard 
                item={originalItem} 
                searchType={searchType}
                onClose={() => popupRef.current?.remove()}
              />
              <Toaster />
            </AuthProvider>
          </QueryClientProvider>
        </BrowserRouter>
      );

      // Cleanup React root when popup closes
      popupRef.current.on('close', () => {
        root.unmount();
      });
    };

    // Change cursor on hover
    const handleMouseEnter = () => {
      if (map.current) map.current.getCanvas().style.cursor = 'pointer';
    };

    const handleMouseLeave = () => {
      if (map.current) map.current.getCanvas().style.cursor = '';
    };

    // Add event listeners
    map.current.on('click', 'clusters', handleClusterClick);
    map.current.on('click', 'unclustered-point', handlePointClick);
    map.current.on('mouseenter', 'clusters', handleMouseEnter);
    map.current.on('mouseleave', 'clusters', handleMouseLeave);
    map.current.on('mouseenter', 'unclustered-point', handleMouseEnter);
    map.current.on('mouseleave', 'unclustered-point', handleMouseLeave);

    return () => {
      if (map.current) {
        map.current.off('click', 'clusters', handleClusterClick);
        map.current.off('click', 'unclustered-point', handlePointClick);
        map.current.off('mouseenter', 'clusters', handleMouseEnter);
        map.current.off('mouseleave', 'clusters', handleMouseLeave);
        map.current.off('mouseenter', 'unclustered-point', handleMouseEnter);
        map.current.off('mouseleave', 'unclustered-point', handleMouseLeave);
      }
      if (popupRef.current) {
        popupRef.current.remove();
      }
    };
  }, [loading, category, searchType, results]);

  const handleResetView = useCallback(() => {
    if (!map.current) return;
    
    const validResults = results.filter(r => r.latitude && r.longitude);
    if (validResults.length === 0) return;

    const bounds = new mapboxgl.LngLatBounds();
    validResults.forEach(result => {
      bounds.extend([result.longitude, result.latitude]);
    });

    if (!bounds.isEmpty()) {
      map.current.fitBounds(bounds, {
        padding: { top: 80, bottom: 80, left: 80, right: 80 },
        maxZoom: 14,
        duration: 1000,
      });
    }
  }, [results]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] bg-card/50 rounded-lg border border-border">
        <div className="text-destructive mb-2">⚠️ Map Error</div>
        <p className="text-muted-foreground text-sm">{error}</p>
      </div>
    );
  }

  const validResults = results.filter(r => r.latitude && r.longitude);

  return (
    <div className="relative w-full h-[600px] rounded-lg overflow-hidden border border-border">
      {/* Map container - always render so map can initialize */}
      <div ref={mapContainer} className="absolute inset-0" />
      
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-card/80 z-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
          <p className="text-muted-foreground text-sm">Loading map...</p>
        </div>
      )}

      {/* No locations message */}
      {!loading && validResults.length === 0 && results.length > 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-card/80 z-20">
          <p className="text-muted-foreground text-sm">No locations available for map view</p>
        </div>
      )}
      
      {/* Legend */}
      {!loading && <MapLegend searchType={searchType} />}
      
      {/* Map Controls Overlay */}
      {!loading && validResults.length > 0 && (
        <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-10">
          <div className="bg-card/90 backdrop-blur-sm px-4 py-2 rounded-lg border border-border flex items-center gap-3">
            <span className="text-muted-foreground text-sm">
              {validResults.length} locations • Click clusters to expand
            </span>
            
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
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
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-card/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-border text-muted-foreground text-xs z-10 pointer-events-none">
          Use controls to zoom • Drag to pan • Click markers for details
        </div>
      )}
    </div>
  );
};
