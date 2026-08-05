export type BookingActorType =
  | 'traveler'
  | 'travel_agent'
  | 'company_traveler'
  | 'company_admin'
  | 'support';

export type PayerType = 'traveler' | 'agent' | 'company' | 'other';

export type ServiceLocationType =
  | 'property'
  | 'airport'
  | 'terminal'
  | 'venue'
  | 'restaurant'
  | 'city'
  | 'other';

export interface ServiceLocationInput {
  id?: unknown;
  providerId?: unknown;
  type?: ServiceLocationType;
  name?: unknown;
  address?: unknown;
  latitude?: unknown;
  longitude?: unknown;
  airportCode?: unknown;
  terminal?: unknown;
  gate?: unknown;
}

export interface ScheduledServiceTimingInput {
  localStart?: unknown;
  localEnd?: unknown;
  startsAtUtc?: unknown;
  endsAtUtc?: unknown;
  serviceTimezone?: unknown;
}

interface BookingContextInput {
  userId: string;
  userType?: string | null;
  companyName?: string | null;
  payerType?: PayerType;
}

const actorTypeFor = (userType?: string | null): BookingActorType => {
  const normalized = String(userType || '').toLowerCase();
  if (normalized.includes('agent') || normalized.includes('advisor')) return 'travel_agent';
  if (normalized.includes('admin')) return 'company_admin';
  if (normalized.includes('corporate') || normalized.includes('company')) return 'company_traveler';
  if (normalized.includes('support')) return 'support';
  return 'traveler';
};

export const buildBookingContext = ({
  userId,
  userType,
  companyName,
  payerType = 'traveler',
}: BookingContextInput) => {
  const bookingActorType = actorTypeFor(userType);
  const organizationType = bookingActorType === 'travel_agent'
    ? 'agency'
    : bookingActorType.startsWith('company_') ? 'company' : null;

  return {
    contract_version: '1.1',
    booking_actor: {
      type: bookingActorType,
      user_id: userId,
    },
    traveler: {
      relationship: 'self',
      profile_id: null,
    },
    payer: {
      type: payerType,
    },
    organization: organizationType ? {
      type: organizationType,
      id: null,
      name: companyName || null,
    } : null,
    agency_reference: null,
    cost_center: null,
    servicing_owner_user_id: userId,
  };
};

const textOrNull = (value: unknown): string | null => {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const text = String(value).trim();
  return text || null;
};

const coordinateOrNull = (value: unknown): number | null => {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const explicitUtcInstant = (value: unknown): string | null => {
  const raw = textOrNull(value);
  if (!raw || !/(?:Z|[+-]\d{2}:?\d{2})$/i.test(raw)) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};

export const buildServiceLocation = (input: ServiceLocationInput) => ({
  id: textOrNull(input.id),
  provider_location_id: textOrNull(input.providerId),
  type: input.type || 'other',
  name: textOrNull(input.name),
  address: textOrNull(input.address),
  latitude: coordinateOrNull(input.latitude),
  longitude: coordinateOrNull(input.longitude),
  airport_code: textOrNull(input.airportCode)?.toUpperCase() || null,
  terminal: textOrNull(input.terminal),
  gate: textOrNull(input.gate),
});

export const buildDateRangeServiceTiming = (
  startDate: string | null,
  endDate: string | null,
  serviceTimezone?: unknown,
) => ({
  kind: 'date_range' as const,
  start_date: startDate,
  end_date: endDate,
  local_start: null,
  local_end: null,
  service_timezone: textOrNull(serviceTimezone),
  starts_at_utc: null,
  ends_at_utc: null,
});

/**
 * Timed services preserve the provider/venue's wall-clock value and zone.
 * UTC is accepted only when the source includes an explicit offset or `Z`;
 * ambiguous local times are never silently interpreted in the viewer's zone.
 */
export const buildScheduledServiceTiming = (input: ScheduledServiceTimingInput) => ({
  kind: 'scheduled' as const,
  start_date: null,
  end_date: null,
  local_start: textOrNull(input.localStart),
  local_end: textOrNull(input.localEnd),
  service_timezone: textOrNull(input.serviceTimezone),
  starts_at_utc: explicitUtcInstant(input.startsAtUtc),
  ends_at_utc: explicitUtcInstant(input.endsAtUtc),
});

type BookingRecord = Record<string, unknown>;

const asRecord = (value: unknown): BookingRecord =>
  value && typeof value === 'object' ? value as BookingRecord : {};

export const buildTimedServiceContract = (
  item: BookingRecord,
  locationType: ServiceLocationType = 'venue',
) => {
  const rawLocation = asRecord(item.service_location || item.location || item.geoCode);
  const departure = asRecord(item.departure);
  const arrival = asRecord(item.arrival);
  const localStart = item.local_start || item.localStart || item.start_at || item.startAt
    || item.datetime || item.dateTime || departure.at || item.departure;
  const localEnd = item.local_end || item.localEnd || item.end_at || item.endAt
    || arrival.at || item.arrival;
  const serviceTimezone = item.service_timezone || item.timezone || item.time_zone
    || rawLocation.timezone || item.departure_timezone || item.departureTimezone;
  const serviceTiming = buildScheduledServiceTiming({
    localStart,
    localEnd,
    startsAtUtc: item.starts_at_utc || item.startsAtUtc || localStart,
    endsAtUtc: item.ends_at_utc || item.endsAtUtc || localEnd,
    serviceTimezone,
  });
  const serviceLocation = buildServiceLocation({
    id: item.location_id || rawLocation.id,
    providerId: item.provider_location_id || rawLocation.provider_location_id,
    type: locationType,
    name: rawLocation.name || rawLocation.city || item.venue || item.location_name || item.location,
    address: item.address || rawLocation.address,
    latitude: item.latitude || item.lat || rawLocation.latitude || rawLocation.lat,
    longitude: item.longitude || item.lng || rawLocation.longitude || rawLocation.lng,
    airportCode: item.iataCode || item.airport_code,
    terminal: item.terminal,
    gate: item.gate,
  });
  return {
    booking_contract_version: '1.1',
    service_timezone: serviceTiming.service_timezone,
    service_location: serviceLocation,
    service_timing: serviceTiming,
    service_dates: {
      start: textOrNull(localStart)?.slice(0, 10) || null,
      end: textOrNull(localEnd)?.slice(0, 10) || null,
    },
  };
};

export const buildFlightServiceContract = (flight: BookingRecord) => {
  const departure = asRecord(flight.departure);
  const arrival = asRecord(flight.arrival);
  const departureValue = departure.at || flight.departure_at || flight.departure;
  const arrivalValue = arrival.at || flight.arrival_at || flight.arrival;
  const departureTimezone = departure.timezone || departure.time_zone
    || flight.departure_timezone || flight.departureTimezone || flight.origin_timezone;
  const arrivalTimezone = arrival.timezone || arrival.time_zone
    || flight.arrival_timezone || flight.arrivalTimezone || flight.destination_timezone;
  const departureLocation = buildServiceLocation({
    id: departure.id,
    providerId: departure.provider_location_id,
    type: departure.terminal ? 'terminal' : 'airport',
    name: departure.name || flight.from || flight.origin,
    address: departure.address,
    latitude: departure.latitude || flight.originLat,
    longitude: departure.longitude || flight.originLng,
    airportCode: departure.iataCode || flight.from || flight.origin,
    terminal: departure.terminal || flight.departureTerminal,
    gate: departure.gate || flight.departureGate,
  });
  const arrivalLocation = buildServiceLocation({
    id: arrival.id,
    providerId: arrival.provider_location_id,
    type: arrival.terminal ? 'terminal' : 'airport',
    name: arrival.name || flight.to || flight.destination,
    address: arrival.address,
    latitude: arrival.latitude || flight.destinationLat || flight.latitude,
    longitude: arrival.longitude || flight.destinationLng || flight.longitude,
    airportCode: arrival.iataCode || flight.to || flight.destination,
    terminal: arrival.terminal || flight.arrivalTerminal,
    gate: arrival.gate || flight.arrivalGate,
  });
  const serviceTiming = buildScheduledServiceTiming({
    localStart: departureValue,
    startsAtUtc: flight.departure_at_utc || departure.utc || departureValue,
    serviceTimezone: departureTimezone,
  });
  const arrivalTiming = buildScheduledServiceTiming({
    localStart: arrivalValue,
    startsAtUtc: flight.arrival_at_utc || arrival.utc || arrivalValue,
    serviceTimezone: arrivalTimezone,
  });
  return {
    booking_contract_version: '1.1',
    service_timezone: serviceTiming.service_timezone,
    service_location: departureLocation,
    destination_location: arrivalLocation,
    service_timing: serviceTiming,
    arrival_timing: arrivalTiming,
    service_dates: {
      depart: textOrNull(departureValue)?.slice(0, 10) || null,
      arrive: textOrNull(arrivalValue)?.slice(0, 10) || null,
    },
  };
};

export const emptyEarningsContract = () => ({
  commission_status: 'not_available',
  commission_tier: null,
  commission_basis: null,
  commission_rate: null,
  estimated_commission: null,
  settlement_currency: null,
});
