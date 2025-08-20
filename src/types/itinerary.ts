export interface ItineraryData {
  id: number;
  itin_name: string;
  itin_desc: string;
  itin_date_start: string;
  itin_date_end: string;
  budget: number;
  spending: number;
  budget_rate: number;
  b_efficiency_rate: number;
  user_type: string;
  itin_locations: string[];
  itin_map_locations: Array<{ city: string; lat: number; lng: number }>;
  attendees: Array<{ id: number; name: string; email: string; avatar: string; status: string }>;
  flights: Array<{ 
    airline: string; 
    flight_number: string; 
    departure: string; 
    arrival: string; 
    from: string; 
    to: string; 
    cost: number;
    images?: string[];
    booking_status?: string;
    expedia_property_id?: string;
    location?: string;
    rating?: number;
  }>;
  hotels: Array<{ 
    name: string; 
    city: string; 
    check_in: string; 
    check_out: string; 
    nights: number; 
    cost: number; 
    rating: number;
    images?: string[];
    booking_status?: string;
    expedia_property_id?: string;
    location?: string;
    price?: number;
  }>;
  activities: Array<{ 
    name: string; 
    city: string; 
    date: string; 
    cost: number; 
    duration: string;
    images?: string[];
    booking_status?: string;
    location?: string;
    rating?: number;
    price?: number;
  }>;
  reservations: Array<{ 
    type: string; 
    name: string; 
    city: string; 
    date: string; 
    time: string; 
    party_size: number;
    images?: string[];
    booking_status?: string;
    location?: string;
    cuisine?: string;
  }>;
  expedia_data?: any;
}

export interface BrowserState {
  flightBrowserOpen: boolean;
  hotelBrowserOpen: boolean;
  activityBrowserOpen: boolean;
  reservationBrowserOpen: boolean;
  currentFlightIndex: number;
  currentHotelIndex: number;
  currentActivityIndex: number;
  currentReservationIndex: number;
}