import { useMemo } from "react";

export const useDashboardSections = (activeItineraries: any[]) => {
  const getNextTrip = useMemo(() => {
    const today = new Date();
    const upcomingTrips = activeItineraries
      .filter(trip => trip.itin_date_start && new Date(trip.itin_date_start) > today)
      .sort((a, b) => new Date(a.itin_date_start).getTime() - new Date(b.itin_date_start).getTime());
    
    return upcomingTrips[0] || null;
  }, [activeItineraries]);

  const tripStats = useMemo(() => {
    return {
      upcoming: activeItineraries.filter(trip => 
        ['planning', 'upcoming', 'active'].includes(trip.status)
      ).length,
      completed: activeItineraries.filter(trip => 
        trip.status === 'completed'
      ).length
    };
  }, [activeItineraries]);

  return {
    nextTrip: getNextTrip,
    tripStats
  };
};