/**
 * TAAI Tool Definitions for AI Function Calling
 * Based on tooling_and_db_write_rules.md
 */

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
}

// Read Tools
export const READ_TOOLS: ToolDefinition[] = [
  {
    name: 'get_itinerary',
    description: 'Fetch a complete itinerary by ID including all reservations, flights, hotels, and activities',
    parameters: {
      type: 'object',
      properties: {
        itin_id: { type: 'string', description: 'The itinerary ID (can be numeric ID or UUID)' }
      },
      required: ['itin_id']
    }
  },
  {
    name: 'list_itineraries',
    description: 'List all itineraries for a user, ordered by most recent',
    parameters: {
      type: 'object',
      properties: {
        userid: { type: 'string', description: 'The user ID (UUID)' }
      },
      required: ['userid']
    }
  },
  {
    name: 'find_reservation',
    description: 'Search for a specific reservation within an itinerary',
    parameters: {
      type: 'object',
      properties: {
        itin_id: { type: 'string', description: 'The itinerary ID' },
        query: { type: 'string', description: 'Search query - can match name, type, date range, or provider ID' },
        type: { type: 'string', enum: ['hotel', 'flight', 'activity', 'restaurant'], description: 'Filter by reservation type' }
      },
      required: ['itin_id']
    }
  }
];

// Search Tools
export const SEARCH_TOOLS: ToolDefinition[] = [
  {
    name: 'search_hotels',
    description: 'Search hotels by destination and dates. Returns diverse options with "Best Overall", "Best Value", "Best Location" labels.',
    parameters: {
      type: 'object',
      properties: {
        destination: { type: 'string', description: 'Hotel destination city or location' },
        check_in: { type: 'string', format: 'date', description: 'Check-in date in YYYY-MM-DD format' },
        check_out: { type: 'string', format: 'date', description: 'Check-out date in YYYY-MM-DD format' },
        max_price: { type: 'number', description: 'Maximum price per night in USD' },
        min_rating: { type: 'number', description: 'Minimum star rating (1-5)' },
        guests: { type: 'number', description: 'Number of guests', default: 2 },
        rooms: { type: 'number', description: 'Number of rooms', default: 1 },
        currency: { type: 'string', description: 'Currency code', default: 'USD' },
        limit: { type: 'number', description: 'Max results to return (3-6)', default: 5 }
      },
      required: ['destination', 'check_in', 'check_out']
    }
  },
  {
    name: 'search_hotels_date_sweep',
    description: 'Search hotels across multiple date ranges to find best pricing windows',
    parameters: {
      type: 'object',
      properties: {
        destination: { type: 'string', description: 'Hotel destination' },
        window_start: { type: 'string', format: 'date', description: 'Start of search window' },
        window_end: { type: 'string', format: 'date', description: 'End of search window' },
        stay_length: { type: 'number', description: 'Number of nights', default: 3 },
        max_price: { type: 'number', description: 'Maximum price per night' },
        sweep_count: { type: 'number', description: 'Number of date combinations to check', default: 5 }
      },
      required: ['destination', 'window_start', 'window_end']
    }
  },
  {
    name: 'search_flights',
    description: 'Search flights between two cities',
    parameters: {
      type: 'object',
      properties: {
        origin: { type: 'string', description: 'Departure city or airport code' },
        destination: { type: 'string', description: 'Arrival city or airport code' },
        depart_date: { type: 'string', format: 'date', description: 'Departure date in YYYY-MM-DD format' },
        return_date: { type: 'string', format: 'date', description: 'Return date (optional for one-way)' },
        passengers: { type: 'number', description: 'Number of passengers', default: 1 },
        cabin_class: { type: 'string', enum: ['economy', 'premium_economy', 'business', 'first'], description: 'Cabin class preference' },
        max_price: { type: 'number', description: 'Maximum total price' },
        max_stops: { type: 'number', description: 'Maximum number of stops', default: 2 }
      },
      required: ['origin', 'destination', 'depart_date']
    }
  },
  {
    name: 'search_activities',
    description: 'Search activities and experiences by destination',
    parameters: {
      type: 'object',
      properties: {
        destination: { type: 'string', description: 'Destination city or location' },
        date: { type: 'string', format: 'date', description: 'Activity date' },
        category: { type: 'string', enum: ['tours', 'attractions', 'outdoor', 'cultural', 'food', 'adventure', 'nightlife', 'wellness'], description: 'Activity category' },
        max_price: { type: 'number', description: 'Maximum price per person' },
        duration_hours: { type: 'number', description: 'Preferred duration in hours' },
        limit: { type: 'number', description: 'Max results', default: 10 }
      },
      required: ['destination']
    }
  },
  {
    name: 'search_restaurants',
    description: 'Search restaurants by destination and preferences',
    parameters: {
      type: 'object',
      properties: {
        destination: { type: 'string', description: 'City or area to search' },
        cuisine: { type: 'string', description: 'Cuisine type or keyword' },
        price_levels: { type: 'string', description: 'Price levels 1-4 as comma-separated string' },
        open_now: { type: 'boolean', description: 'Only show currently open restaurants' },
        limit: { type: 'number', description: 'Max results', default: 10 }
      },
      required: ['destination']
    }
  }
];

// Write Tools
export const WRITE_TOOLS: ToolDefinition[] = [
  {
    name: 'update_reservation_dates',
    description: 'Update the dates of an existing reservation. Requires unique identification of the reservation.',
    parameters: {
      type: 'object',
      properties: {
        itin_id: { type: 'string', description: 'The itinerary ID' },
        reservation_id: { type: 'string', description: 'The unique reservation identifier' },
        reservation_type: { type: 'string', enum: ['hotel', 'flight', 'activity'], description: 'Type of reservation' },
        new_start_date: { type: 'string', format: 'date', description: 'New start/check-in date' },
        new_end_date: { type: 'string', format: 'date', description: 'New end/check-out date' }
      },
      required: ['itin_id', 'reservation_id', 'reservation_type', 'new_start_date']
    }
  },
  {
    name: 'select_hotel',
    description: 'Select a hotel from search results and add to itinerary',
    parameters: {
      type: 'object',
      properties: {
        itin_id: { type: 'string', description: 'The itinerary ID' },
        hotel_id: { type: 'string', description: 'The hotel ID from search results' },
        check_in: { type: 'string', format: 'date', description: 'Check-in date' },
        check_out: { type: 'string', format: 'date', description: 'Check-out date' },
        room_count: { type: 'number', description: 'Number of rooms', default: 1 }
      },
      required: ['itin_id', 'hotel_id', 'check_in', 'check_out']
    }
  },
  {
    name: 'append_reservation',
    description: 'Add a new reservation to an itinerary',
    parameters: {
      type: 'object',
      properties: {
        itin_id: { type: 'string', description: 'The itinerary ID' },
        reservation_type: { type: 'string', enum: ['hotel', 'flight', 'activity', 'restaurant'], description: 'Type of reservation' },
        reservation_data: { type: 'object', description: 'The full reservation object with all details' }
      },
      required: ['itin_id', 'reservation_type', 'reservation_data']
    }
  },
  {
    name: 'set_hotel_shortlist',
    description: 'Save a list of hotel options to the itinerary for later selection',
    parameters: {
      type: 'object',
      properties: {
        itin_id: { type: 'string', description: 'The itinerary ID' },
        shortlist: { type: 'array', items: { type: 'object' }, description: 'Array of hotel objects to save' }
      },
      required: ['itin_id', 'shortlist']
    }
  },
  {
    name: 'update_itinerary_dates',
    description: 'Update the overall trip dates for an itinerary',
    parameters: {
      type: 'object',
      properties: {
        itin_id: { type: 'string', description: 'The itinerary ID' },
        itin_date_start: { type: 'string', format: 'date', description: 'New trip start date' },
        itin_date_end: { type: 'string', format: 'date', description: 'New trip end date' }
      },
      required: ['itin_id', 'itin_date_start', 'itin_date_end']
    }
  }
];

// Combine all tools for function calling
export const ALL_TOOLS: ToolDefinition[] = [
  ...READ_TOOLS,
  ...SEARCH_TOOLS,
  ...WRITE_TOOLS
];

// Convert to OpenAI/Gemini function format
export const getToolsForAI = () => {
  return ALL_TOOLS.map(tool => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters
    }
  }));
};

// Legacy format for backwards compatibility
export const getLegacyFunctionFormat = () => {
  return ALL_TOOLS.map(tool => ({
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters
  }));
};
