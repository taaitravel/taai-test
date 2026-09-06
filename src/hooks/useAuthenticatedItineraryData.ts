import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { ItineraryData } from "@/types/itinerary";
import { useMapLocationSync } from "./useMapLocationSync";
import { guardRead } from "@/lib/data/read-guard";
import { request, withAbort } from "@/lib/data/request-controller";
import {
  ITINERARY_METADATA_FIELDS,
  ITINERARY_SECTION_FIELDS,
  PAGE_SIZES,
  assertSafeProjection,
} from "@/lib/data/projections";
import { CART_LIST_PROJECTION, fetchCartItemDetail, type CartListItem } from "@/lib/data/cart-loading";

export type UserRole = 'owner' | 'collaborator' | null;

/**
 * Explicit projection for the itinerary workspace: lightweight metadata plus
 * the day/item sections the screen renders. `expedia_data` and every provider
 * blob are excluded by construction.
 */
export const ITINERARY_WORKSPACE_PROJECTION = assertSafeProjection(
  'itinerary workspace',
  `${ITINERARY_METADATA_FIELDS}, attendees, ${ITINERARY_SECTION_FIELDS.split(', ')
    .filter(f => !['id', 'itin_id'].includes(f))
    .join(', ')}`
);

/**
 * The main workspace load uses the cart LIST projection: it never selects
 * `item_data`. The saved provider snapshot is loaded on demand, for one
 * explicitly opened item, through `loadCartItemDetail` below.
 */
const CART_PROJECTION = CART_LIST_PROJECTION;

export const useAuthenticatedItineraryData = (itineraryId: string | null) => {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [itineraryData, setItineraryData] = useState<ItineraryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [budgetRefreshTrigger, setBudgetRefreshTrigger] = useState(0);
  const [mapRefreshTrigger, setMapRefreshTrigger] = useState(0);
  const { toast } = useToast();
  const { syncMapLocations, isUpdating } = useMapLocationSync(itineraryId);

  // Keep the latest toast callback out of the effect dependencies.
  const toastRef = useRef(toast);
  toastRef.current = toast;

  const requestIdRef = useRef(0);

  /** Owner-scoped in-memory snapshot cache; cleared on unmount/account change. */
  const detailCacheRef = useRef<{ owner: string | null; entries: Map<string, Record<string, unknown> | null> }>({
    owner: null,
    entries: new Map(),
  });
  const detailAbortRef = useRef<AbortController | null>(null);
  const [cartItemDetails, setCartItemDetails] = useState<Record<string, Record<string, unknown> | null>>({});

  // Account change / logout: abort in-flight detail work and drop the cache.
  useEffect(() => {
    if (detailCacheRef.current.owner !== userId) {
      detailAbortRef.current?.abort();
      detailAbortRef.current = null;
      detailCacheRef.current = { owner: userId, entries: new Map() };
      setCartItemDetails({});
    }
  }, [userId]);

  // Unmount: abort and clear.
  useEffect(() => () => {
    detailAbortRef.current?.abort();
    detailAbortRef.current = null;
    detailCacheRef.current = { owner: null, entries: new Map() };
  }, []);

  /**
   * Loads the saved snapshot for ONE opened cart item/section. Scoped to the
   * authenticated user (or the shared trip, where RLS gates membership).
   */
  const loadCartItemDetail = useCallback(
    async (cartItemId: string): Promise<Record<string, unknown> | null> => {
      if (!cartItemId || !userId) return null;
      const cache = detailCacheRef.current;
      if (cache.owner === userId && cache.entries.has(cartItemId)) {
        return cache.entries.get(cartItemId) ?? null;
      }
      const controller = new AbortController();
      detailAbortRef.current = controller;
      const detail = await fetchCartItemDetail(supabase, cartItemId, {
        userId,
        itineraryId: itineraryId ?? null,
      });
      if (controller.signal.aborted || detailCacheRef.current.owner !== userId) return null;
      detailCacheRef.current.entries.set(cartItemId, detail);
      setCartItemDetails(prev => ({ ...prev, [cartItemId]: detail }));
      return detail;
    },
    [userId, itineraryId],
  );

  const refreshBudgetData = useCallback(() => setBudgetRefreshTrigger(prev => prev + 1), []);
  const refreshMapData = useCallback(() => setMapRefreshTrigger(prev => prev + 1), []);

  useEffect(() => {
    if (!itineraryId || !userId) return;

    const requestId = ++requestIdRef.current;
    let cancelled = false;

    guardRead(`itinerary:workspace:${itineraryId}`);

    const handle = request({
      key: `itinerary:authenticated:${userId}:${itineraryId}:${budgetRefreshTrigger}:${mapRefreshTrigger}`,
      userId,
      run: async signal => {
        const { data, error } = await withAbort(
          supabase.from('itinerary').select(ITINERARY_WORKSPACE_PROJECTION).eq('id', parseInt(itineraryId)),
          signal
        ).single();
        if (error) throw error;

        const row = data as unknown as Record<string, any>;
        const isOwner = row.userid === userId;
        let role: UserRole = isOwner ? 'owner' : null;

        if (!isOwner) {
          const { data: attendee } = await withAbort(
            supabase
              .from('itinerary_attendees')
              .select('role')
              .eq('itinerary_id', row.id)
              .eq('user_id', userId)
              .eq('status', 'accepted'),
            signal
          ).maybeSingle();
          role = attendee ? 'collaborator' : null;
        }

        let cartQuery = supabase
          .from('cart_items')
          .select(CART_PROJECTION)
          .eq('itinerary_id', row.itin_id)
          .limit(PAGE_SIZES.cartItems);
        if (!isOwner) cartQuery = cartQuery.eq('user_id', userId);
        const { data: cartItems } = await withAbort(cartQuery, signal);

        return { row, role, isOwner, cartItems: (cartItems ?? []) as unknown as CartListItem[] };
      },
    });

    handle.promise
      .then(({ row, role, isOwner, cartItems }) => {
        if (cancelled || requestId !== requestIdRef.current) return;
        setUserRole(role);

        const byType = (type: string) => cartItems.filter(item => item.type === type);

        /**
         * Cart-derived entries are built from the LIST projection only. The
         * saved provider snapshot for a row is merged in by the workspace when
         * that specific item/section is opened (`loadCartItemDetail`).
         */
        const dates = (item: CartListItem) => item.item_service_dates ?? {};
        const fromCart = (item: CartListItem) => ({
          name: item.item_name ?? undefined,
          provider: item.item_provider ?? undefined,
          images: [] as string[],
          cost: item.price,
          price: item.price,
          booking_status: item.booking_status || 'pending',
          service_timing: item.item_service_timing ?? undefined,
          from_cart: true,
          detail_loaded: false,
          cart_id: item.id,
        });

        const cartFlights = byType('flight').map(item => ({
          ...fromCart(item),
          depart: dates(item).depart ?? dates(item).start ?? null,
          return: dates(item).return ?? dates(item).end ?? null,
        }));

        const cartHotels = byType('hotel').map(item => ({
          ...fromCart(item),
          check_in: dates(item).check_in ?? dates(item).checkIn ?? null,
          check_out: dates(item).check_out ?? dates(item).checkOut ?? null,
        }));

        const cartActivities = byType('activity').map(item => ({
          ...fromCart(item),
          date: dates(item).date ?? dates(item).start ?? null,
        }));

        const cartReservations = byType('reservation').map(item => ({
          ...fromCart(item),
          date: dates(item).date ?? dates(item).start ?? null,
        }));

        const totalSpending = cartItems.reduce((sum, item) => sum + (item.price ?? 0), 0);
        if (isOwner && totalSpending !== row.spending) {
          void supabase
            .from('itinerary')
            .update({ spending: totalSpending })
            .eq('id', row.id);
        }

        const transformedData: ItineraryData = {
          ...(row as unknown as ItineraryData),
          itin_locations: row.itin_locations as string[],
          itin_map_locations: row.itin_map_locations as Array<{ city: string; lat: number; lng: number }>,
          attendees: (row.attendees as ItineraryData['attendees']) ?? [],
          flights: [
            ...((row.flights as Array<any>)?.map(flight => ({
              ...flight,
              images: flight.images || [],
              booking_status: flight.booking_status || 'pending',
              location: flight.location || flight.to,
              rating: flight.rating || 4.0,
            })) || []),
            ...cartFlights,
          ],
          hotels: [
            ...((row.hotels as Array<any>)?.map(hotel => ({
              ...hotel,
              images: hotel.images || [],
              booking_status: hotel.booking_status || 'pending',
              location: hotel.location || hotel.city,
              rating: hotel.rating || 4.0,
              price: hotel.price || hotel.cost,
            })) || []),
            ...cartHotels,
          ],
          activities: [
            ...((row.activities as Array<any>)?.map(activity => ({
              ...activity,
              images: activity.images || [],
              booking_status: activity.booking_status || 'pending',
              location: activity.location || activity.city,
              rating: activity.rating || 4.0,
              price: activity.price || activity.cost,
            })) || []),
            ...cartActivities,
          ],
          reservations: [
            ...((row.reservations as Array<any>)?.map(reservation => ({
              ...reservation,
              images: reservation.images || [],
              booking_status: reservation.booking_status || 'pending',
              location: reservation.location || reservation.city,
              cuisine: reservation.cuisine || 'International',
            })) || []),
            ...cartReservations,
          ],
        };

        setItineraryData(transformedData);
      })
      .catch(error => {
        if (cancelled || requestId !== requestIdRef.current) return;
        if ((error as Error)?.name === 'AbortError') return;
        console.error('Error fetching authenticated itinerary:', (error as Error)?.message);
        toastRef.current({
          title: 'Error',
          description: 'Failed to load itinerary. Please make sure you are logged in and have access.',
          variant: 'destructive',
        });
      })
      .finally(() => {
        if (!cancelled && requestId === requestIdRef.current) setLoading(false);
      });

    return () => {
      cancelled = true;
      handle.release();
    };
  }, [itineraryId, userId, budgetRefreshTrigger, mapRefreshTrigger]);

  return {
    itineraryData,
    loading,
    userRole,
    budgetRefreshTrigger,
    refreshBudgetData,
    refreshMapData,
    syncMapLocations,
    isUpdating,
    /** Lazy, owner-scoped snapshot loader for one opened cart item. */
    loadCartItemDetail,
    /** Snapshots loaded so far, keyed by cart item id. */
    cartItemDetails,
  };
};
