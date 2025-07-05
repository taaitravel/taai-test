/**
 * Determines the traveler level based on countries visited and flights per year
 */
export const getTravelerLevel = (countriesVisited: number = 0, flightsPerYear: number = 0): string => {
  if (countriesVisited >= 20 || flightsPerYear >= 50) return 'Master Traveler';
  if (countriesVisited >= 10 || flightsPerYear >= 25) return 'Explorer';
  if (countriesVisited >= 5 || flightsPerYear >= 10) return 'Adventurer';
  return 'Wanderer';
};