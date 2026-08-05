import {
  buildDateRangeServiceTiming,
  buildServiceLocation,
  emptyEarningsContract,
} from './booking-contract';
import type { Json } from '@/integrations/supabase/types';
import { asDateOnly, differenceInDateOnlyDays } from '@/lib/date-time';

type UnknownRecord = Record<string, unknown>;

const asRecord = (value: unknown): UnknownRecord =>
  value && typeof value === 'object' ? value as UnknownRecord : {};

export interface HotelBookingSnapshot {
  checkIn: string | null;
  checkOut: string | null;
  nights: number;
  rooms: number;
  adults: number;
  children: number;
  currency: string;
  pricePerNight: number;
  totalPrice: number;
  issues: string[];
}

const asPositiveNumber = (...values: unknown[]): number | null => {
  for (const value of values) {
    const parsed = typeof value === 'number' ? value : Number(value);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return null;
};

const firstDateOnly = (...values: unknown[]): string | null => {
  for (const value of values) {
    const dateOnly = asDateOnly(value);
    if (dateOnly) return dateOnly;
  }
  return null;
};

export const nightsBetween = (checkIn: string | null, checkOut: string | null): number => {
  return differenceInDateOnlyDays(checkIn, checkOut);
};

export const buildHotelBookingSnapshot = (
  hotel: UnknownRecord,
  searchParams: UnknownRecord = {},
): HotelBookingSnapshot => {
  const serviceDates = asRecord(hotel.service_dates);
  const occupancy = asRecord(hotel.occupancy);
  const pricing = asRecord(hotel.pricing);
  const priceBreakdown = asRecord(hotel.priceBreakdown);
  const grossPrice = asRecord(priceBreakdown.grossPrice);

  const checkIn = firstDateOnly(
    searchParams.checkin,
    searchParams.check_in,
    hotel.check_in,
    serviceDates.check_in,
    serviceDates.checkIn,
    hotel.checkin,
    hotel.checkInDate,
    hotel.checkIn,
  );
  const checkOut = firstDateOnly(
    searchParams.checkout,
    searchParams.check_out,
    hotel.check_out,
    serviceDates.check_out,
    serviceDates.checkOut,
    hotel.checkout,
    hotel.checkOutDate,
    hotel.checkOut,
  );

  const calculatedNights = nightsBetween(checkIn, checkOut);
  const nights = calculatedNights || Math.trunc(asPositiveNumber(hotel.nights) || 0);
  const rooms = Math.trunc(asPositiveNumber(searchParams.rooms, hotel.rooms, occupancy.rooms) || 1);
  const adults = Math.trunc(asPositiveNumber(searchParams.adults, hotel.adults, occupancy.adults) || 2);
  const children = Math.max(0, Math.trunc(Number(searchParams.children ?? hotel.children ?? occupancy.children ?? 0) || 0));

  const explicitTotal = asPositiveNumber(
    hotel.totalPrice,
    hotel.total_price,
    hotel.min_total_price,
    pricing.provider_total,
    pricing.total_price,
    grossPrice.value,
  );
  const explicitNightly = asPositiveNumber(
    hotel.pricePerNight,
    hotel.price_per_night,
    hotel.nightlyPrice,
    hotel.cost_per_night,
    pricing.price_per_night,
  );
  const ambiguousUnitPrice = asPositiveNumber(hotel.price, hotel.cost);
  const pricePerNight = explicitNightly
    ?? (explicitTotal && nights > 0 && rooms > 0 ? explicitTotal / (nights * rooms) : null)
    ?? ambiguousUnitPrice
    ?? 0;
  const totalPrice = explicitTotal
    ?? (pricePerNight > 0 && nights > 0 ? pricePerNight * nights * rooms : 0);

  const currency = String(
    pricing.currency
      || grossPrice.currency
      || hotel.currency
      || searchParams.currency
      || 'USD',
  ).toUpperCase();

  const issues: string[] = [];
  if (!checkIn || !checkOut) issues.push('Choose check-in and check-out dates before saving this property.');
  else if (calculatedNights < 1) issues.push('Check-out must be after check-in.');
  if (rooms < 1 || adults < 1) issues.push('At least one room and one adult are required.');
  if (!(totalPrice > 0)) issues.push('A valid total stay price is required.');

  return {
    checkIn,
    checkOut,
    nights,
    rooms,
    adults,
    children,
    currency,
    pricePerNight: Math.round(pricePerNight * 100) / 100,
    totalPrice: Math.round(totalPrice * 100) / 100,
    issues,
  };
};

export const canonicalHotelItemData = (
  hotel: UnknownRecord,
  searchParams: UnknownRecord = {},
  extras: UnknownRecord = {},
): Json => {
  const snapshot = buildHotelBookingSnapshot(hotel, searchParams);
  const extraPricing = asRecord(extras.pricing);
  const selectedProduct = {
    ...asRecord(hotel.selected_product),
    ...asRecord(extras.selected_product),
  };
  const policies = {
    ...asRecord(hotel.policies),
    ...asRecord(extras.policies),
  };
  const providerQuote = {
    ...asRecord(hotel.provider_quote),
    ...asRecord(extras.provider_quote),
  };
  const hotelLocation = asRecord(hotel.location);
  const extraLocation = asRecord(extras.location);
  const serviceTimezone = hotel.service_timezone
    || hotel.timezone
    || hotel.time_zone
    || hotelLocation.timezone
    || extras.service_timezone
    || extraLocation.timezone
    || searchParams.service_timezone
    || searchParams.timezone
    || null;
  const serviceLocation = buildServiceLocation({
    id: hotel.hotel_id || hotel.hotelId || hotel.id,
    providerId: hotel.provider_location_id || hotel.property_id || hotel.hotel_id || hotel.hotelId,
    type: 'property',
    name: hotel.name || hotel.hotel_name || hotel.hotelName,
    address: hotel.address || hotelLocation.address || extras.address,
    latitude: hotel.latitude || hotel.lat || hotelLocation.latitude || hotelLocation.lat || extraLocation.latitude || extraLocation.lat,
    longitude: hotel.longitude || hotel.lng || hotelLocation.longitude || hotelLocation.lng || extraLocation.longitude || extraLocation.lng,
  });
  const serviceTiming = buildDateRangeServiceTiming(snapshot.checkIn, snapshot.checkOut, serviceTimezone);
  const agencyServiceFee = Number(extraPricing.agency_service_fee || 0) || 0;
  return {
    ...extras,
    booking_contract_version: '1.1',
    booking_context: extras.booking_context || null,
    service_timezone: serviceTiming.service_timezone,
    service_location: serviceLocation,
    service_timing: serviceTiming,
    check_in: snapshot.checkIn,
    check_out: snapshot.checkOut,
    service_dates: {
      check_in: snapshot.checkIn,
      check_out: snapshot.checkOut,
    },
    nights: snapshot.nights,
    rooms: snapshot.rooms,
    adults: snapshot.adults,
    children: snapshot.children,
    occupancy: {
      rooms: snapshot.rooms,
      adults: snapshot.adults,
      children: snapshot.children,
    },
    price_per_night: snapshot.pricePerNight,
    total_price: snapshot.totalPrice,
    selected_product: Object.keys(selectedProduct).length > 0 ? selectedProduct : {
      property_id: hotel.hotel_id || hotel.hotelId || hotel.id || null,
      room_id: null,
      rate_id: null,
      selection_status: 'property_only',
    },
    policies,
    provider_quote: providerQuote,
    earnings: {
      ...emptyEarningsContract(),
      ...asRecord(hotel.earnings),
      ...asRecord(extras.earnings),
    },
    pricing: {
      ...asRecord(hotel.pricing),
      ...extraPricing,
      currency: snapshot.currency,
      price_scope: 'stay_total',
      price_per_night: snapshot.pricePerNight,
      provider_total: snapshot.totalPrice,
      agency_service_fee: agencyServiceFee,
      customer_total: Math.round((snapshot.totalPrice + agencyServiceFee) * 100) / 100,
    },
  } as unknown as Json;
};
