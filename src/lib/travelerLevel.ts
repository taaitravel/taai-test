/**
 * Determines the traveler level based on countries visited and flights per year.
 * Header badges and home cards both call this so a free account cannot show
 * two different ranks.
 */
export const getTravelerLevel = (countriesVisited: number = 0, flightsPerYear: number = 0): string => {
  if (countriesVisited >= 20 || flightsPerYear >= 50) return 'Master Traveler';
  if (countriesVisited >= 10 || flightsPerYear >= 25) return 'Explorer';
  if (countriesVisited >= 5 || flightsPerYear >= 10) return 'Adventurer';
  return 'Wanderer';
};

export function flightsFromProfile(flightFreq: unknown): number {
  if (!flightFreq || typeof flightFreq !== 'object') return 0;
  return Object.values(flightFreq as Record<string, unknown>).reduce<number>(
    (sum, flights) => sum + (Number(flights) || 0),
    0,
  );
}

export function travelerLevelFromProfile(profile: {
  countries_visited?: unknown;
  flight_freq?: unknown;
} | null | undefined): string {
  const countries = Array.isArray(profile?.countries_visited) ? profile.countries_visited.length : 0;
  return getTravelerLevel(countries, flightsFromProfile(profile?.flight_freq));
}