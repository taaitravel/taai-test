import { ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  formatReportedMoney,
  getMissingExternalBookingDetails,
  paymentStatusLabel,
  type ExternalBookingRow,
} from '@/lib/trip-workspace/external-bookings';

interface ExternalBookingDetailsProps {
  booking: ExternalBookingRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const valueOrMissing = (value: string | null | undefined) => value || 'Not provided';

export const ExternalBookingDetails = ({ booking, open, onOpenChange }: ExternalBookingDetailsProps) => {
  if (!booking) return null;

  const missingDetails = getMissingExternalBookingDetails(booking);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{booking.booking_title}</DialogTitle>
          <DialogDescription>
            Added by traveler · Booked outside taai · Not independently confirmed by taai or the provider.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Added by traveler</Badge>
            <Badge variant="outline">Booked outside taai</Badge>
            <Badge variant="outline">Evidence: user reported</Badge>
            <Badge variant="outline">Quality: unverified</Badge>
          </div>

          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <DetailLine label="Provider" value={booking.provider_name} />
            <DetailLine label="Category" value={booking.category} />
            <DetailLine label="Travelers" value={booking.traveler_names.length > 0 ? booking.traveler_names.join(', ') : 'Not provided'} />
            <DetailLine label="Dates" value={`${new Date(booking.start_at).toLocaleString()}${booking.end_at ? ` – ${new Date(booking.end_at).toLocaleString()}` : ''}`} />
            <DetailLine label="Origin" value={valueOrMissing(booking.origin)} />
            <DetailLine label="Destination" value={valueOrMissing(booking.destination)} />
            <DetailLine label="Location" value={valueOrMissing(booking.location)} />
            <DetailLine label="Confirmation number provided by traveler" value={valueOrMissing(booking.confirmation_number)} />
            <DetailLine label="Payment reported by traveler" value={paymentStatusLabel(booking.payment_status)} />
            <DetailLine label="Reported total" value={formatReportedMoney(booking.total_amount, booking.currency)} />
            <DetailLine label="Reported paid" value={formatReportedMoney(booking.amount_paid, booking.currency)} />
            <DetailLine label="Reported remaining" value={formatReportedMoney(booking.amount_remaining, booking.currency)} />
            <DetailLine label="Refundability reported by traveler" value={formatReportedMoney(booking.refundable_amount, booking.currency)} />
            <DetailLine label="Provider contact" value={valueOrMissing(booking.provider_contact)} />
            <DetailLine label="Cancellation details provided by traveler" value={valueOrMissing(booking.cancellation_terms)} />
            <DetailLine label="Notes" value={valueOrMissing(booking.notes)} />
          </div>

          {booking.booking_url && (
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <a href={booking.booking_url} target="_blank" rel="noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />Open provider booking link
              </a>
            </Button>
          )}

          {missingDetails.length > 0 && (
            <div className="rounded-lg border border-border bg-muted/40 p-4">
              <p className="text-sm font-medium text-foreground">Missing details</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {missingDetails.map((detail) => (
                  <Badge key={detail.id} variant="outline" className="border-amber-500/40 text-amber-700 dark:text-amber-400">
                    {detail.label}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const DetailLine = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg border border-border bg-card/60 p-3">
    <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
    <p className="mt-1 whitespace-pre-wrap break-words font-medium text-foreground">{value}</p>
  </div>
);
