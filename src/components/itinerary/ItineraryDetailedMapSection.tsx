import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Map } from "@/components/Map";

interface DetailedMapLocation {
  city: string;
  lat: number;
  lng: number;
  category?: "flight" | "hotel" | "activity" | "reservation" | "destination";
}

interface ItineraryDetailedMapSectionProps {
  mapLocations: DetailedMapLocation[];
  hotels: Array<{ name: string; city: string }>;
  activities: Array<{ name: string; city: string }>;
  reservations: Array<{ name: string; city: string }>;
}

export const ItineraryDetailedMapSection = ({ 
  mapLocations, 
  hotels, 
  activities, 
  reservations 
}: ItineraryDetailedMapSectionProps) => {
  console.log('ItineraryDetailedMapSection: Raw mapLocations:', mapLocations);
  console.log('ItineraryDetailedMapSection: Hotels:', hotels);
  console.log('ItineraryDetailedMapSection: Activities:', activities);
  console.log('ItineraryDetailedMapSection: Reservations:', reservations);
  
  // Filter to show only specific venues (hotels, activities, restaurants)
  // This creates the "detailed view" showing actual places being visited
  const detailedLocations = mapLocations.filter(location => 
    location.lat && location.lng && location.city &&
    location.lat >= -90 && location.lat <= 90 &&
    location.lng >= -180 && location.lng <= 180 &&
    location.category && 
    (['hotel', 'activity', 'reservation'] as Array<"hotel" | "activity" | "reservation">).includes(location.category as any)
  );

  console.log('ItineraryDetailedMapSection: Filtered detailed locations:', detailedLocations);

  // Count by category
  const categoryCount = detailedLocations.reduce((acc, loc) => {
    const cat = loc.category || 'other';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalVenues = detailedLocations.length;
  const hotelCount = categoryCount.hotel || 0;
  const activityCount = categoryCount.activity || 0;
  const restaurantCount = categoryCount.reservation || categoryCount.restaurant || 0;

  const summaryText = totalVenues > 0 
    ? `${totalVenues} venue${totalVenues !== 1 ? 's' : ''} • ${hotelCount} hotel${hotelCount !== 1 ? 's' : ''}, ${activityCount} activit${activityCount !== 1 ? 'ies' : 'y'}, ${restaurantCount} restaurant${restaurantCount !== 1 ? 's' : ''}`
    : 'No specific venues mapped yet • Add hotels, activities, and reservations to see them here';

  return (
    <div className="lg:col-span-2">
      <Card className="h-96 overflow-hidden bg-gradient-to-br from-secondary/20 to-accent/20 border-secondary/20">
        <CardHeader className="bg-gradient-to-r from-secondary to-secondary/80 text-white relative overflow-hidden">
          <div className="relative z-10">
            <div>
              <CardTitle className="text-white">Detailed Venue Map</CardTitle>
              <CardDescription className="text-white/70">
                {summaryText}
              </CardDescription>
            </div>
          </div>
          <div className="absolute inset-0 bg-black/10"></div>
        </CardHeader>
        <CardContent className="p-0 h-64">
          {totalVenues > 0 ? (
            <Map locations={detailedLocations} />
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <p className="text-lg font-medium mb-2">No venues to display</p>
                <p className="text-sm">Add hotels, activities, or reservations with specific locations to see them on this map</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};