import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, CreditCard, Search, ShoppingCart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ItineraryData } from '@/types/itinerary';

export interface TripWorkspaceCartItem {
  id: string;
  type: string;
  price: number;
  bookingStatus: string | null;
}

interface TripWorkspaceBookingsProps {
  itineraryData: ItineraryData;
  cartItems: TripWorkspaceCartItem[];
  cartView: ReactNode;
}

const formatMoney = (value: number) =>
  `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const deterministicState = (bookingStatus: string | null): 'In cart' | 'Checkout started' | 'Payment recorded' | 'Provider confirmed' | 'Needs attention' => {
  switch (bookingStatus) {
    case 'checkout_started':
    case 'pending':
      return 'Checkout started';
    case 'payment_recorded':
    case 'paid':
      return 'Payment recorded';
    case 'provider_confirmed':
    case 'confirmed':
      return 'Provider confirmed';
    case 'needs_attention':
    case 'needs_review':
    case 'failed':
      return 'Needs attention';
    default:
      return 'In cart';
  }
};

export const TripWorkspaceBookings = ({ itineraryData, cartItems, cartView }: TripWorkspaceBookingsProps) => {
  const plannedItems = [
    ...(itineraryData.flights || []).map((item) => ({ type: 'Flight', label: item.airline || item.flight_number || 'Flight' })),
    ...(itineraryData.hotels || []).map((item) => ({ type: 'Hotel', label: item.name || 'Hotel' })),
    ...(itineraryData.activities || []).map((item) => ({ type: 'Activity', label: item.name || 'Activity' })),
    ...(itineraryData.reservations || []).map((item) => ({ type: 'Reservation', label: item.name || 'Reservation' })),
  ];

  const cartTotal = cartItems.reduce((sum, item) => sum + item.price, 0);

  return (
    <section id="trip-workspace-bookings" role="tabpanel" aria-label="Bookings" className="space-y-6">
      <Card className="bg-card/80 border-border backdrop-blur-md">
        <CardHeader>
          <CardTitle>Bookings workspace</CardTitle>
          <p className="text-sm text-muted-foreground">
            This view separates planning items from cart and checkout evidence. It does not infer bookings from Miles text, typed notes, itinerary existence, confirmation-number strings, or user claims.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button asChild className="gold-gradient text-background hover:opacity-90">
            <Link to="/search"><Search className="mr-2 h-4 w-4" />Search and book through taai</Link>
          </Button>
          {cartItems.length > 0 && (
            <Button asChild variant="outline">
              <Link to="/cart"><ShoppingCart className="mr-2 h-4 w-4" />Continue to cart · {formatMoney(cartTotal)}</Link>
            </Button>
          )}
          <Button type="button" variant="outline" disabled title="External booking entry is planned for the next slice">
            <CreditCard className="mr-2 h-4 w-4" />Add a booking made elsewhere — coming next
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
        <Card className="bg-card/80 border-border">
          <CardHeader>
            <CardTitle>Planning items that may need booking</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {plannedItems.length > 0 ? plannedItems.map((item, index) => (
              <div key={`${item.type}-${item.label}-${index}`} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 p-3">
                <div>
                  <p className="font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.type}</p>
                </div>
                <Badge variant="outline">Planned</Badge>
              </div>
            )) : (
              <div className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">
                No itinerary items yet. Search through taai or ask Miles for planning ideas.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/80 border-border">
          <CardHeader>
            <CardTitle>Deterministic booking evidence</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {cartItems.length > 0 ? cartItems.map((item) => (
              <div key={item.id} className="rounded-xl border border-border bg-muted/40 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium capitalize text-foreground">{item.type}</p>
                    <p className="text-sm text-muted-foreground">{formatMoney(item.price)}</p>
                  </div>
                  <Badge variant="secondary">{deterministicState(item.bookingStatus)}</Badge>
                </div>
              </div>
            )) : (
              <div className="flex gap-2 rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                No cart, checkout, payment, or provider-confirmation evidence is available for this trip in the current cart data.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {cartView}
    </section>
  );
};
