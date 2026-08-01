import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, CreditCard, Search, ShoppingCart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useExternalTripBookings } from '@/hooks/useExternalTripBookings';
import { toast } from 'sonner';
import type { ItineraryData } from '@/types/itinerary';
import type { UserRole } from '@/hooks/useAuthenticatedItineraryData';
import { ExternalBookingCard } from './ExternalBookingCard';
import { ExternalBookingDetails } from './ExternalBookingDetails';
import { ExternalBookingForm } from './ExternalBookingForm';
import {
  getMissingExternalBookingDetails,
  type ExternalBookingFormValues,
  type ExternalBookingRow,
  type ItineraryAssociationOption,
} from '@/lib/trip-workspace/external-bookings';

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
  userRole?: UserRole;
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

const getItineraryAssociationOptions = (itineraryData: ItineraryData): ItineraryAssociationOption[] => [
  ...(itineraryData.flights || []).map((item, index) => ({ type: 'flight' as const, id: String(index), label: `Flight · ${item.airline || item.flight_number || `Item ${index + 1}`}` })),
  ...(itineraryData.hotels || []).map((item, index) => ({ type: 'hotel' as const, id: String(index), label: `Hotel · ${item.name || `Item ${index + 1}`}` })),
  ...(itineraryData.activities || []).map((item, index) => ({ type: 'activity' as const, id: String(index), label: `Activity · ${item.name || `Item ${index + 1}`}` })),
  ...(itineraryData.reservations || []).map((item, index) => ({ type: 'reservation' as const, id: String(index), label: `Reservation · ${item.name || `Item ${index + 1}`}` })),
];

const formatMoneyByCurrency = (value: number, currency: string) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    currencyDisplay: 'code',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);

const getReportedTotalsByCurrency = (bookings: ExternalBookingRow[]) =>
  bookings.reduce<Record<string, number>>((totals, booking) => {
    if (booking.total_amount == null) return totals;

    return {
      ...totals,
      [booking.currency]: (totals[booking.currency] || 0) + booking.total_amount,
    };
  }, {});

export const TripWorkspaceBookings = ({ itineraryData, cartItems, cartView, userRole }: TripWorkspaceBookingsProps) => {
  const { user } = useAuth();
  const { bookings, loading, saving, createBooking, updateBooking, archiveBooking } = useExternalTripBookings(itineraryData.id);
  const [formOpen, setFormOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<ExternalBookingRow | null>(null);
  const [detailsBooking, setDetailsBooking] = useState<ExternalBookingRow | null>(null);

  const plannedItems = [
    ...(itineraryData.flights || []).map((item) => ({ type: 'Flight', label: item.airline || item.flight_number || 'Flight' })),
    ...(itineraryData.hotels || []).map((item) => ({ type: 'Hotel', label: item.name || 'Hotel' })),
    ...(itineraryData.activities || []).map((item) => ({ type: 'Activity', label: item.name || 'Activity' })),
    ...(itineraryData.reservations || []).map((item) => ({ type: 'Reservation', label: item.name || 'Reservation' })),
  ];

  const cartTotal = cartItems.reduce((sum, item) => sum + item.price, 0);
  const activeExternalBookings = bookings.filter((booking) => booking.record_status !== 'archived');
  const externalReportedTotalsByCurrency = getReportedTotalsByCurrency(activeExternalBookings);
  const needsAttention = activeExternalBookings.filter((booking) => getMissingExternalBookingDetails(booking).length > 0);
  const itineraryOptions = getItineraryAssociationOptions(itineraryData);
  const canCreateExternalBooking = userRole === 'owner' || userRole === 'collaborator';

  const canEditBooking = (booking: ExternalBookingRow) => userRole === 'owner' || booking.created_by === user?.id;

  const handleSaveExternalBooking = async (values: ExternalBookingFormValues) => {
    try {
      if (editingBooking) {
        await updateBooking(editingBooking.id, values);
      } else {
        await createBooking(values);
      }
      setEditingBooking(null);
    } catch (error) {
      console.error('Failed to save traveler-entered booking:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save traveler-entered booking.');
      throw error;
    }
  };

  const handleArchiveExternalBooking = async (booking: ExternalBookingRow) => {
    if (!window.confirm('Archive this traveler-entered booking? The itinerary item, if any, will not be changed.')) return;
    try {
      await archiveBooking(booking.id);
    } catch (error) {
      console.error('Failed to archive traveler-entered booking:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to archive traveler-entered booking.');
    }
  };

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
          <Button type="button" variant="outline" onClick={() => setFormOpen(true)} disabled={!canCreateExternalBooking} title={canCreateExternalBooking ? undefined : 'Only trip owners and collaborators can add traveler-entered bookings'}>
            <CreditCard className="mr-2 h-4 w-4" />Add a booking made elsewhere
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-card/80 border-border">
        <CardHeader>
          <CardTitle>Cost sources in this workspace</CardTitle>
          <p className="text-sm text-muted-foreground">
            taai cart amounts stay separate from traveler-reported external booking amounts. Manual values are never merged into verified payment or provider-confirmed totals.
          </p>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-muted/40 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Current taai cart</p>
            <p className="mt-2 text-xl font-bold text-foreground">{formatMoney(cartTotal)}</p>
          </div>
          <div className="rounded-xl border border-border bg-muted/40 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Traveler-reported costs</p>
            <div className="mt-2 space-y-1">
              {Object.entries(externalReportedTotalsByCurrency).length > 0 ? (
                Object.entries(externalReportedTotalsByCurrency).map(([currency, total]) => (
                  <p key={currency} className="text-xl font-bold text-foreground">{formatMoneyByCurrency(total, currency)}</p>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Not provided</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
        <Card className="bg-card/80 border-border">
          <CardHeader>
            <CardTitle>Still to book</CardTitle>
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
            <CardTitle>Booked through taai</CardTitle>
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

      <Card className="bg-card/80 border-border">
        <CardHeader>
          <CardTitle>Added by travelers</CardTitle>
          <p className="text-sm text-muted-foreground">
            These bookings were entered manually and remain distinct from bookings completed through taai.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="rounded-xl border border-border bg-muted/40 p-5 text-sm text-muted-foreground">Loading traveler-entered bookings…</div>
          ) : activeExternalBookings.length > 0 ? (
            activeExternalBookings.map((booking) => (
              <ExternalBookingCard
                key={booking.id}
                booking={booking}
                canEdit={canEditBooking(booking)}
                canArchive={canEditBooking(booking)}
                onView={setDetailsBooking}
                onEdit={(selectedBooking) => {
                  setEditingBooking(selectedBooking);
                  setFormOpen(true);
                }}
                onArchive={handleArchiveExternalBooking}
              />
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">
              No outside bookings have been added to this trip yet.
            </div>
          )}
        </CardContent>
      </Card>

      {needsAttention.length > 0 && (
        <Card className="bg-card/80 border-border">
          <CardHeader>
            <CardTitle>Needs attention</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {needsAttention.map((booking) => (
              <div key={booking.id} className="flex items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
                <div>
                  <p className="font-medium text-foreground">{booking.booking_title}</p>
                  <p className="text-muted-foreground">{getMissingExternalBookingDetails(booking).map((detail) => detail.label).join(', ')}</p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => setDetailsBooking(booking)}>Review</Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {cartView}

      <ExternalBookingForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingBooking(null);
        }}
        onSave={handleSaveExternalBooking}
        itineraryOptions={itineraryOptions}
        initialBooking={editingBooking}
        saving={saving}
      />
      <ExternalBookingDetails
        booking={detailsBooking}
        open={Boolean(detailsBooking)}
        onOpenChange={(open) => {
          if (!open) setDetailsBooking(null);
        }}
      />
    </section>
  );
};
