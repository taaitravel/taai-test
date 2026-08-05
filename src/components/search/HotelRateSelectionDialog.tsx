import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, BedDouble, Coffee, CreditCard, Loader2, RefreshCw, ShieldCheck, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useBookingAPI } from '@/hooks/useBookingAPI';
import { buildHotelBookingSnapshot } from '@/lib/booking/hotel-booking';
import { applySelectedHotelRate, normalizeHotelRates, type NormalizedHotelRate } from '@/lib/booking/hotel-rates';
import { formatMoney } from '@/lib/utils';

type UnknownRecord = Record<string, unknown>;

interface HotelRateSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hotel: UnknownRecord;
  searchParams?: UnknownRecord;
  onSelect: (hotelWithRate: UnknownRecord) => void;
}

const stringValue = (...values: unknown[]): string | null => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return null;
};

export const HotelRateSelectionDialog = ({
  open,
  onOpenChange,
  hotel,
  searchParams = {},
  onSelect,
}: HotelRateSelectionDialogProps) => {
  const [rates, setRates] = useState<NormalizedHotelRate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getHotelDetails } = useBookingAPI();
  const booking = useMemo(() => buildHotelBookingSnapshot(hotel, searchParams), [hotel, searchParams]);
  const propertyId = stringValue(hotel.hotel_id, hotel.hotelId, hotel.id)?.replace(/^booking-/, '') || null;
  const hotelName = stringValue(hotel.name, hotel.hotel_name, hotel.hotelName) || 'Property';
  const childrenAge = stringValue(searchParams.children_age, hotel.children_age);

  const loadRates = async () => {
    if (!propertyId || !booking.checkIn || !booking.checkOut) {
      setRates([]);
      setError('Property ID and valid stay dates are required to load rooms.');
      return;
    }
    if (booking.children > 0 && !childrenAge) {
      setRates([]);
      setError('Add each child’s age to the search before loading exact room rates. Providers price children by age, not count alone.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await getHotelDetails(propertyId, {
        arrival_date: booking.checkIn,
        departure_date: booking.checkOut,
        adults: booking.adults,
        children_age: childrenAge || undefined,
        room_qty: booking.rooms,
        currency_code: booking.currency,
      });
      if (response.error || !response.data) {
        setRates([]);
        setError(response.error || 'The provider did not return room availability.');
        return;
      }
      const nextRates = normalizeHotelRates(response.data, booking);
      setRates(nextRates);
      if (nextRates.length === 0) {
        setError('No priced room options were returned for these dates and guests.');
      }
    } catch (caught) {
      setRates([]);
      setError(caught instanceof Error ? caught.message : 'Unable to load rooms and rates.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) void loadRates();
    // The provider call should re-run only when the dialog or exact search changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, propertyId, booking.checkIn, booking.checkOut, booking.adults, booking.children, booking.rooms, childrenAge]);

  const selectRate = (rate: NormalizedHotelRate) => {
    onSelect(applySelectedHotelRate(hotel, rate, booking));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Select a room and rate</DialogTitle>
          <DialogDescription>
            {hotelName} · {booking.checkIn || 'No check-in'} to {booking.checkOut || 'No check-out'} · {booking.adults + booking.children} traveler{booking.adults + booking.children === 1 ? '' : 's'} · {booking.rooms} room{booking.rooms === 1 ? '' : 's'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {loading && (
            <div className="py-16 flex flex-col items-center gap-3 text-muted-foreground">
              <Loader2 className="h-7 w-7 animate-spin" />
              <span>Checking rooms, prices, and policies…</span>
            </div>
          )}

          {!loading && error && (
            <Card className="border-amber-500/30">
              <CardContent className="py-6 space-y-4">
                <div className="flex gap-3 text-sm">
                  <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                  <div>
                    <div className="font-medium">Rooms are not selectable yet</div>
                    <div className="text-muted-foreground mt-1">{error}</div>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => void loadRates()}>
                  <RefreshCw className="h-4 w-4 mr-2" /> Retry availability
                </Button>
              </CardContent>
            </Card>
          )}

          {!loading && rates.map((rate) => (
            <Card key={rate.id} className="overflow-hidden">
              <CardContent className="p-5">
                <div className="grid gap-5 md:grid-cols-[1fr_auto]">
                  <div className="space-y-3 min-w-0">
                    <div>
                      <div className="font-semibold text-base">{rate.roomName}</div>
                      <div className="text-sm text-muted-foreground">{rate.rateName}</div>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                      {rate.bedConfiguration && <span className="flex items-center gap-1"><BedDouble className="h-4 w-4" />{rate.bedConfiguration}</span>}
                      {rate.maxOccupancy && <span className="flex items-center gap-1"><Users className="h-4 w-4" />Sleeps {rate.maxOccupancy}</span>}
                      {rate.mealPlan && <span className="flex items-center gap-1"><Coffee className="h-4 w-4" />{rate.mealPlan}</span>}
                      {rate.paymentTiming && <span className="flex items-center gap-1"><CreditCard className="h-4 w-4" />{rate.paymentTiming}</span>}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className={rate.cancellationType === 'free_cancellation' ? 'border-emerald-500/40 text-emerald-600' : ''}>
                        <ShieldCheck className="h-3 w-3 mr-1" /> {rate.cancellationSummary}
                      </Badge>
                      {rate.roomsLeft !== null && rate.roomsLeft <= 5 && (
                        <Badge variant="outline" className="border-amber-500/40 text-amber-600">{rate.roomsLeft} left</Badge>
                      )}
                    </div>
                  </div>

                  <div className="md:text-right flex md:flex-col items-end justify-between gap-3">
                    <div>
                      <div className="text-xl font-semibold">{formatMoney(rate.totalPrice, rate.currency)}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatMoney(rate.pricePerNight, rate.currency)} per night · total stay
                      </div>
                    </div>
                    <Button onClick={() => selectRate(rate)}>Select rate</Button>
                    <div className="text-[11px] text-muted-foreground max-w-[190px]">
                      {rate.supplierBookable
                        ? 'Provider supplied checkout evidence.'
                        : 'Exact rate saved; provider booking confirmation is still required.'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
