import type { CostCategory, MetricsInput, Provenance } from './travel-metrics';

export type DemoCategory = 'flight' | 'stay' | 'activity' | 'dining' | 'transport';

export interface DemoLine {
  cat: DemoCategory;
  name: string;
  date: string;
  amount: number;
  currency: 'USD';
  memo: string;
  origin: string | null;
  destination: string | null;
}

export interface DemoTrip {
  code: string;
  name: string;
  start: string;
  end: string;
  pax: number;
  locations: string[];
  note: string;
  items: DemoLine[];
}

const CATEGORY: Record<DemoCategory, CostCategory> = {
  flight: 'flights',
  stay: 'properties',
  activity: 'activities',
  dining: 'dining',
  transport: 'transport',
};

function line(
  cat: DemoCategory,
  name: string,
  date: string,
  amount: number,
  memo = '',
): DemoLine {
  const route = name.match(/([A-Z]{3})\s*→\s*([A-Z]{3})/);
  return {
    cat,
    name,
    date,
    amount,
    currency: 'USD',
    memo,
    origin: cat === 'flight' ? route?.[1] ?? null : null,
    destination: cat === 'flight' ? route?.[2] ?? null : null,
  };
}

const flight = (name: string, date: string, amount: number, memo = '') => line('flight', name, date, amount, memo);
const stay = (name: string, date: string, amount: number, memo = '') => line('stay', name, date, amount, memo);
const activity = (name: string, date: string, amount: number, memo = '') => line('activity', name, date, amount, memo);
const dining = (name: string, date: string, amount: number, memo = '') => line('dining', name, date, amount, memo);
const transport = (name: string, date: string, amount: number, memo = '') => line('transport', name, date, amount, memo);

/**
 * Itineraries for the info@taai.travel demo account.
 * The five upcoming trips follow the founder's mock data. The earlier trips
 * give last-year comparisons and lifetime totals something real to sum.
 * Amounts are planned figures in USD. None of them are taai bookings.
 */
export const DEMO_TRIPS: DemoTrip[] = [
  {
    code: 'NYC-VT-2612',
    name: 'Powder & Park Ave',
    start: '2026-12-26',
    end: '2027-01-03',
    pax: 3,
    locations: ['Miami, United States', 'New York, United States', 'Killington, VT, United States'],
    note: 'Fly into New York, drive four hours north, ski four days, then one last night back in the city.',
    items: [
      flight('American 1142 · MIA → LGA', '2026-12-26', 1284, '3 seats, economy'),
      transport('SUV rental · 8 days, AWD + ski rack', '2026-12-26', 892, 'Avis LGA'),
      stay('Slopeside house, Killington', '2026-12-26', 4380, '6 nights · 3 bedrooms'),
      activity('Killington lift passes', '2026-12-27', 1560, '4 days × 3 skiers'),
      activity('Ski & boot rental', '2026-12-27', 420, '4 days × 3'),
      activity('Backcountry snowmobile tour', '2026-12-30', 465, '3 places'),
      stay('The Standard, East Village', '2027-01-01', 980, '1 night · 2 rooms'),
      activity("New Year's Eve dinner & rooftop", '2026-12-31', 685, '3 places'),
      dining('Dining · Vermont & New York', '2026-12-26', 2140, '14 covers'),
      transport('Fuel, tolls, parking', '2026-12-26', 310, 'MIA–LGA–VT–NYC'),
    ],
  },
  {
    code: 'DCA-2701',
    name: 'The Capital Table',
    start: '2027-01-27',
    end: '2027-02-10',
    pax: 1,
    locations: ['Miami, United States', 'Washington, DC, United States'],
    note: 'Two weeks eating through the city, with three nights at the Rosewood in the middle as the splurge.',
    items: [
      flight('Delta 1318 · MIA → DCA', '2027-01-27', 412, '1 seat, economy'),
      transport('Compact rental · 14 days', '2027-01-27', 686, 'Hertz DCA'),
      stay('Apartment, Capitol Hill', '2027-01-27', 2310, '11 nights'),
      stay('Rosewood Georgetown', '2027-02-03', 1185, '3 nights · midpoint'),
      activity('Museum & gallery passes', '2027-01-29', 185, 'Phillips, Hirshhorn, Planet Word'),
      activity('Kennedy Center · evening performance', '2027-02-05', 155, '1 seat'),
      dining('Tasting menus · Rose\'s, Albi, Jônt', '2027-01-28', 1180, '3 seatings'),
      dining('Everything else · Union Market to Little Ethiopia', '2027-01-27', 600, '14 days'),
      transport('Metro, parking, tolls', '2027-01-27', 265, ''),
    ],
  },
  {
    code: 'EZE-PAT-2702',
    name: 'Southbound',
    start: '2027-02-23',
    end: '2027-03-10',
    pax: 2,
    locations: ['New York, United States', 'Buenos Aires, Argentina', 'El Calafate, Argentina', 'Bariloche, Argentina'],
    note: 'A week in the city, then south — Perito Moreno, an estancia, and a round at Llao Llao.',
    items: [
      flight('American 953 · JFK → EZE', '2027-02-23', 2760, '2 seats · 10h 50m'),
      stay('Palermo apartment, Buenos Aires', '2027-02-23', 3290, '7 nights'),
      dining('Buenos Aires · Don Julio, Trescha, Anafe', '2027-02-24', 1870, '7 nights of eating'),
      activity('Tango at Rojo Tango + San Telmo walk', '2027-02-26', 320, '2 places'),
      flight('Aerolíneas 1874 · AEP → FTE', '2027-03-02', 640, '2 seats'),
      stay('Lodge, El Calafate', '2027-03-02', 2180, '4 nights'),
      activity('Perito Moreno ice trek', '2027-03-03', 580, '2 places · full day'),
      activity('Estancia day & horseback', '2027-03-05', 430, '2 places'),
      flight('Aerolíneas 1692 · FTE → BRC', '2027-03-06', 520, '2 seats'),
      stay('Llao Llao, Bariloche', '2027-03-06', 3960, '4 nights · lake view'),
      activity('Golf · Llao Llao course', '2027-03-07', 410, '2 rounds + carts'),
      activity('Nahuel Huapi kayak & Circuito Chico', '2027-03-08', 810, '2 places'),
      dining('Patagonia · lamb, trout, bodegas', '2027-03-02', 1120, '8 nights'),
      transport('Remises, transfers, park fees', '2027-02-23', 540, ''),
      flight('American 954 · EZE → JFK', '2027-03-10', 380, '2 seats · return leg taxes'),
    ],
  },
  {
    code: 'LRM-2705',
    name: 'Casa de Campo',
    start: '2027-05-05',
    end: '2027-05-15',
    pax: 4,
    locations: ['Miami, United States', 'La Romana, Dominican Republic'],
    note: 'Four nights easing in at La Romana, then the villa, Teeth of the Dog, and Catalina.',
    items: [
      flight('JetBlue 1281 · MIA → LRM', '2027-05-05', 1640, '4 seats'),
      stay('Hotel, La Romana', '2027-05-05', 2480, '4 nights · 2 rooms'),
      stay('Villa, Casa de Campo', '2027-05-09', 7200, '6 nights · 4 bedrooms, staff'),
      activity('Teeth of the Dog · 2 rounds', '2027-05-10', 1960, '4 players'),
      activity('Catalina Island day & boat', '2027-05-12', 880, '4 places'),
      activity('Altos de Chavón evening', '2027-05-13', 295, '4 places'),
      dining('Dining · Minitas, La Caña, Chavón', '2027-05-05', 2340, '10 days'),
      transport('Golf carts, transfers, marina', '2027-05-05', 620, ''),
    ],
  },
  {
    code: 'LIS-2709',
    name: 'Atlantic Edge',
    start: '2027-09-10',
    end: '2027-09-20',
    pax: 6,
    locations: ['Miami, United States', 'Lisbon, Portugal', 'Comporta, Portugal', 'Algarve, Portugal'],
    note: 'Built from your last three trips: the Medellín group size, the Costa Rica budget, the Italy pacing.',
    items: [
      flight('TAP 236 · MIA → LIS', '2027-09-10', 4860, '6 seats'),
      stay('Bairro Alto Hotel, Lisbon', '2027-09-10', 2940, '3 nights · 3 rooms'),
      stay('Beach house, Comporta', '2027-09-13', 3600, '3 nights · 4 bedrooms'),
      stay('Resort, Quinta do Lago', '2027-09-16', 4420, '4 nights · 3 rooms'),
      transport('Van rental · 10 days', '2027-09-10', 1180, '9 seats'),
      activity('Golf · Monte Rei & Quinta do Lago South', '2027-09-17', 2340, '6 players · 2 rounds'),
      activity('Surf lessons, Comporta', '2027-09-14', 690, '6 places · 2 sessions'),
      activity('Benagil caves & coast boat', '2027-09-18', 820, '6 places'),
      activity('Setúbal wine & seafood day', '2027-09-15', 600, '6 places'),
      dining('Dining · Lisbon to Algarve', '2027-09-10', 3850, '10 days, 6 people'),
    ],
  },
  {
    code: 'MSY-2512',
    name: 'New Orleans',
    start: '2025-12-11',
    end: '2025-12-15',
    pax: 2,
    locations: ['Miami, United States', 'New Orleans, United States'],
    note: 'A long weekend for music and food, home in time for the week.',
    items: [
      flight('American 2214 · MIA → MSY', '2025-12-11', 420, '2 seats'),
      stay('Hotel, French Quarter', '2025-12-11', 980, '4 nights'),
      dining('Dining · New Orleans', '2025-12-11', 640, '4 nights'),
      activity('Jazz at Preservation Hall', '2025-12-12', 180, '2 places'),
      transport('Taxis and streetcar', '2025-12-11', 90, ''),
      flight('American 2215 · MSY → MIA', '2025-12-15', 380, '2 seats, return'),
    ],
  },
  {
    code: 'MEX-2511',
    name: 'Mexico City',
    start: '2025-11-06',
    end: '2025-11-12',
    pax: 2,
    locations: ['Miami, United States', 'Mexico City, Mexico'],
    note: 'Museums, a cooking class, and long lunches in Roma Norte.',
    items: [
      flight('American 389 · MIA → MEX', '2025-11-06', 780, '2 seats'),
      stay('Apartment, Roma Norte', '2025-11-06', 1400, '6 nights'),
      dining('Dining · Roma and Centro', '2025-11-06', 520, ''),
      activity('Anthropology museum and cooking class', '2025-11-07', 260, ''),
      transport('Airport transfers', '2025-11-06', 110, ''),
      flight('American 390 · MEX → MIA', '2025-11-12', 690, '2 seats, return'),
    ],
  },
  {
    code: 'LIS-2505',
    name: 'First Lisbon',
    start: '2025-05-08',
    end: '2025-05-15',
    pax: 2,
    locations: ['Miami, United States', 'Lisbon, Portugal'],
    note: 'The first time in the city — trams, miradouros, and one night in Belém.',
    items: [
      flight('TAP 227 · MIA → LIS', '2025-05-08', 1680, '2 seats'),
      stay('Apartment, Alfama', '2025-05-08', 2100, '7 nights'),
      dining('Dining · Lisbon', '2025-05-08', 740, ''),
      activity('Day trip, Sintra', '2025-05-10', 310, ''),
      transport('Metro and tuk-tuk', '2025-05-08', 180, ''),
      flight('TAP 228 · LIS → MIA', '2025-05-15', 1420, '2 seats, return'),
    ],
  },
  {
    code: 'EYW-2601',
    name: 'Key West',
    start: '2026-01-16',
    end: '2026-01-19',
    pax: 2,
    locations: ['Miami, United States', 'Key West, United States'],
    note: 'A short hop south for the water and one long dinner.',
    items: [
      flight('American 3615 · MIA → EYW', '2026-01-16', 310, '2 seats'),
      stay('Inn, Old Town', '2026-01-16', 890, '3 nights'),
      dining('Dining · Key West', '2026-01-16', 420, ''),
      activity('Sunset sail', '2026-01-17', 150, '2 places'),
      transport('Taxis', '2026-01-16', 60, ''),
      flight('American 3616 · EYW → MIA', '2026-01-19', 280, '2 seats, return'),
    ],
  },
  {
    code: 'DEN-2602',
    name: 'Front Range',
    start: '2026-02-06',
    end: '2026-02-10',
    pax: 2,
    locations: ['Miami, United States', 'Denver, United States'],
    note: 'A few days of snow above Denver, then one night back in the city.',
    items: [
      flight('United 1234 · MIA → DEN', '2026-02-06', 640, '2 seats'),
      stay('Lodge, Breckenridge', '2026-02-06', 1120, '3 nights'),
      stay('Hotel, Denver', '2026-02-09', 280, '1 night'),
      dining('Dining · Denver and Breckenridge', '2026-02-06', 380, ''),
      activity('Ski rental', '2026-02-07', 480, '2 people'),
      transport('Car rental · 4 days', '2026-02-06', 210, ''),
      flight('United 1235 · DEN → MIA', '2026-02-10', 610, '2 seats, return'),
    ],
  },
  {
    code: 'MDE-2603',
    name: 'The Medellín Week',
    start: '2026-03-12',
    end: '2026-03-19',
    pax: 6,
    locations: ['Miami, United States', 'Medellín, Colombia'],
    note: 'The group trip — a house in El Poblado and long tables at night.',
    items: [
      flight('Avianca 240 · MIA → MDE', '2026-03-12', 3120, '6 seats'),
      stay('House, El Poblado', '2026-03-12', 4200, '7 nights'),
      dining('Dining · Medellín', '2026-03-12', 1680, ''),
      activity('Coffee region day', '2026-03-15', 960, '6 places'),
      transport('Van and airport transfers', '2026-03-12', 540, ''),
      flight('Avianca 241 · MDE → MIA', '2026-03-19', 2860, '6 seats, return'),
    ],
  },
  {
    code: 'LIR-2606',
    name: 'Pacific Costa Rica',
    start: '2026-06-04',
    end: '2026-06-14',
    pax: 4,
    locations: ['Miami, United States', 'Guanacaste, Costa Rica'],
    note: 'A beach week at the scale of a villa, with one jungle day.',
    items: [
      flight('American 1120 · MIA → LIR', '2026-06-04', 1860, '4 seats'),
      stay('Villa, Guanacaste', '2026-06-04', 5400, '10 nights'),
      dining('Dining · Costa Rica', '2026-06-04', 1320, ''),
      activity('Jungle and boat day', '2026-06-07', 980, '4 places'),
      transport('Transfers and a rental car', '2026-06-04', 410, ''),
      flight('American 1121 · LIR → MIA', '2026-06-14', 1740, '4 seats, return'),
    ],
  },
  {
    code: 'FCO-2609',
    name: 'Slow Italy',
    start: '2026-09-02',
    end: '2026-09-12',
    pax: 2,
    locations: ['Miami, United States', 'Rome, Italy', 'Amalfi, Italy'],
    note: 'Unhurried days: Rome first, then the coast.',
    items: [
      flight('ITA 906 · MIA → FCO', '2026-09-02', 1540, '2 seats'),
      stay('Hotel, Rome', '2026-09-02', 2200, '4 nights'),
      transport('Train, Rome to Naples', '2026-09-06', 180, ''),
      stay('Hotel, Amalfi', '2026-09-06', 2600, '6 nights'),
      dining('Dining · Rome and Amalfi', '2026-09-02', 1100, ''),
      activity('Walking tour, Centro Storico', '2026-09-03', 220, '2 places'),
      activity('Boat, Capri', '2026-09-08', 420, '2 places'),
      flight('ITA 907 · FCO → MIA', '2026-09-12', 1480, '2 seats, return'),
    ],
  },
];

export const DEMO_ACCOUNT_EMAIL = 'info@taai.travel';

export function demoCreationKey(index: number): string {
  return `d4100000-de40-4000-8000-${index.toString(16).padStart(12, '0')}`;
}

export function demoItinId(code: string): string {
  return `demo:${code}`;
}

export function demoTripTotal(trip: DemoTrip): number {
  return trip.items.reduce((sum, item) => sum + item.amount, 0);
}

const DEMO_PROVENANCE: Provenance = 'demo';

export function demoMetricsInput(): MetricsInput {
  return {
    trips: DEMO_TRIPS.map((trip) => ({
      id: trip.code,
      name: trip.name,
      start: trip.start,
      end: trip.end,
      budget: demoTripTotal(trip),
      spending: null,
      provenance: DEMO_PROVENANCE,
      travelers: trip.pax,
      locations: trip.locations,
      note: trip.note,
      code: demoItinId(trip.code),
    })),
    occurrences: DEMO_TRIPS.flatMap((trip) => trip.items.map((item, index) => ({
      id: `${trip.code}:${index + 1}`,
      tripId: trip.code,
      source: 'external' as const,
      category: CATEGORY[item.cat],
      amount: item.amount,
      currency: item.currency,
      serviceDate: item.date,
      serviceEnd: null,
      status: 'active',
      rooms: null,
      segments: null,
      linkedToId: null,
      provenance: DEMO_PROVENANCE,
      title: item.name,
      memo: item.memo || null,
      origin: item.origin,
      destination: item.destination,
    }))),
    shares: [],
    settlements: [],
    reportedPayments: [],
    reimbursementCount: 0,
  };
}
