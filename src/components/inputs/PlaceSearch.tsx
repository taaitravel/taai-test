import React, { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Landmark, MapPin, Hotel, UtensilsCrossed, Activity } from "lucide-react";
export interface PlaceResult {
  id?: string;
  name: string;
  lat: number;
  lng: number;
  address?: string;
  source: "mapbox" | "yelp" | "expedia";
  url?: string;
  // Expedia-specific fields
  property_id?: string;
  category?: string;
  rating?: number;
  price?: string;
  images?: string[];
  description?: string;
  // Mapbox place type
  placeType?: string;
}

interface PlaceSearchProps {
  id: string;
  label: string;
  placeholder?: string;
  // mode determines which provider to use
  mode: "city" | "poi" | "restaurant" | "hotel" | "activity" | "flight";
  defaultQuery?: string;
  onSelect: (place: PlaceResult) => void;
  locationBias?: { city?: string; lat?: number; lng?: number };
}

const dropdownBase = "absolute z-50 mt-1 w-full max-h-64 overflow-auto rounded-md border bg-popover border-border shadow-lg";

// Helper to get icon based on place type
const getPlaceIcon = (result: PlaceResult) => {
  if (result.source === "expedia" && result.category === "hotel") {
    return <Hotel className="h-4 w-4 text-primary" />;
  }
  if (result.source === "expedia" && result.category === "activity") {
    return <Activity className="h-4 w-4 text-primary" />;
  }
  if (result.source === "yelp") {
    return <UtensilsCrossed className="h-4 w-4 text-primary" />;
  }
  if (result.source === "mapbox") {
    const type = result.placeType;
    if (type === "poi") {
      return <Landmark className="h-4 w-4 text-primary" />;
    }
    if (type === "place" || type === "locality") {
      return <Building2 className="h-4 w-4 text-primary" />;
    }
    if (type === "region" || type === "country") {
      return <MapPin className="h-4 w-4 text-primary" />;
    }
    // Default for mapbox
    return <MapPin className="h-4 w-4 text-primary" />;
  }
  return <MapPin className="h-4 w-4 text-primary" />;
};

export const PlaceSearch: React.FC<PlaceSearchProps> = ({ id, label, placeholder, mode, defaultQuery = "", onSelect, locationBias }) => {
  const [query, setQuery] = useState(defaultQuery);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<PlaceResult[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [biasCoords, setBiasCoords] = useState<{ lat: number; lng: number } | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Resolve city name to coordinates for better provider results
  useEffect(() => {
    let active = true;
    const resolve = async () => {
      if (locationBias?.lat !== undefined && locationBias?.lng !== undefined) {
        setBiasCoords({ lat: locationBias.lat, lng: locationBias.lng });
        return;
      }
      if (locationBias?.city) {
        try {
          const { data, error } = await supabase.functions.invoke('search-cities', { body: { query: locationBias.city } });
          if (!error && Array.isArray(data?.locations) && data.locations.length > 0) {
            const best = data.locations[0];
            if (active) setBiasCoords({ lat: best.lat, lng: best.lng });
          }
        } catch (_e) {
          // ignore
        }
      } else {
        setBiasCoords(null);
      }
    };
    resolve();
    return () => { active = false; };
  }, [locationBias?.city, locationBias?.lat, locationBias?.lng]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    // Clear any existing search timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!query || query.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const fetchMapbox = async (q: string, types: string) => {
      const { data: tokenResp, error: tokenErr } = await supabase.functions.invoke("get-mapbox-token");
      if (tokenErr) throw tokenErr;
      const token = tokenResp?.token;
      if (!token) throw new Error("No Mapbox token");

      const proximity = biasCoords
        ? `&proximity=${biasCoords.lng},${biasCoords.lat}`
        : "";

      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?types=${types}&limit=8${proximity}&access_token=${token}`;
      const resp = await fetch(url);
      const json = await resp.json();
      const items: PlaceResult[] = (json.features || []).map((f: any) => {
        const placeType = f.id?.split('.')?.[0] || f.place_type?.[0] || 'place';
        return {
          id: f.id,
          name: f.text || f.place_name,
          lat: f.center?.[1],
          lng: f.center?.[0],
          address: f.place_name,
          source: "mapbox" as const,
          placeType,
        };
      });
      return items;
    };

    const fetchYelp = async (q: string) => {
      try {
        const body: Record<string, unknown> = { term: q };
        if (biasCoords) {
          body.latitude = biasCoords.lat;
          body.longitude = biasCoords.lng;
        } else if (locationBias?.city) {
          body.location = locationBias.city;
        }
        
        const { data, error } = await supabase.functions.invoke('search-yelp-businesses', { body });
        if (error) throw error;
        
        const items: PlaceResult[] = (data?.businesses || []).map((b: any) => ({
          id: b.id,
          name: b.name,
          lat: b.coordinates?.latitude,
          lng: b.coordinates?.longitude,
          address: b.location?.display_address?.join(', '),
          source: "yelp" as const,
          url: b.url,
          rating: b.rating,
          category: b.categories?.[0]?.title,
        }));
        return items;
      } catch (e) {
        console.error('Yelp search error', e);
        return [];
      }
    };

    const fetchResults = async () => {
      setLoading(true);
      try {
        let items: PlaceResult[] = [];

        if (mode === "hotel") {
          items = await fetchMapbox(query.trim(), "place,region,locality");
          setResults(items);
        } else if (mode === "activity") {
          items = await fetchMapbox(query, "place,region");
          setResults(items);
        } else if (mode === "restaurant") {
          // Use Yelp for restaurant/venue searches, with Mapbox fallback
          const yelpResults = await fetchYelp(query);
          const mapboxResults = await fetchMapbox(query, "poi,place");
          // Yelp first (better for businesses), then Mapbox
          items = [...yelpResults, ...mapboxResults.slice(0, 3)];
          setResults(items);
        } else if (mode === "poi") {
          // For general POI (stadiums, venues, etc.), try Yelp first then Mapbox
          const yelpResults = await fetchYelp(query);
          const mapboxResults = await fetchMapbox(query, "poi,place,region");
          items = [...yelpResults, ...mapboxResults];
          setResults(items);
        } else {
          const typesParam = mode === "city" ? "place,region" : "poi,place,region";
          items = await fetchMapbox(query, typesParam);
          setResults(items);
        }
      } catch (e) {
        console.error("PlaceSearch error", e);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    searchTimeoutRef.current = setTimeout(fetchResults, 400);
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, mode, biasCoords, locationBias?.city]);

  return (
    <div ref={containerRef} className="relative">
      <Label htmlFor={id} className="text-xs font-medium text-white/70 mb-1.5 block">{label}</Label>
      <Input
        id={id}
        placeholder={placeholder}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        className="bg-white/5 text-white border-white/10 focus-visible:ring-2 focus-visible:ring-primary/50 h-9 text-sm placeholder:text-white/40"
      />
      {open && (results.length > 0 || loading) && (
        <div className={dropdownBase}>
          {loading && <div className="px-3 py-2 text-sm opacity-70 text-white">Searching…</div>}
          {!loading && results.map((r) => (
            <button
              key={(r.id || r.name) + String(r.lat)}
              type="button"
              onClick={() => {
                setQuery(r.name);
                setOpen(false);
                onSelect(r);
              }}
              className="block w-full text-left px-3 py-2 hover:bg-accent/30 text-white"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  {r.address && <div className="text-sm font-medium">{r.address}</div>}
                  {r.rating && (
                    <div className="text-xs text-primary">
                      ★ {typeof r.rating === 'number' ? r.rating.toFixed(1) : r.rating} 
                      {r.price && `• ${r.price}`}
                    </div>
                  )}
                  {r.description && (
                    <div className="text-xs opacity-60 truncate max-w-xs">
                      {r.description}
                    </div>
                  )}
                </div>
                <div className="text-[10px] opacity-60 ml-2">
                  {r.source === "yelp" ? "Yelp" : r.source === "expedia" ? "Expedia" : "Map"}
                </div>
              </div>
            </button>
          ))}
          {!loading && results.length === 0 && (
            <div className="px-3 py-2 text-sm opacity-70">No results</div>
          )}
        </div>
      )}
    </div>
  );
};

export default PlaceSearch;
