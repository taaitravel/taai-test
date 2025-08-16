import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Map } from "@/components/Map";
import { MapTest } from "@/components/MapTest";

interface MapLocation {
  city: string;
  lat: number;
  lng: number;
  category?: 'flight' | 'hotel' | 'activity' | 'reservation';
}

interface ItineraryMapSectionProps {
  mapLocations: MapLocation[];
}

export const ItineraryMapSection = ({ mapLocations }: ItineraryMapSectionProps) => {
  console.log('ItineraryMapSection: Raw mapLocations received:', mapLocations);
  
  // Filter to show only main destination cities (no category or flight category)
  // This excludes hotels, activities, and restaurants to show core travel destinations
  const mainDestinations = mapLocations.filter(location => 
    location.lat && location.lng && location.city &&
    location.lat >= -90 && location.lat <= 90 &&
    location.lng >= -180 && location.lng <= 180 &&
    (!location.category || location.category === 'flight') // Only show destinations and flight stops
  );

  console.log('ItineraryMapSection: Filtered main destinations:', mainDestinations);

  // Simple deduplication for main destinations
  const seen = new Set<string>();
  const cleanedLocations: MapLocation[] = [];
  
  mainDestinations.forEach(location => {
    const key = `${location.lat.toFixed(3)},${location.lng.toFixed(3)}`;
    
    if (!seen.has(key)) {
      seen.add(key);
      cleanedLocations.push(location);
    }
  });

  console.log('ItineraryMapSection: Final cleaned locations:', cleanedLocations);

  return (
    <div className="lg:col-span-2">
      <Card className="bg-[#171821]/80 border-white/30 backdrop-blur-md h-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">Trip Map</CardTitle>
              <CardDescription className="text-white/70">
                {cleanedLocations.length} destination{cleanedLocations.length !== 1 ? 's' : ''} • Explore and discover nearby attractions
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-[550px] md:h-[365px] rounded-lg overflow-hidden">
            <Map locations={cleanedLocations} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};