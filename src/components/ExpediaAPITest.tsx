import { useState } from "react";
import { useExpediaAPI } from "@/hooks/useExpediaAPI";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plane, Hotel, MapPin } from "lucide-react";

export const ExpediaAPITest = () => {
  const { 
    testConnection,
    searchHotels, 
    searchFlights, 
    searchActivities,
    getDestinations,
    loading 
  } = useExpediaAPI();

  const [results, setResults] = useState<any>(null);
  const [testType, setTestType] = useState<string>('');

  // Test connection
  const handleTestConnection = async () => {
    setTestType('test');
    const result = await testConnection();
    setResults(result);
  };

  // Hotel search form state
  const [hotelParams, setHotelParams] = useState({
    destination: 'New York',
    checkin: '2024-12-01',
    checkout: '2024-12-03',
    adults: 2,
    rooms: 1
  });

  const handleHotelSearch = async () => {
    setTestType('hotels');
    const result = await searchHotels(hotelParams);
    setResults(result);
  };

  // Flight search form state
  const [flightParams, setFlightParams] = useState({
    origin: 'NYC',
    destination: 'LAX',
    departure_date: '2024-12-01',
    return_date: '2024-12-05',
    adults: 1
  });

  const handleFlightSearch = async () => {
    setTestType('flights');
    const result = await searchFlights(flightParams);
    setResults(result);
  };

  // Activity search form state
  const [activityParams, setActivityParams] = useState({
    destination: 'New York',
    category: 'all',
    date: '2024-12-01'
  });

  const handleActivitySearch = async () => {
    setTestType('activities');
    const result = await searchActivities(activityParams);
    setResults(result);
  };

  // Destination search
  const [destinationQuery, setDestinationQuery] = useState('New York');

  const handleDestinationSearch = async () => {
    setTestType('destinations');
    const result = await getDestinations(destinationQuery);
    setResults(result);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plane className="h-5 w-5" />
            Expedia API Integration Test
          </CardTitle>
          <CardDescription>
            Test the Expedia13 RapidAPI integration for hotels, flights, and activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button 
              onClick={handleTestConnection}
              disabled={loading}
              className="w-full"
            >
              {loading && testType === 'test' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Test API Connection
            </Button>

            <Tabs defaultValue="hotels" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="hotels">Hotels</TabsTrigger>
                <TabsTrigger value="flights">Flights</TabsTrigger>
                <TabsTrigger value="activities">Activities</TabsTrigger>
                <TabsTrigger value="destinations">Destinations</TabsTrigger>
              </TabsList>

              <TabsContent value="hotels" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="hotel-dest">Destination</Label>
                    <Input
                      id="hotel-dest"
                      value={hotelParams.destination}
                      onChange={(e) => setHotelParams({...hotelParams, destination: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="checkin">Check-in</Label>
                    <Input
                      id="checkin"
                      type="date"
                      value={hotelParams.checkin}
                      onChange={(e) => setHotelParams({...hotelParams, checkin: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="checkout">Check-out</Label>
                    <Input
                      id="checkout"
                      type="date"
                      value={hotelParams.checkout}
                      onChange={(e) => setHotelParams({...hotelParams, checkout: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="adults">Adults</Label>
                    <Input
                      id="adults"
                      type="number"
                      min="1"
                      value={hotelParams.adults}
                      onChange={(e) => setHotelParams({...hotelParams, adults: parseInt(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="rooms">Rooms</Label>
                    <Input
                      id="rooms"
                      type="number"
                      min="1"
                      value={hotelParams.rooms}
                      onChange={(e) => setHotelParams({...hotelParams, rooms: parseInt(e.target.value)})}
                    />
                  </div>
                </div>
                <Button 
                  onClick={handleHotelSearch}
                  disabled={loading}
                  className="w-full"
                >
                  {loading && testType === 'hotels' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Hotel className="mr-2 h-4 w-4" />
                  Search Hotels
                </Button>
              </TabsContent>

              <TabsContent value="flights" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="origin">Origin</Label>
                    <Input
                      id="origin"
                      value={flightParams.origin}
                      onChange={(e) => setFlightParams({...flightParams, origin: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="flight-dest">Destination</Label>
                    <Input
                      id="flight-dest"
                      value={flightParams.destination}
                      onChange={(e) => setFlightParams({...flightParams, destination: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="departure">Departure</Label>
                    <Input
                      id="departure"
                      type="date"
                      value={flightParams.departure_date}
                      onChange={(e) => setFlightParams({...flightParams, departure_date: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="return">Return (optional)</Label>
                    <Input
                      id="return"
                      type="date"
                      value={flightParams.return_date}
                      onChange={(e) => setFlightParams({...flightParams, return_date: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="flight-adults">Adults</Label>
                    <Input
                      id="flight-adults"
                      type="number"
                      min="1"
                      value={flightParams.adults}
                      onChange={(e) => setFlightParams({...flightParams, adults: parseInt(e.target.value)})}
                    />
                  </div>
                </div>
                <Button 
                  onClick={handleFlightSearch}
                  disabled={loading}
                  className="w-full"
                >
                  {loading && testType === 'flights' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Plane className="mr-2 h-4 w-4" />
                  Search Flights
                </Button>
              </TabsContent>

              <TabsContent value="activities" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="activity-dest">Destination</Label>
                    <Input
                      id="activity-dest"
                      value={activityParams.destination}
                      onChange={(e) => setActivityParams({...activityParams, destination: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="activity-date">Date (optional)</Label>
                    <Input
                      id="activity-date"
                      type="date"
                      value={activityParams.date}
                      onChange={(e) => setActivityParams({...activityParams, date: e.target.value})}
                    />
                  </div>
                </div>
                <Button 
                  onClick={handleActivitySearch}
                  disabled={loading}
                  className="w-full"
                >
                  {loading && testType === 'activities' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <MapPin className="mr-2 h-4 w-4" />
                  Search Activities
                </Button>
              </TabsContent>

              <TabsContent value="destinations" className="space-y-4">
                <div>
                  <Label htmlFor="dest-query">Search Destinations</Label>
                  <Input
                    id="dest-query"
                    value={destinationQuery}
                    onChange={(e) => setDestinationQuery(e.target.value)}
                    placeholder="Enter city or destination name"
                  />
                </div>
                <Button 
                  onClick={handleDestinationSearch}
                  disabled={loading}
                  className="w-full"
                >
                  {loading && testType === 'destinations' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Search Destinations
                </Button>
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Results Display */}
      {results && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              API Response
              <Badge variant={results.error ? "destructive" : "default"}>
                {results.error ? "Error" : "Success"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-96 text-sm">
              {JSON.stringify(results, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
};