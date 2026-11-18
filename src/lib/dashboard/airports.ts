/**
 * Reference coordinates for great-circle distance.
 * These are airport reference points, not a flown route and not block time.
 */
export interface AirportPoint {
  lat: number;
  lon: number;
}

export const AIRPORTS: Record<string, AirportPoint> = {
  AEP: { lat: -34.5592, lon: -58.4156 },
  BRC: { lat: -41.1512, lon: -71.1575 },
  DCA: { lat: 38.8521, lon: -77.0377 },
  DEN: { lat: 39.8561, lon: -104.6737 },
  EWR: { lat: 40.6895, lon: -74.1745 },
  EYW: { lat: 24.5561, lon: -81.7596 },
  EZE: { lat: -34.8222, lon: -58.5358 },
  FCO: { lat: 41.8003, lon: 12.2389 },
  FTE: { lat: -50.2803, lon: -72.0531 },
  JFK: { lat: 40.6413, lon: -73.7781 },
  LGA: { lat: 40.7769, lon: -73.874 },
  LIR: { lat: 10.5933, lon: -85.5444 },
  LIS: { lat: 38.7742, lon: -9.1342 },
  LRM: { lat: 18.4507, lon: -68.9118 },
  MDE: { lat: 6.1645, lon: -75.4231 },
  MEX: { lat: 19.4363, lon: -99.0721 },
  MIA: { lat: 25.7959, lon: -80.287 },
  MSY: { lat: 29.9934, lon: -90.258 },
};

const EARTH_RADIUS_MILES = 3958.7613;

export function greatCircleMiles(from: AirportPoint, to: AirportPoint): number {
  const toRad = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = toRad(to.lat - from.lat);
  const dLon = toRad(to.lon - from.lon);
  const lat1 = toRad(from.lat);
  const lat2 = toRad(to.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  const miles = 2 * EARTH_RADIUS_MILES * Math.asin(Math.min(1, Math.sqrt(h)));
  return Math.round(miles);
}
