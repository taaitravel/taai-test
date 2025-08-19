import { useState, useEffect } from 'react';
import { EnhancedHotelItem, EnhancedFlightItem, EnhancedActivityItem, EnhancedReservationItem } from '@/types/enhanced-itinerary';

// Mock realistic Expedia data for demonstration
export const useMockExpediaData = () => {
  const [mockHotels, setMockHotels] = useState<EnhancedHotelItem[]>([]);
  const [mockFlights, setMockFlights] = useState<EnhancedFlightItem[]>([]);
  const [mockActivities, setMockActivities] = useState<EnhancedActivityItem[]>([]);
  const [mockReservations, setMockReservations] = useState<EnhancedReservationItem[]>([]);

  useEffect(() => {
    // Mock enhanced hotel data
    setMockHotels([
      {
        id: "hotel_1",
        name: "Room Mate Waldorf Towers",
        city: "Miami",
        location: "South Beach, Miami Beach",
        expedia_property_id: "13176",
        booking_reference: "EXP-HTL-001-2024",
        images: [
          "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&h=300&fit=crop",
          "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=500&h=300&fit=crop",
          "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=500&h=300&fit=crop"
        ],
        rating: 4.5,
        amenities: ["Pool", "Spa", "Gym", "WiFi", "Restaurant", "Bar"],
        check_in: "2025-12-11",
        check_out: "2025-12-14",
        nights: 3,
        cost: 350,
        base_cost: 300,
        taxes: 30,
        fees: 20,
        booking_status: "confirmed",
        payment_status: "paid",
        coordinates: { lat: 25.7617, lng: -80.1918 },
        description: "Luxurious Art Deco hotel in the heart of South Beach with stunning ocean views and world-class amenities.",
        review_score: 8.7,
        review_count: 2847,
        cancellation_policy: "Free cancellation until 24 hours before check-in",
        source: "expedia"
      },
      {
        id: "hotel_2", 
        name: "The Standard Spa Miami Beach",
        city: "Miami",
        location: "Belle Isle, Miami Beach",
        expedia_property_id: "15432",
        booking_reference: "EXP-HTL-002-2024",
        images: [
          "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=500&h=300&fit=crop",
          "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=500&h=300&fit=crop"
        ],
        rating: 4.2,
        amenities: ["Spa", "Pool", "Restaurant", "Bar", "Fitness Center"],
        check_in: "2025-12-14",
        check_out: "2025-12-17",
        nights: 3,
        cost: 420,
        base_cost: 380,
        taxes: 25,
        fees: 15,
        booking_status: "pending",
        payment_status: "partial",
        coordinates: { lat: 25.7825, lng: -80.1456 },
        description: "Trendy spa resort on Belle Isle with holistic wellness programs and waterfront dining.",
        review_score: 8.4,
        review_count: 1923,
        source: "expedia"
      }
    ]);

    // Mock enhanced flight data
    setMockFlights([
      {
        id: "flight_1",
        airline: "American Airlines",
        flight_number: "AA1234",
        departure: "2025-12-11T08:30:00",
        arrival: "2025-12-11T11:45:00",
        from: "JFK",
        to: "MIA",
        booking_reference: "EXP-FLT-001-2024",
        images: ["https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=500&h=300&fit=crop"],
        aircraft_type: "Boeing 737-800",
        seat_class: "Economy Plus",
        cost: 450,
        base_cost: 380,
        taxes: 50,
        fees: 20,
        booking_status: "confirmed",
        payment_status: "paid",
        duration: "3h 15m",
        stops: 0,
        baggage_included: ["Carry-on", "Personal item"],
        meal_service: true,
        wifi_available: true
      },
      {
        id: "flight_2",
        airline: "Delta",
        flight_number: "DL5678",
        departure: "2025-12-26T14:20:00",
        arrival: "2025-12-26T18:05:00",
        from: "MIA",
        to: "JFK",
        booking_reference: "EXP-FLT-002-2024",
        aircraft_type: "Airbus A321",
        seat_class: "Main Cabin",
        cost: 485,
        base_cost: 420,
        taxes: 45,
        fees: 20,
        booking_status: "confirmed",
        payment_status: "paid",
        duration: "3h 45m",
        stops: 0,
        baggage_included: ["Carry-on"],
        meal_service: false,
        wifi_available: true
      }
    ]);

    // Mock enhanced activity data
    setMockActivities([
      {
        id: "activity_1",
        name: "Art Deco Walking Tour",
        city: "Miami",
        location: "South Beach Historic District",
        booking_reference: "EXP-ACT-001-2024",
        images: [
          "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500&h=300&fit=crop",
          "https://images.unsplash.com/photo-1533106497176-45ae19e68ba2?w=500&h=300&fit=crop"
        ],
        category: "Cultural",
        provider: "Miami Beach Tours",
        date: "2025-12-12",
        duration: "2 hours",
        cost: 85,
        base_cost: 75,
        taxes: 5,
        fees: 5,
        booking_status: "confirmed",
        payment_status: "paid",
        description: "Explore the iconic Art Deco architecture of South Beach with a certified local guide.",
        rating: 4.8,
        difficulty_level: "Easy",
        min_age: 8,
        max_participants: 15,
        cancellation_policy: "Free cancellation up to 24 hours before",
        coordinates: { lat: 25.7811, lng: -80.1303 }
      },
      {
        id: "activity_2",
        name: "Everglades Airboat Adventure",
        city: "Miami",
        location: "Everglades National Park",
        booking_reference: "EXP-ACT-002-2024",
        images: [
          "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=500&h=300&fit=crop",
          "https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=500&h=300&fit=crop"
        ],
        category: "Adventure",
        provider: "Everglades Tours",
        date: "2025-12-15",
        duration: "4 hours",
        cost: 120,
        base_cost: 100,
        taxes: 10,
        fees: 10,
        booking_status: "pending",
        payment_status: "unpaid",
        description: "Thrilling airboat ride through the Everglades with wildlife spotting and educational tour.",
        rating: 4.6,
        difficulty_level: "Moderate",
        min_age: 12,
        max_participants: 12,
        coordinates: { lat: 25.4400, lng: -80.6100 }
      }
    ]);

    // Mock enhanced reservation data
    setMockReservations([
      {
        id: "reservation_1",
        type: "restaurant",
        name: "Joe's Stone Crab",
        city: "Miami",
        booking_reference: "EXP-RES-001-2024",
        images: [
          "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=500&h=300&fit=crop",
          "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=500&h=300&fit=crop"
        ],
        cuisine: "Seafood",
        dress_code: "Smart Casual",
        date: "2025-12-13",
        time: "19:30",
        party_size: 4,
        booking_status: "confirmed",
        description: "Iconic Miami Beach restaurant famous for its stone crab and classic American seafood dishes.",
        rating: 4.7,
        price_range: "$$$",
        special_requests: "Window table requested",
        coordinates: { lat: 25.7663, lng: -80.1310 }
      },
      {
        id: "reservation_2",
        type: "restaurant",
        name: "Zuma Miami",
        city: "Miami",
        booking_reference: "EXP-RES-002-2024",
        images: [
          "https://images.unsplash.com/photo-1579952363873-27d3bfad9c0d?w=500&h=300&fit=crop"
        ],
        cuisine: "Japanese",
        dress_code: "Upscale Casual",
        date: "2025-12-16",
        time: "20:00",
        party_size: 2,
        booking_status: "pending",
        description: "Contemporary Japanese restaurant offering innovative robatayaki cuisine in a sophisticated setting.",
        rating: 4.5,
        price_range: "$$$$",
        coordinates: { lat: 25.7751, lng: -80.1888 }
      }
    ]);
  }, []);

  return {
    mockHotels,
    mockFlights,
    mockActivities,
    mockReservations
  };
};