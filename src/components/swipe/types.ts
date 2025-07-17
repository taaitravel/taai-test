export interface SwipeItem {
  id: string;
  name: string;
  price: number;
  image?: string;
  description?: string;
  [key: string]: any;
}

export interface HotelSwipeItem extends SwipeItem {
  rating: number;
  location: string;
  checkIn: string;
  checkOut: string;
  amenities: string[];
  coordinates: { lat: number; lng: number };
  source: string;
}

export interface FlightSwipeItem extends SwipeItem {
  airline: string;
  flight_number: string;
  departure: string;
  arrival: string;
  from: string;
  to: string;
  duration?: string;
  cost: number;
}

export interface ActivitySwipeItem extends SwipeItem {
  location: string;
  city: string;
  date: string;
  duration: string;
  cost: number;
}

export interface RestaurantSwipeItem extends SwipeItem {
  location: string;
  city: string;
  cuisine: string;
  rating?: number;
  priceRange?: string;
  party_size?: number;
  date?: string;
  time?: string;
}

export type SwipeItemType = 'hotel' | 'flight' | 'activity' | 'restaurant';