import { supabase } from "@/integrations/supabase/client";

/**
 * Updates the user's countries_visited list with new countries from an itinerary
 */
export const updateUserCountriesVisited = async (userId: string, newCountries: string[]) => {
  try {
    // First, get the current user profile
    const { data: profile, error: fetchError } = await supabase
      .from('users')
      .select('countries_visited')
      .eq('userid', userId)
      .single();

    if (fetchError) {
      console.error('Error fetching user profile:', fetchError);
      return { error: fetchError };
    }

    // Get existing countries or start with empty array
    const existingCountries = Array.isArray(profile?.countries_visited) 
      ? profile.countries_visited as string[]
      : [];
    
    // Add new countries that aren't already in the list
    const uniqueNewCountries = newCountries.filter(country => 
      !existingCountries.includes(country)
    );

    if (uniqueNewCountries.length === 0) {
      // No new countries to add
      return { success: true };
    }

    // Update the user's countries_visited list
    const updatedCountries = [...existingCountries, ...uniqueNewCountries];
    
    const { error: updateError } = await supabase
      .from('users')
      .update({ countries_visited: updatedCountries })
      .eq('userid', userId);

    if (updateError) {
      console.error('Error updating countries visited:', updateError);
      return { error: updateError };
    }

    return { 
      success: true, 
      addedCountries: uniqueNewCountries,
      totalCountries: updatedCountries.length 
    };
  } catch (error) {
    console.error('Error in updateUserCountriesVisited:', error);
    return { error };
  }
};

/**
 * Extracts country names from location strings
 * This is a simple implementation - you might want to use a more sophisticated
 * location parsing service for production
 */
export const extractCountriesFromLocations = (locations: string[]): string[] => {
  const countryMapping: { [key: string]: string } = {
    // Cities to countries mapping
    'Paris': 'France',
    'London': 'United Kingdom',
    'Rome': 'Italy',
    'Madrid': 'Spain',
    'Berlin': 'Germany',
    'Tokyo': 'Japan',
    'New York': 'United States',
    'Los Angeles': 'United States',
    'Miami': 'United States',
    'Chicago': 'United States',
    'Toronto': 'Canada',
    'Vancouver': 'Canada',
    'Sydney': 'Australia',
    'Melbourne': 'Australia',
    'São Paulo': 'Brazil',
    'Rio de Janeiro': 'Brazil',
    'Bangkok': 'Thailand',
    'Singapore': 'Singapore',
    'Mumbai': 'India',
    'Delhi': 'India',
    'Shanghai': 'China',
    'Beijing': 'China',
    'Mexico City': 'Mexico',
    'Amsterdam': 'Netherlands',
    'Zurich': 'Switzerland',
    'Vienna': 'Austria',
    'Oslo': 'Norway',
    'Stockholm': 'Sweden',
    'Copenhagen': 'Denmark',
    'Brussels': 'Belgium',
    'Prague': 'Czech Republic',
    'Warsaw': 'Poland',
    'Istanbul': 'Turkey',
    'Athens': 'Greece',
    'Cairo': 'Egypt',
    'Dubai': 'United Arab Emirates',
    'Seoul': 'South Korea',
    'Manila': 'Philippines',
    'Jakarta': 'Indonesia',
    'Kuala Lumpur': 'Malaysia'
  };

  const countries = new Set<string>();
  
  locations.forEach(location => {
    // Check if location directly matches a country
    if (location && typeof location === 'string') {
      // First check if it's a direct country match
      const directCountries = [
        'France', 'Italy', 'Spain', 'United States', 'Japan', 'United Kingdom', 
        'Germany', 'Australia', 'Brazil', 'Canada', 'Mexico', 'Thailand', 
        'Greece', 'Turkey', 'Egypt', 'Morocco', 'India', 'China', 'Singapore',
        'Netherlands', 'Switzerland', 'Austria', 'Norway', 'Sweden', 'Denmark',
        'Belgium', 'Czech Republic', 'Poland', 'United Arab Emirates', 
        'South Korea', 'Philippines', 'Indonesia', 'Malaysia'
      ];
      
      if (directCountries.includes(location)) {
        countries.add(location);
      } else {
        // Check if location is a city we can map to a country
        const country = countryMapping[location];
        if (country) {
          countries.add(country);
        }
      }
    }
  });

  return Array.from(countries);
};