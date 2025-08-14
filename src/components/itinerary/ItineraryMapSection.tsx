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
  console.log('🧭 ItineraryMapSection render - mapLocations received:', mapLocations);
  console.log('🧭 MapLocations count:', mapLocations.length);
  console.log('🧭 MapLocations structure:', JSON.stringify(mapLocations, null, 2));

  // Clean and deduplicate map locations by coordinates
  const cleanedLocations = mapLocations.filter((location, index, array) => {
    // Remove invalid locations
    if (!location.lat || !location.lng || !location.city) return false;
    
    // For locations with same coordinates, prioritize specific venues over generic cities
    const sameCoordLocations = array.filter(l => 
      Math.abs(l.lat - location.lat) < 0.001 && 
      Math.abs(l.lng - location.lng) < 0.001
    );
    
    if (sameCoordLocations.length > 1) {
      // Prioritize locations with categories (hotels, activities, etc.) over generic city names
      const hasCategory = location.category;
      const isGenericCity = !location.category && location.city.includes(', ');
      
      // If current location has a category, keep it
      if (hasCategory) return true;
      
      // If current location is a generic city but there are categorized locations at same coords, remove it
      if (isGenericCity && sameCoordLocations.some(l => l.category)) return false;
      
      // Otherwise keep first occurrence
      return array.findIndex(l => 
        Math.abs(l.lat - location.lat) < 0.001 && 
        Math.abs(l.lng - location.lng) < 0.001
      ) === index;
    }
    
    return true;
  });

  console.log('🧭 Cleaned locations count:', cleanedLocations.length);

  return (
    <div className="lg:col-span-2">
      <Card className="bg-[#171821]/80 border-white/30 backdrop-blur-md h-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">Trip Map</CardTitle>
              <CardDescription className="text-white/70">
                Explore your destinations and discover nearby attractions
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