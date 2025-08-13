import React, { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export interface PlaceResult {
  id?: string;
  name: string;
  lat: number;
  lng: number;
  address?: string;
  source: "mapbox" | "yelp";
  url?: string;
}

interface PlaceSearchProps {
  id: string;
  label: string;
  placeholder?: string;
  // mode determines which provider to use
  mode: "city" | "poi" | "restaurant";
  defaultQuery?: string;
  onSelect: (place: PlaceResult) => void;
  locationBias?: { city?: string; lat?: number; lng?: number };
}

const dropdownBase = "absolute z-20 mt-1 w-full max-h-64 overflow-auto rounded-md border bg-background text-foreground shadow-md";

export const PlaceSearch: React.FC<PlaceSearchProps> = ({ id, label, placeholder, mode, defaultQuery = "", onSelect, locationBias }) => {
  const [query, setQuery] = useState(defaultQuery);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<PlaceResult[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [biasCoords, setBiasCoords] = useState<{ lat: number; lng: number } | null>(null);

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
    const fetchMapbox = async (q: string, types: string) => {
      const { data: tokenResp, error: tokenErr } = await supabase.functions.invoke("get-mapbox-token");
      if (tokenErr) throw tokenErr;
      const token = tokenResp?.token;
      if (!token) throw new Error("No Mapbox token");

      // Use only the user query; bias via proximity when available
      const effectiveQuery = q;
      const proximity = biasCoords
        ? `&proximity=${biasCoords.lng},${biasCoords.lat}`
        : "";

      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(effectiveQuery)}.json?types=${types}&limit=8${proximity}&access_token=${token}`;
      const resp = await fetch(url);
      const json = await resp.json();
      const items: PlaceResult[] = (json.features || []).map((f: any) => ({
        id: f.id,
        name: f.text || f.place_name,
        lat: f.center?.[1],
        lng: f.center?.[0],
        address: f.place_name,
        source: "mapbox",
      }));
      return items;
    };

    const fetchResults = async () => {
      if (!query || query.trim().length < 2) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        if (mode === "restaurant") {
          const body: any = { term: query };
          if (biasCoords) {
            body.latitude = biasCoords.lat;
            body.longitude = biasCoords.lng;
          } else if (locationBias?.city) {
            body.location = locationBias.city;
          }
          const { data, error } = await supabase.functions.invoke("search-yelp-businesses", { body });
          if (error) throw error;
          let items: PlaceResult[] = (data?.businesses || []).map((b: any) => ({
            id: b.id,
            name: b.name,
            lat: b.coordinates?.latitude,
            lng: b.coordinates?.longitude,
            address: b.location?.display_address?.join(", "),
            source: "yelp",
            url: b.url,
          }));

          // Fallback to Mapbox POI if Yelp yields no results
          if (!items.length) {
            items = await fetchMapbox(query, "poi");
          }
          setResults(items);
        } else {
          const typesParam = mode === "city" ? "place,region" : "poi,place,region";
          const items = await fetchMapbox(query, typesParam);
          setResults(items);
        }
      } catch (e) {
        console.error("PlaceSearch error", e);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const t = setTimeout(fetchResults, 300);
    return () => clearTimeout(t);
  }, [query, mode, JSON.stringify(locationBias), JSON.stringify(biasCoords)]);

  return (
    <div ref={containerRef} className="relative">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        placeholder={placeholder}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        className="bg-white text-[#171821] border-0 focus-visible:ring-2 focus-visible:ring-primary"
      />
      {open && (results.length > 0 || loading) && (
        <div className={dropdownBase}>
          {loading && <div className="px-3 py-2 text-sm opacity-70">Searching…</div>}
          {!loading && results.map((r) => (
            <button
              key={(r.id || r.name) + String(r.lat)}
              type="button"
              onClick={() => {
                setQuery(r.name);
                setOpen(false);
                onSelect(r);
              }}
              className="block w-full text-left px-3 py-2 hover:bg-accent/30"
            >
              <div className="text-sm font-medium">{r.name}</div>
              {r.address && <div className="text-xs opacity-70">{r.address}</div>}
              <div className="text-[10px] opacity-60">{r.source === "yelp" ? "Yelp" : "Map"}</div>
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
