import { Link } from 'react-router-dom';
import { CalendarDays, MapPin, Search, ShoppingCart, Users, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ItineraryData } from '@/types/itinerary';
import { formatDateOnlyRange } from '@/lib/date-time';

interface TripWorkspaceOverviewProps {
  itineraryData: ItineraryData;
  duration: number;
  peopleCount: number;
  itineraryItemCount: number;
  cartItemCount: number;
  cartTotal: number;
  tripStatus: string;
  countdownLabel: string;
  onInvite: () => void;
}

const formatMoney = (value: number) =>
  `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const TripWorkspaceOverview = ({
  itineraryData,
  duration,
  peopleCount,
  itineraryItemCount,
  cartItemCount,
  cartTotal,
  tripStatus,
  countdownLabel,
  onInvite,
}: TripWorkspaceOverviewProps) => {
  const destinations = itineraryData.itin_locations || [];
  const nextItems = [
    ...(itineraryData.flights || []).map((item) => ({ label: item.airline || item.flight_number || 'Flight', detail: item.departure || item.from || '' })),
    ...(itineraryData.hotels || []).map((item) => ({ label: item.name || 'Hotel', detail: item.check_in || item.city || '' })),
    ...(itineraryData.activities || []).map((item) => ({ label: item.name || 'Activity', detail: item.date || item.city || '' })),
    ...(itineraryData.reservations || []).map((item) => ({ label: item.name || 'Reservation', detail: item.date || item.time || '' })),
  ].slice(0, 3);

  return (
    <section id="trip-workspace-overview" role="tabpanel" aria-label="Overview" className="space-y-6">
      <Card className="overflow-hidden border-border bg-gradient-to-br from-card via-secondary/40 to-card shadow-xl">
        <CardContent className="p-5 sm:p-7">
          <p className="text-sm font-semibold text-primary">Everything for the trip, together.</p>
          <h2 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">{itineraryData.itin_name || 'Untitled trip'}</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Your plan can change as the group makes decisions. Keep the itinerary, bookings, people, costs, and conversation organized as the trip evolves.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button asChild className="gold-gradient text-background hover:opacity-90">
              <Link to="/search"><Search className="mr-2 h-4 w-4" />Search and book through taai</Link>
            </Button>
            {cartItemCount > 0 && (
              <Button asChild variant="outline">
                <Link to="/cart"><ShoppingCart className="mr-2 h-4 w-4" />Continue to cart</Link>
              </Button>
            )}
            <Button type="button" variant="outline" onClick={onInvite}>
              <Users className="mr-2 h-4 w-4" />Invite travelers
            </Button>
            <Button asChild variant="ghost">
              <Link to="/subscription">View subscription options</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card/80 border-border">
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm"><CalendarDays className="h-4 w-4" />Dates</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground">{formatDateOnlyRange(itineraryData.itin_date_start, itineraryData.itin_date_end) || 'Dates TBD'}</p>
            <p>{duration} days · {tripStatus}</p>
            <p>{countdownLabel}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/80 border-border">
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm"><MapPin className="h-4 w-4" />Destination</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground">{destinations.length > 0 ? destinations.join(', ') : 'No destination saved yet'}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/80 border-border">
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm"><Users className="h-4 w-4" />Travelers</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground">{peopleCount} {peopleCount === 1 ? 'traveler' : 'travelers'}</p>
            <p>Includes current itinerary attendees where available.</p>
          </CardContent>
        </Card>
        <Card className="bg-card/80 border-border">
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm"><Wallet className="h-4 w-4" />Budget and cart</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Budget {formatMoney(Number(itineraryData.budget) || 0)}</p>
            <p>{cartItemCount} in cart · {formatMoney(cartTotal)}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card/80 border-border">
        <CardHeader>
          <CardTitle>Current itinerary summary</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">{itineraryItemCount} planned itinerary {itineraryItemCount === 1 ? 'item' : 'items'} across flights, stays, activities, and reservations.</p>
            <p className="mt-2 text-sm text-muted-foreground">These are planning details unless deterministic booking evidence exists in booking or payment records.</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Next planned items</p>
            {nextItems.length > 0 ? nextItems.map((item, index) => (
              <div key={`${item.label}-${index}`} className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
                <p className="font-medium text-foreground">{item.label}</p>
                {item.detail && <p className="text-muted-foreground">{item.detail}</p>}
              </div>
            )) : <p className="text-sm text-muted-foreground">No planned items yet.</p>}
          </div>
        </CardContent>
      </Card>
    </section>
  );
};
