import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ItineraryData } from "@/types/itinerary";
import { useMapLocationSync } from "./useMapLocationSync";
import { guardRead } from "@/lib/data/read-guard";

/**
 * Explicit projection — never `select('*')`.
 * Large provider payloads (expedia_data, raw offers) are intentionally excluded.
 */
export const ITINERARY_WORKSPACE_FIELDS = [
  'id',
  'itin_id',
  'itin_name',
  'itin_desc',
  'itin_date_start',
  'itin_date_end',
  'budget',
  'spending',
  'budget_rate',
  'b_efficiency_rate',
  'user_type',
  'itin_locations',
  'itin_map_locations',
  'planned_traveler_count',
  'creation_key',
  'attendees',
  'flights',
  'hotels',
  'activities',
  'reservations',
].join(', ');

export const useItineraryData = (itineraryId: string | null) => {
  const [itineraryData, setItineraryData] = useState<ItineraryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [budgetRefreshTrigger, setBudgetRefreshTrigger] = useState(0);
  const [mapRefreshTrigger, setMapRefreshTrigger] = useState(0);
  const { toast } = useToast();
  const { syncMapLocations, isUpdating } = useMapLocationSync(itineraryId);

  // Keep the latest toast callback without making it an effect dependency.
  const toastRef = useRef(toast);
  toastRef.current = toast;

  // Guards against superseded / unmounted requests.
  const requestIdRef = useRef(0);

  const refreshBudgetData = useCallback(() => {
    setBudgetRefreshTrigger(prev => prev + 1);
  }, []);

  const refreshMapData = useCallback(() => {
    setMapRefreshTrigger(prev => prev + 1);
  }, []);

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    let cancelled = false;

    guardRead(`itinerary:${itineraryId ?? 'first'}`);

    // Memory-only cache; released (and aborted) on unmount.
    const handle = request({
      key: `itinerary:workspace:${itineraryId ?? 'first'}:${mapRefreshTrigger}`,
      userId: null,
      run: async signal => {
        let query = supabase.from('itinerary').select(ITINERARY_WORKSPACE_FIELDS);
        query = itineraryId ? query.eq('id', parseInt(itineraryId)) : query.limit(1);
        const { data, error } = await withAbort(query, signal).single();
        if (error) throw error;
        return data;
      },
    });

    handle.promise
      .then(data => {
        if (cancelled || requestId !== requestIdRef.current) return;

        const row = data as unknown as Record<string, unknown>;
        const transformedData: ItineraryData = {
          ...(row as unknown as ItineraryData),
          itin_locations: row.itin_locations as string[],
          itin_map_locations: row.itin_map_locations as Array<{ city: string; lat: number; lng: number }>,
          attendees: row.attendees as ItineraryData['attendees'],
          flights: row.flights as ItineraryData['flights'],
          hotels: row.hotels as ItineraryData['hotels'],
          activities: row.activities as ItineraryData['activities'],
          reservations: row.reservations as ItineraryData['reservations'],
        };

        // Metadata only — never log full itinerary/provider payloads.
        if (import.meta.env.DEV) {
          console.debug('[useItineraryData] loaded', {
            id: transformedData.id,
            mapLocations: transformedData.itin_map_locations?.length || 0,
          });
        }

        setItineraryData(transformedData);
        setBudgetRefreshTrigger(prev => prev + 1);
      })
      .catch(error => {
        if (cancelled || requestId !== requestIdRef.current) return;
        if ((error as Error)?.name === 'AbortError') return;
        console.error('Error fetching itinerary:', (error as Error)?.message);
        toastRef.current({
          title: "Error",
          description: "Failed to load itinerary data",
          variant: "destructive",
        });
      })
      .finally(() => {
        if (!cancelled && requestId === requestIdRef.current) setLoading(false);
      });

    return () => {
      cancelled = true;
      handle.release();
    };
  }, [itineraryId, mapRefreshTrigger]);

  return {
    itineraryData,
    loading,
    budgetRefreshTrigger,
    refreshBudgetData,
    refreshMapData,
    syncMapLocations,
    isUpdating
  };
};
