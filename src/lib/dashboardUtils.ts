export const formatDateRange = (startDate: string, endDate: string) => {
  if (!startDate || !endDate) return 'Dates TBD';
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const formatOptions: Intl.DateTimeFormatOptions = { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  };
  
  return `${start.toLocaleDateString('en-US', formatOptions)} - ${end.toLocaleDateString('en-US', formatOptions)}`;
};

export const getItineraryStatus = (startDate: string, endDate: string) => {
  if (!startDate || !endDate) return 'planning';
  
  const today = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (today < start) return 'upcoming';
  if (today >= start && today <= end) return 'active';
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

  // Calculate total spending from past/current itineraries only
  const totalSpent = activeItineraries.reduce((sum, itinerary) => {
    const startDate = itinerary.itin_date_start;
    if (startDate && new Date(startDate) > today) return sum;
    const spending = Number(itinerary.spending) || 0;
    return sum + spending;
  }, 0);

  // Calculate projected spending from future itineraries
  const projectedSpend = activeItineraries.reduce((sum, itinerary) => {
    const startDate = itinerary.itin_date_start;
    if (!startDate || new Date(startDate) <= today) return sum;
    const spending = Number(itinerary.spending) || 0;
    return sum + spending;
  }, 0);

  return {
    totalTrips: activeItineraries.length,
    countriesVisited: visitedCountries.length,
    citiesVisited: uniqueCities.size,
    totalSpent,
    projectedSpend,
    flightsThisYear: Number(flightsThisYear),
    visitedCountries
  };
};