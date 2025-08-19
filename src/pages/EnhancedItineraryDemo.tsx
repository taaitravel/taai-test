import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useMockExpediaData } from '@/hooks/useMockExpediaData';
import { 
  SwipeHotelRenderer, 
  SwipeFlightRenderer, 
  SwipeActivityRenderer, 
  SwipeRestaurantRenderer 
} from '@/components/swipe/SwipeCardRenderers';
import { BusinessMetricsDashboard } from '@/components/admin/BusinessMetricsDashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Hotel, 
  Plane, 
  MapPin, 
  Utensils, 
  BarChart3,
  ArrowLeft 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const EnhancedItineraryDemo: React.FC = () => {
  const navigate = useNavigate();
  const { mockHotels, mockFlights, mockActivities, mockReservations } = useMockExpediaData();

  return (
    <div className="min-h-screen luxury-gradient">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="text-white/80 hover:text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">Enhanced TAAI Travel Experience</h1>
              <p className="text-white/70">Showcasing Expedia integration with financial tracking</p>
            </div>
          </div>
          <Badge className="bg-primary/20 text-primary border-primary/30 px-4 py-2">
            Summer Trip 2025 • Miami
          </Badge>
        </div>

        <Tabs defaultValue="bookings" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 bg-white/10">
            <TabsTrigger value="bookings" className="text-white">Enhanced Bookings</TabsTrigger>
            <TabsTrigger value="analytics" className="text-white">Business Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="bookings" className="space-y-8">
            {/* Hotels Section */}
            <Card className="trip-card-past">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Hotel className="h-5 w-5" />
                  Hotels ({mockHotels.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {mockHotels.map((hotel, index) => (
                    <Card key={hotel.id} className="luxury-gradient border border-white/20">
                      <CardContent className="p-6">
                        {SwipeHotelRenderer(hotel, true)}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Flights Section */}
            <Card className="trip-card-past">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Plane className="h-5 w-5" />
                  Flights ({mockFlights.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {mockFlights.map((flight, index) => (
                    <Card key={flight.id} className="luxury-gradient border border-white/20">
                      <CardContent className="p-6">
                        {SwipeFlightRenderer(flight, true)}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Activities Section */}
            <Card className="trip-card-past">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Activities ({mockActivities.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {mockActivities.map((activity, index) => (
                    <Card key={activity.id} className="luxury-gradient border border-white/20">
                      <CardContent className="p-6">
                        {SwipeActivityRenderer(activity, true)}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Reservations Section */}
            <Card className="trip-card-past">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Utensils className="h-5 w-5" />
                  Reservations ({mockReservations.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {mockReservations.map((reservation, index) => (
                    <Card key={reservation.id} className="luxury-gradient border border-white/20">
                      <CardContent className="p-6">
                        {SwipeRestaurantRenderer(reservation, true)}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Financial Summary */}
            <Card className="trip-card-past">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Trip Financial Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white mb-2">
                      ${(mockHotels.reduce((sum, h) => sum + h.cost, 0) + 
                        mockFlights.reduce((sum, f) => sum + f.cost, 0) + 
                        mockActivities.reduce((sum, a) => sum + a.cost, 0)).toLocaleString()}
                    </div>
                    <p className="text-sm text-white/60">Total Trip Cost</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-2">
                      ${((mockHotels.reduce((sum, h) => sum + h.cost, 0) + 
                        mockFlights.reduce((sum, f) => sum + f.cost, 0) + 
                        mockActivities.reduce((sum, a) => sum + a.cost, 0)) * 0.1).toFixed(0)}
                    </div>
                    <p className="text-sm text-white/60">Commission Earned</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-400 mb-2">
                      {mockHotels.filter(h => h.booking_status === 'confirmed').length + 
                       mockFlights.filter(f => f.booking_status === 'confirmed').length + 
                       mockActivities.filter(a => a.booking_status === 'confirmed').length}
                    </div>
                    <p className="text-sm text-white/60">Confirmed Bookings</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-400 mb-2">
                      15
                    </div>
                    <p className="text-sm text-white/60">Travel Days</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <BusinessMetricsDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EnhancedItineraryDemo;