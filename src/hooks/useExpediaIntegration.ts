import { useState, useCallback } from 'react';
import { useExpediaAPI } from '@/hooks/useExpediaAPI';
import { HotelSwipeItem, FlightSwipeItem, ActivitySwipeItem } from '@/components/swipe/types';
import { useToast } from '@/components/ui/use-toast';

interface UseExpediaIntegrationReturn {
  loading: boolean;
  fetchHotelsForLocation: (location: string, checkin?: string, checkout?: string) => Promise<HotelSwipeItem[]>;
  fetchFlightsForRoute: (origin: string, destination: string, departureDate?: string) => Promise<FlightSwipeItem[]>;
  fetchActivitiesForLocation: (location: string) => Promise<ActivitySwipeItem[]>;
}

export const useExpediaIntegration = (): UseExpediaIntegrationReturn => {
  const [loading, setLoading] = useState(false);
  const { searchHotels, searchFlights, searchActivities } = useExpediaAPI();
  const { toast } = useToast();

  const fetchHotelsForLocation = useCallback(async (
    location: string,
    checkin?: string,
    checkout?: string
  ): Promise<HotelSwipeItem[]> => {
    setLoading(true);
    try {
      // Default to 3 days from now for check-in, 5 days for check-out
      const defaultCheckin = checkin || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const defaultCheckout = checkout || new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const response = await searchHotels({
        destination: location,
        checkin: defaultCheckin,
        checkout: defaultCheckout,
        adults: 2,
        rooms: 1
      });

      if (response.error || !response.data) {
        console.error('Failed to fetch hotels:', response.error);
        return [];
      }

      // Transform Expedia hotel response to HotelSwipeItem format
      const hotels = response.data.hotels || response.data.results || [];
      return hotels.slice(0, 20).map((hotel: any, index: number): HotelSwipeItem => ({
        id: hotel.id || `hotel-${index}`,
        name: hotel.name || hotel.title || `Hotel ${index + 1}`,
        location: hotel.location || hotel.address || location,
        rating: hotel.rating || hotel.starRating || Math.floor(Math.random() * 2) + 4,
        price: hotel.price || hotel.displayPrice || hotel.rates?.displayRate || '$150',
        image: hotel.image || hotel.thumbnailUrl || hotel.images?.[0]?.url || '/placeholder.svg',
        amenities: hotel.amenities || ['WiFi', 'Pool', 'Gym'],
        description: hotel.description || hotel.overview || 'Comfortable accommodation',
        checkIn: defaultCheckin,
        checkOut: defaultCheckout,
        source: 'expedia',
        coordinates: {
          lat: hotel.latitude || hotel.coordinates?.lat || 0,
          lng: hotel.longitude || hotel.coordinates?.lng || 0
        },
        cost: parseFloat((hotel.price || hotel.displayPrice || '150').replace(/[^0-9.]/g, '')) || 150
      }));
    } catch (error) {
      console.error('Error fetching hotels:', error);
      toast({
        title: "Hotel Search Error",
        description: "Failed to fetch hotels from Expedia",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [searchHotels, toast]);

  const fetchFlightsForRoute = useCallback(async (
    origin: string,
    destination: string,
    departureDate?: string
  ): Promise<FlightSwipeItem[]> => {
    setLoading(true);
    try {
      const defaultDeparture = departureDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const response = await searchFlights({
        origin,
        destination,
        departure_date: defaultDeparture,
        adults: 1
      });

      if (response.error || !response.data) {
        console.error('Failed to fetch flights:', response.error);
        return [];
      }

      // Transform Expedia flight response to FlightSwipeItem format
      const flights = response.data.flights || response.data.results || [];
      return flights.slice(0, 20).map((flight: any, index: number): FlightSwipeItem => ({
        id: flight.id || `flight-${index}`,
        name: `${flight.airline || `Airline ${index + 1}`} - ${flight.flightNumber || flight.number || `FL${1000 + index}`}`,
        airline: flight.airline || flight.carrier || `Airline ${index + 1}`,
        flightNumber: flight.flightNumber || flight.number || `FL${1000 + index}`,
        flight_number: flight.flightNumber || flight.number || `FL${1000 + index}`,
        origin: {
          code: flight.origin?.code || origin,
          name: flight.origin?.name || origin,
          time: flight.departureTime || flight.departure || '10:00 AM'
        },
        destination: {
          code: flight.destination?.code || destination,
          name: flight.destination?.name || destination,
          time: flight.arrivalTime || flight.arrival || '2:00 PM'
        },
        departure: flight.departureTime || flight.departure || '10:00 AM',
        arrival: flight.arrivalTime || flight.arrival || '2:00 PM',
        from: flight.origin?.name || origin,
        to: flight.destination?.name || destination,
        duration: flight.duration || '4h 0m',
        price: parseFloat((flight.price || flight.displayPrice || '300').replace(/[^0-9.]/g, '')) || 300,
        stops: flight.stops || 0,
        aircraft: flight.aircraft || flight.plane || 'Boeing 737',
        coordinates: {
          originLat: flight.originCoordinates?.lat || 0,
          originLng: flight.originCoordinates?.lng || 0,
          destinationLat: flight.destinationCoordinates?.lat || 0,
          destinationLng: flight.destinationCoordinates?.lng || 0
        },
        cost: parseFloat((flight.price || flight.displayPrice || '300').replace(/[^0-9.]/g, '')) || 300
      }));
    } catch (error) {
      console.error('Error fetching flights:', error);
      toast({
        title: "Flight Search Error",
        description: "Failed to fetch flights from Expedia",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [searchFlights, toast]);

  const fetchActivitiesForLocation = useCallback(async (
    location: string
  ): Promise<ActivitySwipeItem[]> => {
    setLoading(true);
    try {
      const response = await searchActivities({
        destination: location
      });

      if (response.error || !response.data) {
        console.error('Failed to fetch activities:', response.error);
        return [];
      }

      // Transform Expedia activity response to ActivitySwipeItem format
      const activities = response.data.activities || response.data.results || [];
      return activities.slice(0, 20).map((activity: any, index: number): ActivitySwipeItem => ({
        id: activity.id || `activity-${index}`,
        name: activity.name || activity.title || `Activity ${index + 1}`,
        location: activity.location || activity.address || location,
        city: location,
        category: activity.category || activity.type || 'Entertainment',
        rating: activity.rating || Math.floor(Math.random() * 2) + 4,
        price: activity.price || activity.displayPrice || '$50',
        image: activity.image || activity.thumbnailUrl || activity.images?.[0]?.url || '/placeholder.svg',
        duration: activity.duration || '2 hours',
        description: activity.description || activity.overview || 'Exciting activity',
        highlights: activity.highlights || activity.features || ['Popular attraction', 'Great for families'],
        date: new Date().toISOString().split('T')[0],
        coordinates: {
          lat: activity.latitude || activity.coordinates?.lat || 0,
          lng: activity.longitude || activity.coordinates?.lng || 0
        },
        cost: parseFloat((activity.price || activity.displayPrice || '50').replace(/[^0-9.]/g, '')) || 50
      }));
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast({
        title: "Activity Search Error",
        description: "Failed to fetch activities from Expedia",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [searchActivities, toast]);

  return {
    loading,
    fetchHotelsForLocation,
    fetchFlightsForRoute,
    fetchActivitiesForLocation
  };
};