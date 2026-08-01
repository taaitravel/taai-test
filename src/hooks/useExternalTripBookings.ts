import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  externalBookingsClient,
  fromDatetimeLocalValue,
  normalizeCurrency,
  parseOptionalMoney,
  parseTravelerNames,
  type ExternalBookingFormValues,
  type ExternalBookingInsert,
  type ExternalBookingRecordStatus,
  type ExternalBookingRow,
  type ExternalBookingUpdate,
} from '@/lib/trip-workspace/external-bookings';

const cleanText = (value: string) => value.trim();
const nullableText = (value: string) => {
  const cleaned = cleanText(value);
  return cleaned || null;
};

const resolveRecordStatus = (values: ExternalBookingFormValues): ExternalBookingRecordStatus => {
  const hasMissingRequiredDetails =
    parseTravelerNames(values.travelerNames).length === 0 ||
    !cleanText(values.confirmationNumber) ||
    values.paymentStatus === 'unknown' ||
    !cleanText(values.cancellationTerms) ||
    !cleanText(values.providerContact) ||
    (!cleanText(values.totalAmount) && !cleanText(values.amountPaid) && !cleanText(values.amountRemaining));

  return hasMissingRequiredDetails ? 'needs_details' : 'active';
};

const validateMoney = (label: string, rawValue: string) => {
  if (!cleanText(rawValue)) return null;
  const value = parseOptionalMoney(rawValue);
  if (value == null || value < 0) {
    throw new Error(`${label} must be zero or greater.`);
  }
  return value;
};

const buildMutationPayload = (
  itineraryId: number,
  userId: string,
  values: ExternalBookingFormValues,
): ExternalBookingInsert => {
  const startAt = fromDatetimeLocalValue(values.startAt);
  if (!startAt) throw new Error('Start date and time are required.');

  const endAt = fromDatetimeLocalValue(values.endAt);
  const totalAmount = validateMoney('Total amount', values.totalAmount);
  const amountPaid = validateMoney('Amount paid', values.amountPaid);
  const amountRemaining = validateMoney('Amount remaining', values.amountRemaining);
  const refundableAmount = validateMoney('Refundable amount', values.refundableAmount);

  if (totalAmount != null && amountPaid != null && amountPaid > totalAmount) {
    throw new Error('Amount paid cannot exceed total amount.');
  }

  if (totalAmount != null && amountRemaining != null && amountRemaining > totalAmount) {
    throw new Error('Amount remaining cannot exceed total amount.');
  }

  if (totalAmount != null && refundableAmount != null && refundableAmount > totalAmount) {
    throw new Error('Refundable amount cannot exceed total amount.');
  }

  const currency = normalizeCurrency(values.currency);
  if (!/^[A-Z]{3}$/.test(currency)) {
    throw new Error('Currency must be a 3-letter code such as USD.');
  }

  const associationType = values.associatedItineraryItemType || null;
  const associationId = cleanText(values.associatedItineraryItemId) || null;

  return {
    itinerary_id: itineraryId,
    created_by: userId,
    updated_by: userId,
    source: 'external_manual',
    record_status: resolveRecordStatus(values),
    category: values.category,
    provider_name: cleanText(values.providerName),
    booking_title: cleanText(values.bookingTitle),
    traveler_names: parseTravelerNames(values.travelerNames),
    start_at: startAt,
    end_at: endAt,
    origin: nullableText(values.origin),
    destination: nullableText(values.destination),
    location: nullableText(values.location),
    confirmation_number: nullableText(values.confirmationNumber),
    booking_url: nullableText(values.bookingUrl),
    provider_contact: nullableText(values.providerContact),
    payment_status: values.paymentStatus,
    total_amount: totalAmount,
    amount_paid: amountPaid,
    amount_remaining: amountRemaining,
    currency,
    cancellation_terms: nullableText(values.cancellationTerms),
    refundable_amount: refundableAmount,
    notes: nullableText(values.notes),
    associated_itinerary_item_type: associationType,
    associated_itinerary_item_id: associationType ? associationId : null,
    evidence_type: 'user_reported',
    evidence_quality: 'unverified',
    manually_reported: true,
    archived_at: null,
  };
};

const buildUpdatePayload = (
  itineraryId: number,
  userId: string,
  values: ExternalBookingFormValues,
): ExternalBookingUpdate => {
  const insertPayload = buildMutationPayload(itineraryId, userId, values);
  const { created_by: _createdBy, ...updatePayload } = insertPayload;
  return updatePayload;
};

export const useExternalTripBookings = (itineraryId: number | null) => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<ExternalBookingRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchBookings = useCallback(async () => {
    if (!itineraryId) {
      setBookings([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await externalBookingsClient
        .from('trip_external_bookings')
        .select('*')
        .eq('itinerary_id', itineraryId)
        .is('archived_at', null)
        .order('start_at', { ascending: true });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Error loading external bookings:', error);
      toast.error('Failed to load traveler-entered bookings.');
    } finally {
      setLoading(false);
    }
  }, [itineraryId]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const createBooking = async (values: ExternalBookingFormValues) => {
    if (!itineraryId || !user?.id) throw new Error('You must be signed in to add a booking.');

    setSaving(true);
    try {
      const payload = buildMutationPayload(itineraryId, user.id, values);
      const { error } = await externalBookingsClient
        .from('trip_external_bookings')
        .insert(payload);

      if (error) throw error;
      toast.success('Booking details added to your trip. This information was entered manually and has not been independently confirmed by taai or the provider.');
      await fetchBookings();
    } finally {
      setSaving(false);
    }
  };

  const updateBooking = async (bookingId: string, values: ExternalBookingFormValues) => {
    if (!itineraryId || !user?.id) throw new Error('You must be signed in to edit a booking.');

    setSaving(true);
    try {
      const payload = buildUpdatePayload(itineraryId, user.id, values);
      const { error } = await externalBookingsClient
        .from('trip_external_bookings')
        .update(payload)
        .eq('id', bookingId)
        .eq('itinerary_id', itineraryId);

      if (error) throw error;
      toast.success('Traveler-entered booking details updated.');
      await fetchBookings();
    } finally {
      setSaving(false);
    }
  };

  const archiveBooking = async (bookingId: string) => {
    if (!itineraryId || !user?.id) throw new Error('You must be signed in to archive a booking.');

    const { error } = await externalBookingsClient
      .from('trip_external_bookings')
      .update({
        record_status: 'archived',
        archived_at: new Date().toISOString(),
        updated_by: user.id,
      })
      .eq('id', bookingId)
      .eq('itinerary_id', itineraryId);

    if (error) throw error;
    toast.success('Traveler-entered booking archived. The itinerary item, if present, was not changed.');
    await fetchBookings();
  };

  return {
    bookings,
    loading,
    saving,
    refresh: fetchBookings,
    createBooking,
    updateBooking,
    archiveBooking,
  };
};
