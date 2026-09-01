import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { guardRead } from "@/lib/data/read-guard";

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
  'first_name',
  'last_name',
  'email',
  'avatar_url',
  'bio',
  'phone',
  'date_format',
  'currency',
  'countries_visited',
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

  // Deduplication: identical read signatures are not re-requested.
  const inFlightRef = useRef<string | null>(null);
  const lastSignatureRef = useRef<string | null>(null);
  const requestIdRef = useRef(0);

  const fetchUserItineraries = useCallback(async (signature: string, requestId: number) => {
    guardRead(`itinerary:list:${signature}`);
    try {
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

      const { data, error } = await query;
      if (requestId !== requestIdRef.current) return;
      if (error) throw error;

      const transformedItineraries = (data as any[]).map(item => ({
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
        userid: item.userid
      }));

      setActiveItineraries(transformedItineraries);
    } catch (error) {
      if (requestId !== requestIdRef.current) return;
      console.error('Error fetching itineraries:', (error as Error)?.message);
      const now = Date.now();
      if (now - lastNotificationTime.current > 120000) {
        toast.error('Failed to load your trips');
        lastNotificationTime.current = now;
      }
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [userId, sortBy, dateFrom, dateTo]);

  const fetchUserProfile = useCallback(async (requestId: number) => {
    guardRead(`users:profile:${userId ?? 'anon'}`);
    try {
      const { data, error } = await supabase
        .from('users')
        .select(USER_PROFILE_FIELDS)
        .eq('userid', userId!)
        .single();

      if (requestId !== requestIdRef.current) return;
      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      if (requestId !== requestIdRef.current) return;
      console.error('Error fetching user profile:', (error as Error)?.message);
    }
  }, [userId]);

  const runFetch = useCallback((force: boolean) => {
    if (!userId) return;
    const signature = `${userId}|${sortBy}|${dateFrom ?? ''}|${dateTo ?? ''}`;
    if (!force && (inFlightRef.current === signature || lastSignatureRef.current === signature)) return;

    inFlightRef.current = signature;
    const requestId = ++requestIdRef.current;

    Promise.all([fetchUserItineraries(signature, requestId), fetchUserProfile(requestId)]).finally(() => {
      if (inFlightRef.current === signature) inFlightRef.current = null;
      lastSignatureRef.current = signature;
    });
  }, [userId, sortBy, dateFrom, dateTo, fetchUserItineraries, fetchUserProfile]);

  useEffect(() => {
    runFetch(false);
    return () => {
      // Supersede any in-flight response for this signature.
      requestIdRef.current += 1;
      inFlightRef.current = null;
    };
  }, [runFetch]);

  return {
    activeItineraries,
    loading,
    userProfile,
    refetchData: () => runFetch(true)
  };
};
