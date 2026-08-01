import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  DEFAULT_EXTERNAL_BOOKING_FORM_VALUES,
  EXTERNAL_BOOKING_CATEGORIES,
  EXTERNAL_BOOKING_PAYMENT_STATUSES,
  formValuesFromBooking,
  formatReportedMoney,
  parseOptionalMoney,
  parseTravelerNames,
  type ExternalBookingAssociationType,
  type ExternalBookingCategory,
  type ExternalBookingFormValues,
  type ExternalBookingPaymentStatus,
  type ExternalBookingRow,
  type ItineraryAssociationOption,
} from '@/lib/trip-workspace/external-bookings';

interface ExternalBookingFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (values: ExternalBookingFormValues) => Promise<void>;
  itineraryOptions: ItineraryAssociationOption[];
  initialBooking?: ExternalBookingRow | null;
  saving?: boolean;
}

type FormStep = 'entry' | 'review';

const categoryLabel = (category: ExternalBookingCategory) =>
  category.charAt(0).toUpperCase() + category.slice(1);

const paymentLabel = (status: ExternalBookingPaymentStatus) => {
  switch (status) {
    case 'reported_paid':
      return 'Reported paid';
    case 'partially_paid':
      return 'Partially paid';
    case 'unpaid':
      return 'Unpaid';
    case 'unknown':
    default:
      return 'Unknown';
  }
};

const fieldCopy = (category: ExternalBookingCategory) => {
  switch (category) {
    case 'flight':
    case 'rail':
    case 'transfer':
    case 'cruise':
      return { origin: 'Origin', destination: 'Destination', location: 'Location / terminal' };
    case 'hotel':
      return { origin: 'Check-in location', destination: 'Check-out location', location: 'Hotel location' };
    case 'car':
      return { origin: 'Pickup location', destination: 'Drop-off location', location: 'Rental office / location' };
    case 'activity':
    case 'restaurant':
    case 'other':
    default:
      return { origin: 'Origin', destination: 'Destination', location: 'Location' };
  }
};

const validateForReview = (values: ExternalBookingFormValues) => {
  if (!values.category) return 'Category is required.';
  if (!values.providerName.trim()) return 'Provider is required.';
  if (!values.bookingTitle.trim()) return 'Booking title is required.';
  if (!values.startAt) return 'Start date and time are required.';
  if (!values.currency.trim()) return 'Currency is required.';
  if (!/^[A-Za-z]{3}$/.test(values.currency.trim())) return 'Currency must be a 3-letter code such as USD.';

  const totalAmount = parseOptionalMoney(values.totalAmount);
  const amountPaid = parseOptionalMoney(values.amountPaid);
  const amountRemaining = parseOptionalMoney(values.amountRemaining);
  const refundableAmount = parseOptionalMoney(values.refundableAmount);
  const moneyValues = [totalAmount, amountPaid, amountRemaining, refundableAmount];
  if (moneyValues.some((value) => value != null && value < 0)) return 'Money amounts cannot be negative.';
  if (totalAmount != null && amountPaid != null && amountPaid > totalAmount) return 'Amount paid cannot exceed total amount.';
  if (totalAmount != null && amountRemaining != null && amountRemaining > totalAmount) return 'Amount remaining cannot exceed total amount.';
  if (totalAmount != null && refundableAmount != null && refundableAmount > totalAmount) return 'Refundable amount cannot exceed total amount.';

  if (values.associatedItineraryItemType && !values.associatedItineraryItemId) return 'Choose an itinerary item or clear the association.';
  return null;
};

export const ExternalBookingForm = ({
  open,
  onOpenChange,
  onSave,
  itineraryOptions,
  initialBooking,
  saving = false,
}: ExternalBookingFormProps) => {
  const [step, setStep] = useState<FormStep>('entry');
  const [values, setValues] = useState<ExternalBookingFormValues>(DEFAULT_EXTERNAL_BOOKING_FORM_VALUES);
  const [error, setError] = useState<string | null>(null);
  const saveInFlightRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    setStep('entry');
    setError(null);
    setValues(initialBooking ? formValuesFromBooking(initialBooking) : DEFAULT_EXTERNAL_BOOKING_FORM_VALUES);
  }, [initialBooking, open]);

  const copy = fieldCopy(values.category);
  const selectedAssociation = useMemo(
    () => itineraryOptions.find((option) => option.type === values.associatedItineraryItemType && option.id === values.associatedItineraryItemId),
    [itineraryOptions, values.associatedItineraryItemId, values.associatedItineraryItemType],
  );

  const updateField = <K extends keyof ExternalBookingFormValues>(field: K, value: ExternalBookingFormValues[K]) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  const handleReview = () => {
    const validationError = validateForReview(values);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setStep('review');
  };

  const handleSave = async () => {
    if (saveInFlightRef.current) return;

    const validationError = validateForReview(values);
    if (validationError) {
      setError(validationError);
      setStep('entry');
      return;
    }

    saveInFlightRef.current = true;
    try {
      await onSave(values);
      onOpenChange(false);
    } finally {
      saveInFlightRef.current = false;
    }
  };

  const associationValue = values.associatedItineraryItemType && values.associatedItineraryItemId
    ? `${values.associatedItineraryItemType}:${values.associatedItineraryItemId}`
    : 'none';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{initialBooking ? 'Edit traveler-entered booking' : 'Add a booking made elsewhere'}</DialogTitle>
          <DialogDescription>
            Add booking details you already have from another provider. taai will label this as traveler-entered and unverified.
          </DialogDescription>
        </DialogHeader>

        {step === 'entry' ? (
          <div className="space-y-5">
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-muted-foreground">
              Do not enter payment-card numbers, CVV, passport numbers, government IDs, provider passwords, or traveler documents.
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={values.category} onValueChange={(value: ExternalBookingCategory) => updateField('category', value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EXTERNAL_BOOKING_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>{categoryLabel(category)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Provider</Label>
                <Input value={values.providerName} onChange={(event) => updateField('providerName', event.target.value)} placeholder="American Airlines, Booking.com, Avis, Viator" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Booking title</Label>
                <Input value={values.bookingTitle} onChange={(event) => updateField('bookingTitle', event.target.value)} placeholder="Flight to Rome, hotel in Paris, rental car" />
              </div>
              <div className="space-y-2">
                <Label>Start date/time</Label>
                <Input type="datetime-local" value={values.startAt} onChange={(event) => updateField('startAt', event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>End date/time</Label>
                <Input type="datetime-local" value={values.endAt} onChange={(event) => updateField('endAt', event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{copy.origin}</Label>
                <Input value={values.origin} onChange={(event) => updateField('origin', event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{copy.destination}</Label>
                <Input value={values.destination} onChange={(event) => updateField('destination', event.target.value)} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>{copy.location}</Label>
                <Input value={values.location} onChange={(event) => updateField('location', event.target.value)} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Travelers</Label>
                <Textarea value={values.travelerNames} onChange={(event) => updateField('travelerNames', event.target.value)} placeholder="Names as shown on the booking, separated by commas or lines" />
                <p className="text-xs text-muted-foreground">Names are treated as manually entered booking details, not identity verification.</p>
              </div>
              <div className="space-y-2">
                <Label>Confirmation number</Label>
                <Input value={values.confirmationNumber} onChange={(event) => updateField('confirmationNumber', event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Booking URL</Label>
                <Input value={values.bookingUrl} onChange={(event) => updateField('bookingUrl', event.target.value)} placeholder="https://" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Provider contact</Label>
                <Input value={values.providerContact} onChange={(event) => updateField('providerContact', event.target.value)} placeholder="Phone, email, or support link" />
              </div>
              <div className="space-y-2">
                <Label>Payment status</Label>
                <Select value={values.paymentStatus} onValueChange={(value: ExternalBookingPaymentStatus) => updateField('paymentStatus', value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EXTERNAL_BOOKING_PAYMENT_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>{paymentLabel(status)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Input value={values.currency} maxLength={3} onChange={(event) => updateField('currency', event.target.value.toUpperCase())} />
              </div>
              <div className="space-y-2">
                <Label>Total amount</Label>
                <Input type="number" min="0" step="0.01" value={values.totalAmount} onChange={(event) => updateField('totalAmount', event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Amount paid</Label>
                <Input type="number" min="0" step="0.01" value={values.amountPaid} onChange={(event) => updateField('amountPaid', event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Amount remaining</Label>
                <Input type="number" min="0" step="0.01" value={values.amountRemaining} onChange={(event) => updateField('amountRemaining', event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Refundable amount</Label>
                <Input type="number" min="0" step="0.01" value={values.refundableAmount} onChange={(event) => updateField('refundableAmount', event.target.value)} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Cancellation terms</Label>
                <Textarea value={values.cancellationTerms} onChange={(event) => updateField('cancellationTerms', event.target.value)} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Associate with itinerary item</Label>
                <Select
                  value={associationValue}
                  onValueChange={(value) => {
                    if (value === 'none') {
                      updateField('associatedItineraryItemType', '');
                      updateField('associatedItineraryItemId', '');
                      return;
                    }
                    const [type, id] = value.split(':') as [ExternalBookingAssociationType, string];
                    updateField('associatedItineraryItemType', type);
                    updateField('associatedItineraryItemId', id);
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No association</SelectItem>
                    {itineraryOptions.map((option) => (
                      <SelectItem key={`${option.type}:${option.id}`} value={`${option.type}:${option.id}`}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Associating a booking does not change the itinerary item.</p>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Notes</Label>
                <Textarea value={values.notes} onChange={(event) => updateField('notes', event.target.value)} />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/40 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium text-foreground">Review traveler-entered booking details</p>
                  <p className="text-sm text-muted-foreground">This will be labeled “Added by traveler” and “Booked outside taai.” It will not be treated as provider-confirmed by taai.</p>
                </div>
              </div>
            </div>
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <ReviewLine label="Provider" value={values.providerName} />
              <ReviewLine label="Title" value={values.bookingTitle} />
              <ReviewLine label="Category" value={categoryLabel(values.category)} />
              <ReviewLine label="Travelers" value={parseTravelerNames(values.travelerNames).join(', ') || 'Not provided'} />
              <ReviewLine label="Confirmation" value={values.confirmationNumber || 'Not provided'} />
              <ReviewLine label="Payment" value={paymentLabel(values.paymentStatus)} />
              <ReviewLine label="Reported total" value={formatReportedMoney(parseOptionalMoney(values.totalAmount), values.currency || 'USD')} />
              <ReviewLine label="Reported paid" value={formatReportedMoney(parseOptionalMoney(values.amountPaid), values.currency || 'USD')} />
              <ReviewLine label="Reported remaining" value={formatReportedMoney(parseOptionalMoney(values.amountRemaining), values.currency || 'USD')} />
              <ReviewLine label="Reported refundable" value={formatReportedMoney(parseOptionalMoney(values.refundableAmount), values.currency || 'USD')} />
              <ReviewLine label="Association" value={selectedAssociation?.label || 'No itinerary association'} />
            </div>
          </div>
        )}

        {error && (
          <div className="flex gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />{error}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          {step === 'review' && <Button type="button" variant="outline" onClick={() => setStep('entry')}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>}
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          {step === 'entry' ? (
            <Button type="button" onClick={handleReview}>Review</Button>
          ) : (
            <Button type="button" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save traveler-entered booking'}</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const ReviewLine = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg border border-border bg-card/60 p-3">
    <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
    <p className="mt-1 font-medium text-foreground">{value}</p>
  </div>
);
