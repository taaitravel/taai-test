import { useState, useMemo } from 'react';
import { HotelFilterState } from '@/components/search/HotelFilters';

export const useHotelFilters = (results: any[]) => {
  const [filters, setFilters] = useState<HotelFilterState>({
    priceRange: [0, 1000],
    starRatings: [],
    amenities: [],
    guestRating: 0,
  });

  const maxPrice = useMemo(() => {
    if (results.length === 0) return 1000;
    const prices = results.map((h: any) => h.min_total_price || h.price || 0);
    return Math.max(...prices, 1000);
  }, [results]);

  const filteredResults = useMemo(() => {
    return results.filter((hotel: any) => {
      const price = hotel.min_total_price || hotel.price || 0;
      if (price < filters.priceRange[0] || price > filters.priceRange[1]) {
        return false;
      }

      if (filters.starRatings.length > 0) {
        const hotelRating = hotel.class || hotel.rating || 0;
        if (!filters.starRatings.includes(Math.round(hotelRating))) {
          return false;
        }
      }

      if (filters.guestRating > 0) {
        const guestRating = hotel.review_score || hotel.guestRating || 0;
        if (guestRating < filters.guestRating) {
          return false;
        }
      }

      if (filters.amenities.length > 0) {
        const hotelAmenities = hotel.amenities || hotel.hotel_facilities || [];
        const hasAllAmenities = filters.amenities.every(amenity => 
          hotelAmenities.some((a: string) => 
            a.toLowerCase().includes(amenity.toLowerCase())
          )
        );
        if (!hasAllAmenities) {
          return false;
        }
      }

      return true;
    });
  }, [results, filters]);

  return {
    filters,
    setFilters,
    maxPrice,
    filteredResults,
  };
};
