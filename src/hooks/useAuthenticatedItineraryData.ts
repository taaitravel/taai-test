import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ItineraryData } from "@/types/itinerary";
import { useMapLocationSync } from "./useMapLocationSync";

export type UserRole = 'owner' | 'collaborator' | null;

export const useAuthenticatedItineraryData = (itineraryId: string | null) => {
  const [itineraryData, setItineraryData] = useState<ItineraryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [budgetRefreshTrigger, setBudgetRefreshTrigger] = useState(0);
  const [mapRefreshTrigger, setMapRefreshTrigger] = useState(0);
  const { toast } = useToast();
  const { syncMapLocations, isUpdating } = useMapLocationSync(itineraryId);

  const refreshBudgetData = () => {
    setBudgetRefreshTrigger(prev => prev + 1);
  };

  const refreshMapData = () => {
    setMapRefreshTrigger(prev => prev + 1);
  };

  useEffect(() => {
    const fetchAuthenticatedItinerary = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          throw new Error('User not authenticated');
        }

        // Don't filter by userid — RLS already handles access control
        const { data, error } = await supabase
          .from('itinerary')
          .select('*')
          .eq('id', parseInt(itineraryId!))
          .single();

        if (error) throw error;

        // Determine user role
        const isOwner = data.userid === user.id;
        let role: UserRole = isOwner ? 'owner' : null;

        if (!isOwner) {
          // Check attendee role
          const { data: attendeeData } = await supabase
            .from('itinerary_attendees')
            .select('role')
            .eq('itinerary_id', data.id)
            .eq('user_id', user.id)
            .eq('status', 'accepted')
            .single();

          role = attendeeData ? 'collaborator' : null;
        }

        setUserRole(role);

        // Fetch cart items — for owner fetch by itinerary, for collaborator fetch their own
        const cartQuery = supabase
          .from('cart_items')
          .select('*')
          .eq('itinerary_id', data.itin_id);

        if (!isOwner) {
          cartQuery.eq('user_id', user.id);
        }

        const { data: cartItems, error: cartError } = await cartQuery;

        if (cartError) {
          console.error('Error fetching cart items:', cartError);
        }

        // Separate cart items by type and include cart_id for editing/deleting
        const cartFlights = (cartItems?.filter(item => item.type === 'flight') || []).map(item => ({
          ...(item.item_data as any),
          cost: item.price,
          booking_status: (item.item_data as any)?.bookingStatus || 'pending',
          from_cart: true,
          cart_id: item.id
        }));

        const cartHotels = (cartItems?.filter(item => item.type === 'hotel') || []).map(item => ({
          ...(item.item_data as any),
          cost: item.price,
          city: (item.item_data as any)?.city || (item.item_data as any)?.location?.city,
          booking_status: (item.item_data as any)?.bookingStatus || 'pending',
          from_cart: true,
          cart_id: item.id
        }));

        const cartActivities = (cartItems?.filter(item => item.type === 'activity') || []).map(item => ({
          ...(item.item_data as any),
          cost: item.price,
          city: (item.item_data as any)?.location?.city || (item.item_data as any)?.location,
          booking_status: (item.item_data as any)?.bookingStatus || 'pending',
          from_cart: true,
          cart_id: item.id
        }));

        const cartReservations = (cartItems?.filter(item => item.type === 'reservation') || []).map(item => ({
          ...(item.item_data as any),
          cost: item.price,
          booking_status: (item.item_data as any)?.bookingStatus || 'pending',
          from_cart: true,
          cart_id: item.id
        }));

        // Calculate total spending from all cart items
        const totalSpending = cartItems?.reduce((sum, item) => sum + item.price, 0) || 0;
        
        // Only owner should update spending
        if (isOwner && totalSpending !== data.spending) {
          await supabase
            .from('itinerary')
            .update({ spending: totalSpending })
            .eq('id', data.id);
        }

        // Transform and enhance data with cart items
        const transformedData: ItineraryData = {
          ...data,
          itin_locations: data.itin_locations as string[],
          itin_map_locations: data.itin_map_locations as Array<{ city: string; lat: number; lng: number }>,
          attendees: data.attendees as Array<{ id: number; name: string; email: string; avatar: string; status: string }>,
          flights: [
            ...((data.flights as Array<any>)?.map(flight => ({
              ...flight,
              images: flight.images || [],
              booking_status: flight.booking_status || 'pending',
              expedia_property_id: flight.expedia_property_id,
              location: flight.location || flight.to,
              rating: flight.rating || 4.0
            })) || []),
            ...cartFlights
          ],
          hotels: [
            ...((data.hotels as Array<any>)?.map(hotel => ({
              ...hotel,
              images: hotel.images || [],
              booking_status: hotel.booking_status || 'pending',
              expedia_property_id: hotel.expedia_property_id,
              location: hotel.location || hotel.city,
              rating: hotel.rating || 4.0,
              price: hotel.price || hotel.cost
            })) || []),
            ...cartHotels
          ],
          activities: [
            ...((data.activities as Array<any>)?.map(activity => ({
              ...activity,
              images: activity.images || [],
              booking_status: activity.booking_status || 'pending',
              location: activity.location || activity.city,
              rating: activity.rating || 4.0,
              price: activity.price || activity.cost
            })) || []),
            ...cartActivities
          ],
          reservations: [
            ...((data.reservations as Array<any>)?.map(reservation => ({
              ...reservation,
              images: reservation.images || [],
              booking_status: reservation.booking_status || 'pending',
              location: reservation.location || reservation.city,
              cuisine: reservation.cuisine || 'International'
            })) || []),
            ...cartReservations
          ],
          expedia_data: data.expedia_data || {}
        };

        setItineraryData(transformedData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching authenticated itinerary:', error);
        toast({
          title: 'Error',
          description: 'Failed to load itinerary. Please make sure you are logged in and have access.',
          variant: 'destructive',
        });
        setLoading(false);
      }
    };

    if (itineraryId) {
      fetchAuthenticatedItinerary();
    }
  }, [itineraryId, budgetRefreshTrigger, mapRefreshTrigger, toast]);

  return {
    itineraryData,
    loading,
    userRole,
    budgetRefreshTrigger,
    refreshBudgetData,
    refreshMapData,
    syncMapLocations,
    isUpdating
  };
};
