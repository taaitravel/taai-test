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
          <div className="h-[300px] rounded-lg overflow-hidden">
            <Map locations={mapLocations} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};