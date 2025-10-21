import { useState } from 'react';
import { useExpediaAPI } from './useExpediaAPI';
import { useToast } from '@/hooks/use-toast';

export type SearchType = 'flights' | 'hotels' | 'cars' | 'activities' | 'packages';

// Mock data generators (fallback when API fails)
const generateMockHotels = (destination: string) => [
  {
    id: 1,
    name: `${destination} Grand Hotel`,
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
    price: 189,
    rating: 4.5,
    location: destination,
    amenities: ['WiFi', 'Pool', 'Spa', 'Restaurant'],
  },
  {
    id: 2,
    name: `${destination} Beach Resort`,
    image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800',
    price: 249,
    rating: 4.7,
    location: destination,
    amenities: ['Beach Access', 'WiFi', 'Pool', 'Bar'],
  },
  {
    id: 3,
    name: `${destination} City Center Inn`,
    image: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800',
    price: 129,
    rating: 4.2,
    location: destination,
    amenities: ['WiFi', 'Parking', 'Restaurant'],
  },
  {
    id: 4,
    name: `${destination} Boutique Hotel`,
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800',
    price: 299,
    rating: 4.8,
    location: destination,
    amenities: ['Luxury Spa', 'Rooftop Bar', 'WiFi', 'Concierge'],
  },
  {
    id: 5,
    name: `${destination} Budget Suites`,
    image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800',
    price: 89,
    rating: 3.9,
    location: destination,
    amenities: ['WiFi', 'Parking'],
  },
  {
    id: 6,
    name: `${destination} Waterfront Hotel`,
    image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800',
    price: 219,
    rating: 4.6,
    location: destination,
    amenities: ['Waterfront View', 'WiFi', 'Restaurant', 'Gym'],
  },
];

const generateMockFlights = (origin: string, destination: string, searchParams?: any) => {
  const baseDate = searchParams?.checkin ? new Date(searchParams.checkin) : new Date();
  
  return [
    {
      id: 1,
      airline: 'United Airlines',
      flight_number: 'UA 1247',
      departure: new Date(baseDate.setHours(8, 0, 0, 0)).toISOString(),
      arrival: new Date(baseDate.setHours(11, 30, 0, 0)).toISOString(),
      from: origin,
      to: destination,
      price: 289,
      duration: '3h 30m',
      stops: 0,
      class: 'Economy',
      aircraft: 'Boeing 737',
    },
    {
      id: 2,
      airline: 'Delta',
      flight_number: 'DL 523',
      departure: new Date(baseDate.setHours(10, 15, 0, 0)).toISOString(),
      arrival: new Date(baseDate.setHours(14, 0, 0, 0)).toISOString(),
      from: origin,
      to: destination,
      price: 259,
      duration: '3h 45m',
      stops: 0,
      class: 'Economy',
      aircraft: 'Airbus A320',
    },
    {
      id: 3,
      airline: 'American Airlines',
      flight_number: 'AA 892',
      departure: new Date(baseDate.setHours(13, 30, 0, 0)).toISOString(),
      arrival: new Date(baseDate.setHours(19, 15, 0, 0)).toISOString(),
      from: origin,
      to: destination,
      price: 189,
      duration: '5h 45m',
      stops: 1,
      class: 'Economy',
      aircraft: 'Boeing 787',
    },
    {
      id: 4,
      airline: 'Southwest',
      flight_number: 'WN 1456',
      departure: new Date(baseDate.setHours(6, 0, 0, 0)).toISOString(),
      arrival: new Date(baseDate.setHours(9, 30, 0, 0)).toISOString(),
      from: origin,
      to: destination,
      price: 219,
      duration: '3h 30m',
      stops: 0,
      class: 'Economy',
      aircraft: 'Boeing 737',
    },
  ];
};

const generateMockActivities = (destination: string) => [
  {
    id: 1,
    name: `${destination} City Tour`,
    image: 'https://images.unsplash.com/photo-1569949381669-ecf31ae8e613?w=800',
    price: 49,
    rating: 4.6,
    duration: '3 hours',
    description: 'Explore the best landmarks and attractions',
  },
  {
    id: 2,
    name: `${destination} Food Walking Tour`,
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
    price: 79,
    rating: 4.8,
    duration: '4 hours',
    description: 'Taste local cuisine and discover hidden gems',
  },
  {
    id: 3,
    name: `${destination} Sunset Cruise`,
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800',
    price: 99,
    rating: 4.7,
    duration: '2 hours',
    description: 'Beautiful sunset views from the water',
  },
  {
    id: 4,
    name: `${destination} Museum Pass`,
    image: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=800',
    price: 35,
    rating: 4.4,
    duration: 'Full day',
    description: 'Access to major museums and galleries',
  },
  {
    id: 5,
    name: `${destination} Adventure Park`,
    image: 'https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=800',
    price: 65,
    rating: 4.5,
    duration: '5 hours',
    description: 'Thrilling rides and outdoor activities',
  },
];

export const useSearchOrchestrator = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [searchType, setSearchType] = useState<SearchType | null>(null);

  const { searchHotels, searchFlights, searchActivities } = useExpediaAPI();
  const { toast } = useToast();

  const executeSearch = async (type: SearchType, params: any) => {
    setLoading(true);
    setResults([]);
    setSearchType(type);

    try {
      let searchResults: any[] = [];

      switch (type) {
        case 'hotels': {
          const { data, error } = await searchHotels({
            destination: params.destination,
            checkin: params.checkin,
            checkout: params.checkout,
            adults: params.adults || 2,
            rooms: params.rooms || 1,
          });

          if (error || !data?.hotels || data.hotels.length === 0) {
            console.log('🏨 API failed or no results, using mock hotel data');
            searchResults = generateMockHotels(params.destination || 'this destination');
            toast({
              title: 'Showing Sample Results',
              description: 'API unavailable - displaying example hotels',
            });
          } else {
            searchResults = data.hotels;
          }
          break;
        }

        case 'flights': {
          const { data, error } = await searchFlights({
            origin: params.origin,
            destination: params.destination,
            departure_date: params.checkin,
            return_date: params.checkout,
            adults: params.adults || 1,
          });

          if (error || !data?.flights || data.flights.length === 0) {
            console.log('✈️ API failed or no results, using mock flight data');
            searchResults = generateMockFlights(params.origin || 'Origin', params.destination || 'Destination', params);
            toast({
              title: 'Showing Sample Results',
              description: 'API unavailable - displaying example flights',
            });
          } else {
            searchResults = data.flights;
          }
          break;
        }

        case 'activities': {
          const { data, error } = await searchActivities({
            destination: params.destination,
            date: params.checkin,
          });

          if (error || !data?.activities || data.activities.length === 0) {
            console.log('🎯 API failed or no results, using mock activity data');
            searchResults = generateMockActivities(params.destination || 'this destination');
            toast({
              title: 'Showing Sample Results',
              description: 'API unavailable - displaying example activities',
            });
          } else {
            searchResults = data.activities;
          }
          break;
        }

        case 'cars': {
          // Mock car results for now
          searchResults = [
            {
              id: 'car-1',
              name: 'Economy Car',
              company: 'Enterprise',
              type: 'Economy',
              price: 45,
              image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400',
            },
            {
              id: 'car-2',
              name: 'SUV',
              company: 'Hertz',
              type: 'SUV',
              price: 85,
              image: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=400',
            },
          ];
          break;
        }

        case 'packages': {
          // Search hotels and flights in parallel for packages
          const [hotelResponse, flightResponse] = await Promise.all([
            searchHotels({
              destination: params.destination,
              checkin: params.checkin,
              checkout: params.checkout,
              adults: params.adults || 2,
              rooms: params.rooms || 1,
            }),
            searchFlights({
              origin: params.origin,
              destination: params.destination,
              departure_date: params.checkin,
              return_date: params.checkout,
              adults: params.adults || 1,
            }),
          ]);

          const hotels = hotelResponse.data?.hotels || [];
          const flights = flightResponse.data?.flights || [];

          searchResults = hotels.slice(0, 5).map((hotel: any, idx: number) => ({
            id: `package-${idx}`,
            hotel,
            flight: flights[idx % flights.length],
            car: params.includeCar ? {
              type: 'Economy',
              price: Math.floor(Math.random() * 100) + 50,
              company: 'Enterprise',
            } : null,
            totalPrice:
              (hotel.price || 0) +
              (flights[idx % flights.length]?.price || 0) +
              (params.includeCar ? Math.floor(Math.random() * 100) + 50 : 0),
          }));

          if (hotelResponse.error || flightResponse.error) {
            toast({
              title: 'Package Search Failed',
              description: hotelResponse.error || flightResponse.error,
              variant: 'destructive',
            });
          }
          break;
        }
      }

      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: 'Search Failed',
        description: 'An error occurred while searching. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return { results, loading, searchType, executeSearch };
};
