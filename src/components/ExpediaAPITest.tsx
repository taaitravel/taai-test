import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useExpediaAPI } from '@/hooks/useExpediaAPI';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, MapPin, Users } from 'lucide-react';

export const ExpediaAPITest = () => {
  const { searchHotels, getDestinations, loading } = useExpediaAPI();
  const [destination, setDestination] = useState('');
  const [checkin, setCheckin] = useState('');
  const [checkout, setCheckout] = useState('');
  const [results, setResults] = useState<any>(null);
  const [destinations, setDestinations] = useState<any>(null);

  const handleSearchHotels = async () => {
    if (!destination || !checkin || !checkout) {
      alert('Please fill in all fields');
      return;
    }

    const response = await searchHotels({
      destination,
      checkin,
      checkout,
      adults: 2,
      rooms: 1
    });

    if (response.data) {
      setResults(response.data);
    }
  };

  const handleSearchDestinations = async () => {
    if (!destination) return;

    const response = await getDestinations(destination);
    if (response.data) {
      setDestinations(response.data);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Expedia API Integration Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Destination</label>
              <Input
                placeholder="e.g., New York, Paris, Tokyo"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                onBlur={handleSearchDestinations}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Check-in</label>
              <Input
                type="date"
                value={checkin}
                onChange={(e) => setCheckin(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Check-out</label>
              <Input
                type="date"
                value={checkout}
                onChange={(e) => setCheckout(e.target.value)}
              />
            </div>
          </div>

          <Button 
            onClick={handleSearchHotels} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Searching...' : 'Search Hotels via Expedia API'}
          </Button>
        </CardContent>
      </Card>

      {destinations && (
        <Card>
          <CardHeader>
            <CardTitle>Destination Search Results</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted p-4 rounded overflow-auto max-h-60">
              {JSON.stringify(destinations, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {results && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Hotel Search Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {results.result ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  Found {results.result.length} hotels
                </div>
                <div className="grid gap-4">
                  {results.result.slice(0, 5).map((hotel: any, index: number) => (
                    <Card key={index} className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{hotel.hotel_name}</h3>
                          <p className="text-sm text-muted-foreground">{hotel.address}</p>
                          {hotel.district && (
                            <Badge variant="secondary" className="mt-1">
                              {hotel.district}
                            </Badge>
                          )}
                        </div>
                        <div className="text-right">
                          {hotel.min_total_price && (
                            <div className="text-lg font-bold text-primary">
                              ${hotel.min_total_price}
                            </div>
                          )}
                          {hotel.review_score && (
                            <div className="text-sm text-muted-foreground">
                              Rating: {hotel.review_score}/10
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <pre className="text-xs bg-muted p-4 rounded overflow-auto max-h-60">
                {JSON.stringify(results, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};