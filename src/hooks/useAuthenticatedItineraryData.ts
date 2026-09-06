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
  CART_DETAIL_FIELDS,
  PAGE_SIZES,
  assertSafeProjection,
} from "@/lib/data/projections";

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

const CART_PROJECTION = assertSafeProjection('cart detail', CART_DETAIL_FIELDS);

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

        return { row, role, isOwner, cartItems: (cartItems ?? []) as any[] };
      },
    });

    handle.promise
      .then(({ row, role, isOwner, cartItems }) => {
        if (cancelled || requestId !== requestIdRef.current) return;
        setUserRole(role);

        const byType = (type: string) => cartItems.filter(item => item.type === type);

        const cartFlights = byType('flight').map(item => ({
          ...(item.item_data as any),
          cost: item.price,
          booking_status: (item.item_data as any)?.bookingStatus || 'pending',
          from_cart: true,
          cart_id: item.id,
        }));

        const cartHotels = byType('hotel').map(item => {
          const itemData = (item.item_data as any) || {};
          const serviceDates = itemData.service_dates || {};
          const nights = Number(itemData.nights || 0);
          const rooms = Number(itemData.occupancy?.rooms || itemData.rooms || 1);
          return {
            ...itemData,
            check_in: itemData.check_in || serviceDates.check_in || serviceDates.checkIn || itemData.checkIn,
            check_out: itemData.check_out || serviceDates.check_out || serviceDates.checkOut || itemData.checkOut,
            cost: item.price,
            cost_per_night: Number(itemData.price_per_night || itemData.pricing?.price_per_night)
              || (nights > 0 && rooms > 0 ? item.price / (nights * rooms) : item.price),
            city: itemData.city || itemData.location?.city,
            booking_status: itemData.bookingStatus || 'pending',
            from_cart: true,
            cart_id: item.id,
          };
        });

        const cartActivities = byType('activity').map(item => ({
          ...(item.item_data as any),
          cost: item.price,
          city: (item.item_data as any)?.location?.city || (item.item_data as any)?.location,
          booking_status: (item.item_data as any)?.bookingStatus || 'pending',
          from_cart: true,
          cart_id: item.id,
        }));

        const cartReservations = byType('reservation').map(item => ({
          ...(item.item_data as any),
          cost: item.price,
          booking_status: (item.item_data as any)?.bookingStatus || 'pending',
          from_cart: true,
          cart_id: item.id,
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
  };
};
