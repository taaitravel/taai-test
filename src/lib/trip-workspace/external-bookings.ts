import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export const EXTERNAL_BOOKING_CATEGORIES = [
  'flight',
  'hotel',
  'car',
  'activity',
  'restaurant',
  'rail',
  'transfer',
  'cruise',
  'other',
] as const;

export const EXTERNAL_BOOKING_PAYMENT_STATUSES = [
  'unknown',
  'unpaid',
  'partially_paid',
  'reported_paid',
] as const;

export const EXTERNAL_BOOKING_RECORD_STATUSES = ['active', 'needs_details', 'archived'] as const;

export type ExternalBookingCategory = (typeof EXTERNAL_BOOKING_CATEGORIES)[number];
export type ExternalBookingPaymentStatus = (typeof EXTERNAL_BOOKING_PAYMENT_STATUSES)[number];
export type ExternalBookingRecordStatus = (typeof EXTERNAL_BOOKING_RECORD_STATUSES)[number];
export type ExternalBookingSource = 'external_manual';
export type ExternalBookingEvidenceType = 'user_reported';
export type ExternalBookingEvidenceQuality = 'unverified';
export type ExternalBookingAssociationType = 'flight' | 'hotel' | 'activity' | 'reservation';

export interface ExternalBookingRow {
  id: string;
  itinerary_id: number;
  created_by: string;
  updated_by: string;
  source: ExternalBookingSource;
  record_status: ExternalBookingRecordStatus;
  category: ExternalBookingCategory;
  provider_name: string;
  booking_title: string;
  traveler_names: string[];
  start_at: string;
  end_at: string | null;
  origin: string | null;
  destination: string | null;
  location: string | null;
  confirmation_number: string | null;
  booking_url: string | null;
  provider_contact: string | null;
  payment_status: ExternalBookingPaymentStatus;
  total_amount: number | null;
  amount_paid: number | null;
  amount_remaining: number | null;
  currency: string;
  cancellation_terms: string | null;
  refundable_amount: number | null;
  notes: string | null;
  associated_itinerary_item_type: ExternalBookingAssociationType | null;
  associated_itinerary_item_id: string | null;
  evidence_type: ExternalBookingEvidenceType;
  evidence_quality: ExternalBookingEvidenceQuality;
  manually_reported: boolean;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export type ExternalBookingInsert = Omit<ExternalBookingRow, 'id' | 'created_at' | 'updated_at'>;
export type ExternalBookingUpdate = Partial<Omit<ExternalBookingRow, 'id' | 'created_at' | 'created_by'>>;

export interface ExternalBookingFormValues {
  category: ExternalBookingCategory;
  providerName: string;
  bookingTitle: string;
  travelerNames: string;
  startAt: string;
  endAt: string;
  origin: string;
  destination: string;
  location: string;
  confirmationNumber: string;
  bookingUrl: string;
  providerContact: string;
  paymentStatus: ExternalBookingPaymentStatus;
  totalAmount: string;
  amountPaid: string;
  amountRemaining: string;
  currency: string;
  cancellationTerms: string;
  refundableAmount: string;
  notes: string;
  associatedItineraryItemType: ExternalBookingAssociationType | '';
  associatedItineraryItemId: string;
}

export interface ItineraryAssociationOption {
  type: ExternalBookingAssociationType;
  id: string;
  label: string;
}

export interface MissingExternalBookingDetail {
  id: string;
  label: string;
}

interface ExternalBookingsDatabase {
  public: {
    Tables: {
      trip_external_bookings: {
        Row: ExternalBookingRow;
        Insert: ExternalBookingInsert;
        Update: ExternalBookingUpdate;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export const externalBookingsClient = supabase as unknown as SupabaseClient<ExternalBookingsDatabase>;

export const DEFAULT_EXTERNAL_BOOKING_FORM_VALUES: ExternalBookingFormValues = {
  category: 'flight',
  providerName: '',
  bookingTitle: '',
  travelerNames: '',
  startAt: '',
  endAt: '',
  origin: '',
  destination: '',
  location: '',
  confirmationNumber: '',
  bookingUrl: '',
  providerContact: '',
  paymentStatus: 'unknown',
  totalAmount: '',
  amountPaid: '',
  amountRemaining: '',
  currency: 'USD',
  cancellationTerms: '',
  refundableAmount: '',
  notes: '',
  associatedItineraryItemType: '',
  associatedItineraryItemId: '',
};

const cleanText = (value: string) => value.trim();

export const parseTravelerNames = (value: string) =>
  value
    .split(/[\n,]/)
    .map((name) => cleanText(name))
    .filter(Boolean);

export const parseOptionalMoney = (value: string): number | null => {
  const cleaned = cleanText(value);
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) / 100 : null;
};

export const normalizeCurrency = (value: string) => {
  const cleaned = cleanText(value).toUpperCase();
  return cleaned || 'USD';
};

export const toDatetimeLocalValue = (value: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
};

export const fromDatetimeLocalValue = (value: string) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

export const formValuesFromBooking = (booking: ExternalBookingRow): ExternalBookingFormValues => ({
  category: booking.category,
  providerName: booking.provider_name,
  bookingTitle: booking.booking_title,
  travelerNames: booking.traveler_names.join(', '),
  startAt: toDatetimeLocalValue(booking.start_at),
  endAt: toDatetimeLocalValue(booking.end_at),
  origin: booking.origin || '',
  destination: booking.destination || '',
  location: booking.location || '',
  confirmationNumber: booking.confirmation_number || '',
  bookingUrl: booking.booking_url || '',
  providerContact: booking.provider_contact || '',
  paymentStatus: booking.payment_status,
  totalAmount: booking.total_amount == null ? '' : String(booking.total_amount),
  amountPaid: booking.amount_paid == null ? '' : String(booking.amount_paid),
  amountRemaining: booking.amount_remaining == null ? '' : String(booking.amount_remaining),
  currency: booking.currency,
  cancellationTerms: booking.cancellation_terms || '',
  refundableAmount: booking.refundable_amount == null ? '' : String(booking.refundable_amount),
  notes: booking.notes || '',
  associatedItineraryItemType: booking.associated_itinerary_item_type || '',
  associatedItineraryItemId: booking.associated_itinerary_item_id || '',
});

export const getMissingExternalBookingDetails = (booking: ExternalBookingRow): MissingExternalBookingDetail[] => {
  const missing: MissingExternalBookingDetail[] = [];

  if (!booking.confirmation_number) missing.push({ id: 'confirmation', label: 'Needs confirmation details' });
  if (booking.payment_status === 'unknown') missing.push({ id: 'payment', label: 'Needs payment details' });
  if (!booking.start_at || !booking.end_at) missing.push({ id: 'dates', label: 'Needs dates' });
  if (booking.traveler_names.length === 0) missing.push({ id: 'travelers', label: 'Needs traveler assignment' });
  if (!booking.cancellation_terms) missing.push({ id: 'cancellation', label: 'Needs cancellation details' });
  if (!booking.provider_contact) missing.push({ id: 'contact', label: 'Needs provider contact' });
  if (booking.total_amount == null && booking.amount_paid == null && booking.amount_remaining == null) {
    missing.push({ id: 'cost', label: 'Needs cost information' });
  }

  return missing;
};

export const formatReportedMoney = (value: number | null, currency: string) => {
  if (value == null) return 'Not provided';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(value);
};

export const paymentStatusLabel = (status: ExternalBookingPaymentStatus) => {
  switch (status) {
    case 'reported_paid':
      return 'Reported paid';
    case 'partially_paid':
      return 'Partially paid, reported by traveler';
    case 'unpaid':
      return 'Reported unpaid';
    case 'unknown':
    default:
      return 'Payment status unknown';
  }
};
