import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Map } from "@/components/Map";

interface GlobalMapLocation {
  city: string;
  lat: number;
  lng: number;
  category?: "flight" | "hotel" | "activity" | "reservation" | "destination";
}

interface ItineraryGlobalMapSectionProps {
  destinations: string[];
  mapLocations: GlobalMapLocation[];
}

export const ItineraryGlobalMapSection = ({ destinations, mapLocations }: ItineraryGlobalMapSectionProps) => {
  console.log('ItineraryGlobalMapSection: Raw destinations:', destinations);
  console.log('ItineraryGlobalMapSection: Raw mapLocations:', mapLocations);
  
  // Filter to show only main destination cities (no category or flight category)
  // This creates the "global view" showing the main cities being visited
  const globalDestinations = mapLocations.filter(location => 
    location.lat && location.lng && location.city &&
    location.lat >= -90 && location.lat <= 90 &&
    location.lng >= -180 && location.lng <= 180 &&
    (!location.category || location.category === 'flight' || location.category === 'destination')
  );

  console.log('ItineraryGlobalMapSection: Filtered global destinations:', globalDestinations);

  // Deduplicate by coordinates (keep cities, not specific venues)
  const seen = new Set<string>();
  const cleanedDestinations: GlobalMapLocation[] = [];
  
  globalDestinations.forEach(location => {
    const key = `${location.lat.toFixed(2)},${location.lng.toFixed(2)}`;
    
    if (!seen.has(key)) {
      seen.add(key);
      cleanedDestinations.push(location);
    }
  });

  console.log('ItineraryGlobalMapSection: Final cleaned destinations:', cleanedDestinations);

  return (
    <div className="lg:col-span-2">
      <Card className="h-96 overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20 border-primary/20">
        <CardHeader className="bg-gradient-to-r from-primary to-primary/80 text-white relative overflow-hidden">
          <div className="relative z-10">
            <div>
              <CardTitle className="text-white">Global Trip Overview</CardTitle>
              <CardDescription className="text-white/70">
                {cleanedDestinations.length} destination{cleanedDestinations.length !== 1 ? 's' : ''} • Main cities on your itinerary
              </CardDescription>
            </div>
          </div>
          <div className="absolute inset-0 bg-black/10"></div>
        </CardHeader>
        <CardContent className="p-0 h-64">
          <Map locations={cleanedDestinations} />
        </CardContent>
      </Card>
    </div>
  );
};
