import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useMockExpediaData } from '@/hooks/useMockExpediaData';
import { ItineraryStackedSection } from '@/components/itinerary/ItineraryStackedSection';
import { 
  EnhancedHotelCardRenderer,
  EnhancedFlightCardRenderer,
  EnhancedActivityCardRenderer,
  EnhancedReservationCardRenderer
} from '@/components/itinerary/EnhancedStackedCardRenderer';
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

        {/* Itinerary Sections in Stacked Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
          <ItineraryStackedSection
            title="Hotels"
            icon={Hotel}
            items={mockHotels}
            onCardClick={(index) => console.log('Hotel clicked:', index)}
            renderCard={EnhancedHotelCardRenderer}
            emptyMessage="No hotels added yet"
          />
          
          <ItineraryStackedSection
            title="Flights"
            icon={Plane}
            items={mockFlights}
            onCardClick={(index) => console.log('Flight clicked:', index)}
            renderCard={EnhancedFlightCardRenderer}
            emptyMessage="No flights added yet"
          />
          
          <ItineraryStackedSection
            title="Activities"
            icon={MapPin}
            items={mockActivities}
            onCardClick={(index) => console.log('Activity clicked:', index)}
            renderCard={EnhancedActivityCardRenderer}
            emptyMessage="No activities added yet"
          />
          
          <ItineraryStackedSection
            title="Reservations"
            icon={Utensils}
            items={mockReservations}
            onCardClick={(index) => console.log('Reservation clicked:', index)}
            renderCard={EnhancedReservationCardRenderer}
            emptyMessage="No reservations added yet"
          />
        </div>

        {/* Financial Summary */}
        <Card className="trip-card-past mt-8">
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
      </div>
    </div>
  );
};

export default EnhancedItineraryDemo;