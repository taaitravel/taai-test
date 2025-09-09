import React, { useState } from 'react';
import { useBookingAPI } from '@/hooks/useBookingAPI';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export const BookingAPITest: React.FC = () => {
  const { searchCarRentals, searchHotels, searchDestinations, loading } = useBookingAPI();
  const [results, setResults] = useState<any>(null);
  const [currentTest, setCurrentTest] = useState<string>('');

  // Car rental search states
  const [carSearchParams, setCarSearchParams] = useState({
    pick_up_latitude: 40.6397018432617,
    pick_up_longitude: -73.7791976928711,
    drop_off_latitude: 40.6397018432617,
    drop_off_longitude: -73.7791976928711,
    pick_up_time: '10:00',
    drop_off_time: '10:00',
    driver_age: 30,
    currency_code: 'USD',
    location: 'US'
  });

  // Hotel search states
  const [hotelSearchParams, setHotelSearchParams] = useState({
    dest_id: '20088325',
    search_type: 'city',
    arrival_date: '2024-12-20',
    departure_date: '2024-12-22',
    adults: 2,
    children: 0,
    room_qty: 1,
    currency_code: 'USD'
  });

  // Destination search state
  const [destinationQuery, setDestinationQuery] = useState('New York');

  const handleCarRentalSearch = async () => {
    setCurrentTest('car-rentals');
    try {
      const response = await searchCarRentals(carSearchParams);
      setResults(response);
    } catch (error) {
      console.error('Car rental search error:', error);
    }
  };

  const handleHotelSearch = async () => {
    setCurrentTest('hotels');
    try {
      const response = await searchHotels(hotelSearchParams);
      setResults(response);
    } catch (error) {
      console.error('Hotel search error:', error);
    }
  };

  const handleDestinationSearch = async () => {
    setCurrentTest('destinations');
    try {
      const response = await searchDestinations(destinationQuery);
      setResults(response);
    } catch (error) {
      console.error('Destination search error:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Booking.com API Test</CardTitle>
          <CardDescription>
            Test the integration with Booking.com API for car rentals, hotels, and destinations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="car-rentals" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="car-rentals">Car Rentals</TabsTrigger>
              <TabsTrigger value="hotels">Hotels</TabsTrigger>
              <TabsTrigger value="destinations">Destinations</TabsTrigger>
            </TabsList>

            <TabsContent value="car-rentals" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pickup-lat">Pickup Latitude</Label>
                  <Input
                    id="pickup-lat"
                    type="number"
                    step="any"
                    value={carSearchParams.pick_up_latitude}
                    onChange={(e) => setCarSearchParams(prev => ({
                      ...prev,
                      pick_up_latitude: parseFloat(e.target.value)
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="pickup-lng">Pickup Longitude</Label>
                  <Input
                    id="pickup-lng"
                    type="number"
                    step="any"
                    value={carSearchParams.pick_up_longitude}
                    onChange={(e) => setCarSearchParams(prev => ({
                      ...prev,
                      pick_up_longitude: parseFloat(e.target.value)
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="pickup-time">Pickup Time</Label>
                  <Input
                    id="pickup-time"
                    value={carSearchParams.pick_up_time}
                    onChange={(e) => setCarSearchParams(prev => ({
                      ...prev,
                      pick_up_time: e.target.value
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="driver-age">Driver Age</Label>
                  <Input
                    id="driver-age"
                    type="number"
                    value={carSearchParams.driver_age}
                    onChange={(e) => setCarSearchParams(prev => ({
                      ...prev,
                      driver_age: parseInt(e.target.value)
                    }))}
                  />
                </div>
              </div>
              <Button 
                onClick={handleCarRentalSearch} 
                disabled={loading}
                className="w-full"
              >
                {loading && currentTest === 'car-rentals' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Search Car Rentals
              </Button>
            </TabsContent>

            <TabsContent value="hotels" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dest-id">Destination ID</Label>
                  <Input
                    id="dest-id"
                    value={hotelSearchParams.dest_id}
                    onChange={(e) => setHotelSearchParams(prev => ({
                      ...prev,
                      dest_id: e.target.value
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="search-type">Search Type</Label>
                  <Input
                    id="search-type"
                    value={hotelSearchParams.search_type}
                    onChange={(e) => setHotelSearchParams(prev => ({
                      ...prev,
                      search_type: e.target.value
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="arrival-date">Arrival Date</Label>
                  <Input
                    id="arrival-date"
                    type="date"
                    value={hotelSearchParams.arrival_date}
                    onChange={(e) => setHotelSearchParams(prev => ({
                      ...prev,
                      arrival_date: e.target.value
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="departure-date">Departure Date</Label>
                  <Input
                    id="departure-date"
                    type="date"
                    value={hotelSearchParams.departure_date}
                    onChange={(e) => setHotelSearchParams(prev => ({
                      ...prev,
                      departure_date: e.target.value
                    }))}
                  />
                </div>
              </div>
              <Button 
                onClick={handleHotelSearch} 
                disabled={loading}
                className="w-full"
              >
                {loading && currentTest === 'hotels' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Search Hotels
              </Button>
            </TabsContent>

            <TabsContent value="destinations" className="space-y-4">
              <div>
                <Label htmlFor="destination-query">Search Query</Label>
                <Input
                  id="destination-query"
                  value={destinationQuery}
                  onChange={(e) => setDestinationQuery(e.target.value)}
                  placeholder="Enter city, hotel, or destination name"
                />
              </div>
              <Button 
                onClick={handleDestinationSearch} 
                disabled={loading}
                className="w-full"
              >
                {loading && currentTest === 'destinations' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Search Destinations
              </Button>
            </TabsContent>
          </Tabs>

          {results && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>API Response</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-md overflow-auto max-h-96 text-sm">
                  {JSON.stringify(results, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};