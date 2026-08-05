import { asDateOnly, compareDateOnly, formatDateOnlyRange, localDateOnlyFromDate } from '@/lib/date-time';

export const formatDateRange = (startDate: string, endDate: string) => {
  return formatDateOnlyRange(startDate, endDate, 'MMM d, yyyy', 'MMM d, yyyy') || 'Dates TBD';
};

export const getItineraryStatus = (startDate: string, endDate: string) => {
  if (!startDate || !endDate) return 'planning';
  
  const today = localDateOnlyFromDate();
  const start = asDateOnly(startDate);
  const end = asDateOnly(endDate);
  if (!start || !end) return 'planning';
  if (compareDateOnly(today, start) < 0) return 'upcoming';
  if (compareDateOnly(today, start) >= 0 && compareDateOnly(today, end) <= 0) return 'active';
  return 'completed';
};

export const calculateUserStats = (activeItineraries: any[], userProfile: any) => {
  // Get visited countries from user profile
  const visitedCountries = Array.isArray(userProfile?.countries_visited) 
    ? userProfile.countries_visited as string[] 
    : [];

  // Calculate flights this year from user profile
  const flightsThisYear = userProfile?.flight_freq && typeof userProfile.flight_freq === 'object' 
    ? Object.values(userProfile.flight_freq).reduce((sum: number, flights: any) => sum + (Number(flights) || 0), 0)
    : 0;

  // Count unique cities from all itineraries
  const uniqueCities = new Set();
  activeItineraries.forEach(itinerary => {
    if (Array.isArray(itinerary.locations)) {
      itinerary.locations.forEach((location: string) => uniqueCities.add(location));
    }
  });

  const today = new Date();

  // Calculate total spending from fully completed itineraries only
  const totalSpent = activeItineraries.reduce((sum, itinerary) => {
    const endDate = itinerary.itin_date_end;
    if (!endDate || new Date(endDate) >= today) return sum;
    const spending = Number(itinerary.spending) || 0;
    return sum + spending;
  }, 0);

  // Calculate projected spending from active + future itineraries (end date not yet passed)
  const projectedSpend = activeItineraries.reduce((sum, itinerary) => {
    const endDate = itinerary.itin_date_end;
    if (!endDate || new Date(endDate) < today) return sum;
    const spending = Number(itinerary.spending) || 0;
    return sum + spending;
  }, 0);

  return {
    totalTrips: activeItineraries.length,
    countriesVisited: visitedCountries.length,
    citiesVisited: uniqueCities.size,
    totalSpent,
    projectedSpend,
    lifetimeTotal: totalSpent + projectedSpend,
    flightsThisYear: Number(flightsThisYear),
    visitedCountries
  };
};
