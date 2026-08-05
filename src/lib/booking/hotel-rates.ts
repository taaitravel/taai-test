import type { HotelBookingSnapshot } from './hotel-booking';

type UnknownRecord = Record<string, unknown>;

const record = (value: unknown): UnknownRecord =>
  value && typeof value === 'object' && !Array.isArray(value) ? value as UnknownRecord : {};
const list = (value: unknown): unknown[] => Array.isArray(value) ? value : [];
const text = (...values: unknown[]): string | null => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return null;
};
const amount = (...values: unknown[]): number | null => {
  for (const value of values) {
    const parsed = typeof value === 'number' ? value : Number(value);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return null;
};

export interface NormalizedHotelRate {
  id: string;
  roomId: string;
  rateId: string;
  roomName: string;
  rateName: string;
  bedConfiguration: string | null;
  maxOccupancy: number | null;
  roomsLeft: number | null;
  mealPlan: string | null;
  cancellationType: 'free_cancellation' | 'partially_refundable' | 'non_refundable' | 'unknown';
  freeCancellationUntil: string | null;
  cancellationSummary: string;
  paymentTiming: string | null;
  totalPrice: number;
  pricePerNight: number;
  currency: string;
  providerRateToken: string | null;
  bookingUrl: string | null;
  supplierBookable: boolean;
}

const firstList = (...values: unknown[]): unknown[] => {
  for (const value of values) {
    const candidate = list(value);
    if (candidate.length > 0) return candidate;
  }
  return [];
};

export const normalizeHotelRates = (
  payload: unknown,
  booking: HotelBookingSnapshot,
): NormalizedHotelRate[] => {
  const root = record(payload);
  const firstData = Array.isArray(root.data) ? record(root.data[0]) : record(root.data);
  const data = Object.keys(firstData).length > 0 ? firstData : root;
  const accommodation = record(data.accommodation);
  const roomsAndRates = record(data.roomsAndRates);
  const roomCatalog = record(data.rooms);

  let candidates = firstList(
    data.block,
    data.products,
    data.rates,
    accommodation.products,
    roomsAndRates.rates,
    roomsAndRates.rooms,
    Array.isArray(data.rooms) ? data.rooms : null,
  );
  if (candidates.length === 0 && Object.keys(roomCatalog).length > 0) {
    candidates = Object.values(roomCatalog);
  }

  const normalized = candidates.map((candidate, index): NormalizedHotelRate | null => {
    const rate = record(candidate);
    const nestedRoom = record(rate.room);
    const roomId = text(
      rate.room_id,
      rate.roomId,
      nestedRoom.id,
      rate.roomtype_id,
      rate.room_type_id,
      rate.id,
    ) || `room-${index + 1}`;
    const catalogRoom = record(roomCatalog[roomId]);
    const room = Object.keys(catalogRoom).length > 0 ? catalogRoom : nestedRoom;

    const rateId = text(rate.rate_id, rate.rateId, rate.product_id, rate.block_id, rate.id)
      || `${roomId}-rate-${index + 1}`;
    const pricing = record(rate.price);
    const productPrice = record(rate.product_price_breakdown);
    const grossAmount = record(productPrice.gross_amount);
    const grossPrice = record(productPrice.grossPrice);
    const policies = record(rate.policies);
    const cancellation = record(policies.cancellation);
    const meal = record(policies.meal_plan);

    const totalPrice = amount(
      grossAmount.value,
      grossPrice.value,
      pricing.total,
      pricing.booker,
      rate.total_price,
      rate.totalPrice,
      rate.min_total_price,
      rate.price,
    );
    if (!totalPrice) return null;

    const rawCancellationType = text(
      cancellation.type,
      rate.cancellation_type,
      rate.refundable === true ? 'free_cancellation' : null,
      rate.refundable === false ? 'non_refundable' : null,
    ) || 'unknown';
    const cancellationType = rawCancellationType.includes('free')
      ? 'free_cancellation'
      : rawCancellationType.includes('partial') || rawCancellationType.includes('special')
        ? 'partially_refundable'
        : rawCancellationType.includes('non')
          ? 'non_refundable'
          : 'unknown';
    const freeCancellationUntil = text(
      cancellation.free_cancellation_until,
      rate.free_cancellation_until,
      rate.refundable_until,
    );
    const cancellationSummary = cancellationType === 'free_cancellation'
      ? freeCancellationUntil ? `Free cancellation until ${freeCancellationUntil}` : 'Free cancellation available'
      : cancellationType === 'partially_refundable'
        ? 'Partially refundable; review the provider terms'
        : cancellationType === 'non_refundable'
          ? 'Non-refundable'
          : 'Cancellation terms require provider confirmation';

    const bedConfigurations = firstList(room.bed_configurations, rate.bed_configurations, room.beds, rate.beds);
    const bedConfiguration = text(
      rate.bed_configuration,
      rate.bed_type,
      room.bed_configuration,
      room.bed_type,
      bedConfigurations.map((bed) => text(record(bed).name, record(bed).bed_type)).filter(Boolean).join(', '),
    );
    const roomsLeftValue = amount(rate.rooms_left, rate.number_of_rooms_left, rate.inventory, rate.available_rooms);
    const roomsLeft = roomsLeftValue === null ? null : Math.trunc(roomsLeftValue);
    const providerRateToken = text(rate.booking_token, rate.order_token, rate.block_id, rate.rate_key);
    const bookingUrl = text(rate.booking_url, rate.url, data.url);
    // This integration currently has no supplier order adapter. Preserve tokens but do not
    // label a rate checkout-ready unless the provider explicitly supplies both capabilities.
    const supplierBookable = rate.bookable === true
      && Boolean(text(rate.booking_token, rate.order_token))
      && Boolean(bookingUrl);
    const currency = text(
      grossAmount.currency,
      grossPrice.currency,
      pricing.currency,
      data.currency,
      booking.currency,
    ) || booking.currency;
    const divisor = Math.max(1, booking.nights * booking.rooms);

    return {
      id: rateId,
      roomId,
      rateId,
      roomName: text(rate.room_name, rate.name_without_policy, room.room_name, room.name, nestedRoom.name) || 'Room',
      rateName: text(rate.rate_name, rate.name, meal.type, rate.package_name) || 'Standard rate',
      bedConfiguration,
      maxOccupancy: amount(rate.max_occupancy, room.max_occupancy, rate.max_persons),
      roomsLeft,
      mealPlan: text(rate.meal_plan, rate.breakfast_included === true ? 'Breakfast included' : null, meal.type),
      cancellationType,
      freeCancellationUntil,
      cancellationSummary,
      paymentTiming: text(rate.payment_timing, rate.payment_type, rate.pay_at_property === true ? 'Pay at property' : null),
      totalPrice: Math.round(totalPrice * 100) / 100,
      pricePerNight: Math.round((totalPrice / divisor) * 100) / 100,
      currency: currency.toUpperCase(),
      providerRateToken,
      bookingUrl,
      supplierBookable,
    };
  }).filter((rate): rate is NormalizedHotelRate => rate !== null);

  const unique = new Map<string, NormalizedHotelRate>();
  normalized.forEach((rate) => unique.set(rate.id, rate));
  return Array.from(unique.values()).sort((a, b) => a.totalPrice - b.totalPrice);
};

export const applySelectedHotelRate = (
  hotel: UnknownRecord,
  rate: NormalizedHotelRate,
  booking: HotelBookingSnapshot,
): UnknownRecord => {
  const propertyId = (text(hotel.hotel_id, hotel.hotelId, hotel.id) || 'unknown-property').replace(/^booking-/, '');
  const checkedAt = new Date().toISOString();
  return {
    ...hotel,
    totalPrice: rate.totalPrice,
    total_price: rate.totalPrice,
    pricePerNight: rate.pricePerNight,
    price_per_night: rate.pricePerNight,
    currency: rate.currency,
    selected_product: {
      property_id: propertyId,
      room_id: rate.roomId,
      rate_id: rate.rateId,
      room_name: rate.roomName,
      rate_name: rate.rateName,
      bed_configuration: rate.bedConfiguration,
      meal_plan: rate.mealPlan,
      max_occupancy: rate.maxOccupancy,
    },
    policies: {
      cancellation_type: rate.cancellationType,
      refundable: rate.cancellationType === 'free_cancellation',
      refundable_until: rate.freeCancellationUntil,
      cancellation_summary: rate.cancellationSummary,
      payment_timing: rate.paymentTiming,
    },
    provider_quote: {
      checked_at: checkedAt,
      check_in: booking.checkIn,
      check_out: booking.checkOut,
      occupancy: {
        rooms: booking.rooms,
        adults: booking.adults,
        children: booking.children,
      },
      source_endpoint: 'hotels/getRoomListWithAvailability',
      exact_selection: true,
      rate_token: rate.providerRateToken,
    },
    provider_ref: {
      external_id: propertyId,
      room_id: rate.roomId,
      rate_id: rate.rateId,
      rate_token: rate.providerRateToken,
      booking_url: rate.bookingUrl || text(hotel.bookingUrl, hotel.url),
      bookable: rate.supplierBookable,
      availability_status: rate.supplierBookable ? 'bookable' : 'provider_rate_selected',
      checked_at: checkedAt,
    },
    availability_status: rate.supplierBookable ? 'bookable' : 'provider_rate_selected',
  };
};
