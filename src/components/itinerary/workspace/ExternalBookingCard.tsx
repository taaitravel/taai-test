import { Archive, CalendarDays, Edit, Eye, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  formatReportedMoney,
  getMissingExternalBookingDetails,
  paymentStatusLabel,
  type ExternalBookingRow,
} from '@/lib/trip-workspace/external-bookings';

interface ExternalBookingCardProps {
  booking: ExternalBookingRow;
  canEdit: boolean;
  canArchive: boolean;
  onView: (booking: ExternalBookingRow) => void;
  onEdit: (booking: ExternalBookingRow) => void;
  onArchive: (booking: ExternalBookingRow) => void;
}

const dateLabel = (booking: ExternalBookingRow) => {
  const start = new Date(booking.start_at).toLocaleString();
  const end = booking.end_at ? new Date(booking.end_at).toLocaleString() : null;
  return end ? `${start} – ${end}` : start;
};

export const ExternalBookingCard = ({
  booking,
  canEdit,
  canArchive,
  onView,
  onEdit,
  onArchive,
}: ExternalBookingCardProps) => {
  const missingDetails = getMissingExternalBookingDetails(booking);
  const location = booking.location || [booking.origin, booking.destination].filter(Boolean).join(' → ');

  return (
    <Card className="border-border bg-card/80">
      <CardContent className="space-y-4 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">Added by traveler</Badge>
              <Badge variant="outline">Booked outside taai</Badge>
              {booking.record_status === 'needs_details' && <Badge variant="outline">Needs attention</Badge>}
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{booking.booking_title}</h3>
              <p className="text-sm text-muted-foreground">{booking.provider_name} · {booking.category}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onView(booking)}>
              <Eye className="mr-2 h-4 w-4" />Details
            </Button>
            {canEdit && (
              <Button type="button" variant="outline" size="sm" onClick={() => onEdit(booking)}>
                <Edit className="mr-2 h-4 w-4" />Edit
              </Button>
            )}
            {canArchive && (
              <Button type="button" variant="ghost" size="sm" onClick={() => onArchive(booking)}>
                <Archive className="mr-2 h-4 w-4" />Archive
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-3 text-sm sm:grid-cols-3">
          <div className="flex gap-2 rounded-lg border border-border bg-muted/40 p-3">
            <CalendarDays className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Dates</p>
              <p className="font-medium text-foreground">{dateLabel(booking)}</p>
            </div>
          </div>
          <div className="flex gap-2 rounded-lg border border-border bg-muted/40 p-3">
            <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Location</p>
              <p className="font-medium text-foreground">{location || 'Not provided'}</p>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground">Reported cost</p>
            <p className="font-medium text-foreground">{formatReportedMoney(booking.total_amount, booking.currency)}</p>
            <p className="text-xs text-muted-foreground">{paymentStatusLabel(booking.payment_status)}</p>
          </div>
        </div>

        {missingDetails.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {missingDetails.map((detail) => (
              <Badge key={detail.id} variant="outline" className="border-amber-500/40 text-amber-700 dark:text-amber-400">
                {detail.label}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
