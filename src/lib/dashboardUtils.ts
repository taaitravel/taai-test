import { asDateOnly, compareDateOnly, formatDateOnlyRange, localDateOnlyFromDate } from '@/lib/date-time';
import { flightsFromProfile } from '@/lib/travelerLevel';
import { classifyTripPhase } from '@/lib/dashboard/trip-phase';

export const formatDateRange = (startDate: string, endDate: string) => {
  return formatDateOnlyRange(startDate, endDate, 'MMM d, yyyy', 'MMM d, yyyy') || 'Dates TBD';
};

export const getItineraryStatus = (startDate: string, endDate: string, today = localDateOnlyFromDate()) => {
  return classifyTripPhase(startDate, endDate, today);
};

interface StatsTrip {
  itin_locations?: unknown;
  locations?: unknown;
}

interface StatsProfile {
  countries_visited?: unknown;
  flight_freq?: unknown;
}

export const calculateUserStats = (activeItineraries: StatsTrip[] | null | undefined, userProfile: StatsProfile | null | undefined) => {
  const trips = Array.isArray(activeItineraries) ? activeItineraries : [];
  const visitedCountries = Array.isArray(userProfile?.countries_visited)
    ? (userProfile.countries_visited as unknown[]).filter((country): country is string => typeof country === 'string' && country.trim().length > 0)
    : [];

  const locationNames = new Set<string>();
  trips.forEach((itinerary) => {
    const locations = Array.isArray(itinerary.itin_locations)
      ? itinerary.itin_locations
      : Array.isArray(itinerary.locations)
        ? itinerary.locations
        : [];
    locations.forEach((location: unknown) => {
      if (typeof location === 'string' && location.trim()) locationNames.add(location.trim());
    });
  });

  return {
    totalTrips: trips.length,
    countriesVisited: visitedCountries.length,
    citiesVisited: locationNames.size,
    profileFlightFrequency: Number(flightsFromProfile(userProfile?.flight_freq)) || 0,
    visitedCountries,
  };
};

export { asDateOnly, compareDateOnly };
