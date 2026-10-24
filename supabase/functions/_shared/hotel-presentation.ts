export interface HotelLabelInput {
  id: string;
  pricePerNight: number;
  rating: number;
  reviewCount: number;
  /** Miles from the searched city center. Missing or 0 means we have no location signal. */
  distanceMiles?: number | null;
}

export interface HotelLabel {
  label: 'Best Overall' | 'Best Value' | 'Best Location';
  reason: string;
}

const positive = (value: number) => Number.isFinite(value) && value > 0;

/**
 * Labels come from the row's own price, rating, review count, and distance.
 * A hotel with no supporting number gets no label. "Walkable" is never emitted.
 */
export const assignHotelLabels = (hotels: HotelLabelInput[]): Map<string, HotelLabel> => {
  const labels = new Map<string, HotelLabel>();
  const open = () => hotels.filter((hotel) => !labels.has(hotel.id));

  const overall = open()
    .filter((hotel) => positive(hotel.rating) && hotel.reviewCount > 0)
    .sort((a, b) => (b.rating * Math.log10(b.reviewCount + 1)) - (a.rating * Math.log10(a.reviewCount + 1)))[0];
  if (overall) {
    labels.set(overall.id, {
      label: 'Best Overall',
      reason: `${overall.rating} from ${overall.reviewCount} reviews`,
    });
  }

  const value = open()
    .filter((hotel) => hotel.rating >= 8 && positive(hotel.pricePerNight))
    .sort((a, b) => a.pricePerNight - b.pricePerNight)[0];
  if (value) {
    labels.set(value.id, {
      label: 'Best Value',
      reason: 'Lowest nightly price among stays rated 8 or higher',
    });
  }

  const location = open()
    .filter((hotel) => positive(hotel.distanceMiles ?? 0))
    .sort((a, b) => (a.distanceMiles ?? 0) - (b.distanceMiles ?? 0))[0];
  if (location && location.distanceMiles) {
    labels.set(location.id, {
      label: 'Best Location',
      reason: `${location.distanceMiles} mi from the search center`,
    });
  }

  return labels;
};

export const nightsBetween = (checkIn: string | null | undefined, checkOut: string | null | undefined): number => {
  if (!checkIn || !checkOut) return 0;
  const start = Date.parse(`${checkIn}T00:00:00Z`);
  const end = Date.parse(`${checkOut}T00:00:00Z`);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 0;
  return Math.max(Math.round((end - start) / 86_400_000), 0);
};

/**
 * Booking.com grossPrice is the stay total. If a caller stored that same
 * number as the nightly rate, split it across the nights.
 */
export const resolveStayPrice = (input: {
  nightly: number | null;
  total: number | null;
  nights: number;
  rooms?: number;
}): { nightly: number; total: number } => {
  const rooms = Math.max(input.rooms ?? 1, 1);
  const nights = input.nights > 0 ? input.nights : 0;
  let nightly = input.nightly && input.nightly > 0 ? input.nightly : 0;
  let total = input.total && input.total > 0 ? input.total : 0;

  if (nightly > 0 && total > 0 && nights > 1 && Math.abs(nightly - total) < 0.02) {
    nightly = total / (nights * rooms);
  } else if (!nightly && total > 0 && nights > 0) {
    nightly = total / (nights * rooms);
  } else if (!total && nightly > 0 && nights > 0) {
    total = nightly * nights * rooms;
  }

  return {
    nightly: Math.round(nightly * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
};
