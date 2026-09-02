import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { guardRead } from "@/lib/data/read-guard";
import { request, invalidateRequests, withAbort } from "@/lib/data/request-controller";

export type SortOption = 'start_date' | 'created_at' | 'end_date';

interface FilterOptions {
  sortBy: SortOption;
  dateFrom?: string;
  dateTo?: string;
}

/**
 * Explicit projection for dashboard/list surfaces.
 * Excludes provider payloads (expedia_data) and other heavy blobs.
 */
export const DASHBOARD_ITINERARY_FIELDS = [
  'id',
  'itin_id',
  'itin_name',
  'itin_desc',
  'itin_date_start',
  'itin_date_end',
  'itin_locations',
  'itin_map_locations',
  'budget',
  'spending',
  'budget_rate',
  'b_efficiency_rate',
  'user_type',
  'planned_traveler_count',
  'attendees',
  'flights',
  'hotels',
  'activities',
  'reservations',
  'images',
  'created_at',
  'userid',
].join(', ');

const USER_PROFILE_FIELDS = [
  'userid',
  'username',
  'first_name',
  'last_name',
  'email',
  'cell',
  'avatar_url',
  'bio',
  'user_type',
  'comp_name',
  'date_format',
  'currency',
  'theme_preference',
  'countries_visited',
  'flight_freq',
  'avg_spending',
  'taai_rating',
  'privacy_accepted_at',
  'terms_accepted_at',
  'created_at',
].join(', ');

export const useDashboardData = (filterOptions?: FilterOptions) => {
  const { user } = useAuth();
  const [activeItineraries, setActiveItineraries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const lastNotificationTime = useRef<number>(0);

  // Primitive dependencies only — the filterOptions object identity is ignored.
  const userId = user?.id ?? null;
  const sortBy: SortOption = filterOptions?.sortBy || 'start_date';
  const dateFrom = filterOptions?.dateFrom ?? null;
  const dateTo = filterOptions?.dateTo ?? null;

  const requestIdRef = useRef(0);
  const releaseRef = useRef<(() => void) | null>(null);

  const fetchItineraries = useCallback(
    async (signature: string, signal: AbortSignal) => {
      guardRead(`itinerary:list:${signature}`);
      let query = supabase
        .from('itinerary')
        .select(DASHBOARD_ITINERARY_FIELDS)
        .eq('userid', userId!);

      if (dateFrom) query = query.gte('itin_date_start', dateFrom);
      if (dateTo) query = query.lte('itin_date_end', dateTo);

      switch (sortBy) {
        case 'start_date':
          query = query.order('itin_date_start', { ascending: false, nullsFirst: false });
          break;
        case 'end_date':
          query = query.order('itin_date_end', { ascending: false, nullsFirst: false });
          break;
        case 'created_at':
          query = query.order('created_at', { ascending: false });
          break;
      }

      const { data, error } = await withAbort(query, signal);
      if (error) throw error;

      return (data as any[]).map(item => ({
        id: item.id,
        itin_id: item.itin_id,
        itin_name: item.itin_name || 'Untitled Trip',
        itin_desc: item.itin_desc,
        itin_date_start: item.itin_date_start,
        itin_date_end: item.itin_date_end,
        itin_locations: Array.isArray(item.itin_locations) ? item.itin_locations : [],
        itin_map_locations: Array.isArray(item.itin_map_locations) ? item.itin_map_locations : [],
        budget: item.budget || 0,
        spending: item.spending || 0,
        budget_rate: item.budget_rate,
        b_efficiency_rate: item.b_efficiency_rate,
        user_type: item.user_type,
        planned_traveler_count: item.planned_traveler_count,
        attendees: Array.isArray(item.attendees) ? item.attendees : [],
        flights: Array.isArray(item.flights) ? item.flights : [],
        hotels: Array.isArray(item.hotels) ? item.hotels : [],
        activities: Array.isArray(item.activities) ? item.activities : [],
        reservations: Array.isArray(item.reservations) ? item.reservations : [],
        images: item.images,
        created_at: item.created_at,
        userid: item.userid,
      }));
    },
    [userId, sortBy, dateFrom, dateTo]
  );

  const fetchProfile = useCallback(
    async (signal: AbortSignal) => {
      guardRead(`users:profile:${userId ?? 'anon'}`);
      const { data, error } = await withAbort(
        supabase.from('users').select(USER_PROFILE_FIELDS).eq('userid', userId!),
        signal
      ).single();
      if (error) throw error;
      return data;
    },
    [userId]
  );

  const runFetch = useCallback(
    (force: boolean) => {
      if (!userId) return;
      const signature = `${userId}|${sortBy}|${dateFrom ?? ''}|${dateTo ?? ''}`;
      const requestId = ++requestIdRef.current;

      // Private records: in-memory cache only, owned by this user id.
      const handle = request({
        key: `dashboard:${signature}`,
        userId,
        bypassCache: force,
        run: async signal =>
          Promise.all([fetchItineraries(signature, signal), fetchProfile(signal)]),
      });

      releaseRef.current?.();
      releaseRef.current = handle.release;

      handle.promise
        .then(([itineraries, profile]) => {
          if (requestId !== requestIdRef.current) return;
          setActiveItineraries(itineraries);
          setUserProfile(profile);
        })
        .catch(error => {
          if (requestId !== requestIdRef.current) return;
          if ((error as Error)?.name === 'AbortError') return;
          console.error('Error loading dashboard data:', (error as Error)?.message);
          const now = Date.now();
          if (now - lastNotificationTime.current > 120000) {
            toast.error('Failed to load your trips');
            lastNotificationTime.current = now;
          }
        })
        .finally(() => {
          if (requestId === requestIdRef.current) setLoading(false);
        });
    },
    [userId, sortBy, dateFrom, dateTo, fetchItineraries, fetchProfile]
  );

  useEffect(() => {
    runFetch(false);
    return () => {
      // Supersede this consumer and abort the network call if nothing else needs it.
      requestIdRef.current += 1;
      releaseRef.current?.();
      releaseRef.current = null;
    };
  }, [runFetch]);

  return {
    activeItineraries,
    loading,
    userProfile,
    refetchData: () => {
      invalidateRequests(`dashboard:${userId ?? ''}`);
      runFetch(true);
    },
  };
};
