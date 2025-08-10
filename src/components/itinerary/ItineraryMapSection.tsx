import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Map from "@/components/Map";

interface MapLocation {
  city: string;
  lat: number;
  lng: number;
}

interface ItineraryMapSectionProps {
  mapLocations: MapLocation[];
  locationNames: string[];
}
export const ItineraryMapSection = ({ mapLocations, locationNames }: ItineraryMapSectionProps) => {
  // Debug information
  console.log('ItineraryMapSection render:', {
    mapLocationsCount: mapLocations.length,
    locationNamesCount: locationNames.length,
    mapLocations,
    locationNames
  });
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
        <CardContent>
          <div className="h-[250px] rounded-lg overflow-hidden">
            <Map 
              locations={mapLocations} 
              locationNames={locationNames}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};