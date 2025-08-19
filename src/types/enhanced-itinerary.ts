// Enhanced types for Expedia integration and financial tracking
export interface ExpediaBookingData {
  id: string;
  expedia_property_id?: string;
  booking_reference: string;
  booking_type: 'hotel' | 'flight' | 'activity' | 'car_rental';
  
  // Financial details
  base_cost: number;
  taxes: number;
  fees: number;
  total_amount: number;
  commission_rate: number;
  commission_amount: number;
  currency: string;
  
  // Booking details
  booking_details: any;
  images: string[];
  expedia_data: any;
  
  // Status
  booking_status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  payment_status: 'unpaid' | 'partial' | 'paid' | 'refunded';
  
  // Dates
  booking_date: string;
  service_start_date?: string;
  service_end_date?: string;
}

export interface EnhancedHotelItem {
  id: string;
  name: string;
  city: string;
  location: string;
  
  // Enhanced Expedia data
  expedia_property_id?: string;
  booking_reference?: string;
  images: string[];
  rating: number;
  amenities: string[];
  
  // Dates and pricing
  check_in: string;
  check_out: string;
  nights: number;
  cost: number;
  base_cost?: number;
  taxes?: number;
  fees?: number;
  
  // Booking status
  booking_status?: string;
  payment_status?: string;
  
  // Location data
  coordinates: { lat: number; lng: number };
  
  // Additional details
  description?: string;
  review_score?: number;
  review_count?: number;
  cancellation_policy?: string;
  source: string;
}

export interface EnhancedFlightItem {
  id: string;
  airline: string;
  flight_number: string;
  departure: string;
  arrival: string;
  from: string;
  to: string;
  
  // Enhanced data
  booking_reference?: string;
  images?: string[];
  aircraft_type?: string;
  seat_class?: string;
  
  // Pricing
  cost: number;
  base_cost?: number;
  taxes?: number;
  fees?: number;
  
  // Status
  booking_status?: string;
  payment_status?: string;
  
  // Additional details
  duration?: string;
  stops?: number;
  baggage_included?: string[];
  meal_service?: boolean;
  wifi_available?: boolean;
}

export interface EnhancedActivityItem {
  id: string;
  name: string;
  city: string;
  location: string;
  
  // Enhanced data
  booking_reference?: string;
  images: string[];
  category?: string;
  provider?: string;
  
  // Dates and pricing
  date: string;
  duration: string;
  cost: number;
  base_cost?: number;
  taxes?: number;
  fees?: number;
  
  // Status
  booking_status?: string;
  payment_status?: string;
  
  // Additional details
  description?: string;
  rating?: number;
  difficulty_level?: string;
  min_age?: number;
  max_participants?: number;
  cancellation_policy?: string;
  coordinates: { lat: number; lng: number };
}

export interface EnhancedReservationItem {
  id: string;
  type: string;
  name: string;
  city: string;
  
  // Enhanced data
  booking_reference?: string;
  images?: string[];
  cuisine?: string;
  dress_code?: string;
  
  // Dates and details
  date: string;
  time: string;
  party_size: number;
  
  // Status
  booking_status?: string;
  
  // Additional details
  description?: string;
  rating?: number;
  price_range?: string;
  special_requests?: string;
  coordinates?: { lat: number; lng: number };
}

export interface BusinessMetrics {
  total_bookings: number;
  total_revenue: number;
  total_commissions: number;
  conversion_rate: number;
  avg_booking_value: number;
  popular_destinations: Array<{ city: string; count: number; revenue: number }>;
  booking_trends: Array<{ date: string; count: number; revenue: number }>;
}

// Enhanced itinerary data with financial tracking
export interface EnhancedItineraryData {
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
  
  // Enhanced arrays with full booking data
  flights: EnhancedFlightItem[];
  hotels: EnhancedHotelItem[];
  activities: EnhancedActivityItem[];
  reservations: EnhancedReservationItem[];
  
  // Financial summary
  total_bookings_cost?: number;
  total_commission_earned?: number;
  outstanding_payments?: number;
}