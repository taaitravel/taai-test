import { differenceInDateOnlyDays, formatDateOnly } from '@/lib/date-time';
import { AIRPORTS, greatCircleMiles } from '@/lib/dashboard/airports';
import { classifyTripPhase, weekdayOfDateOnly } from '@/lib/dashboard/trip-phase';
import {
  isCancelledStatus,
  normalizeCurrency,
  recordedAmount,
  selectMetricRecords,
  type CostCategory,
  type MetricsInput,
  type OccurrenceInput,
  type TimeFilter,
  type TripInput,
} from '@/lib/dashboard/travel-metrics';

const EARTH_MILES = 24901;
const MOON_MILES = 238855;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;
const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

const CATEGORY_STYLE: Record<CostCategory, { label: string; color: string }> = {
  properties: { label: 'Stays', color: '#EE7C5C' },
  activities: { label: 'Activities', color: '#E2913C' },
  dining: { label: 'Dining', color: '#8FB3C9' },
  flights: { label: 'Flights', color: '#F2536E' },
  transport: { label: 'Transport', color: '#A98CA8' },
  unclassified: { label: 'Other', color: '#C4B8AE' },
};

const CATEGORY_ORDER: CostCategory[] = ['properties', 'activities', 'dining', 'flights', 'transport', 'unclassified'];

const COUNTRY_ALIASES: Record<string, string> = {
  usa: 'United States',
  us: 'United States',
  'u.s.': 'United States',
  'u.s.a.': 'United States',
  'united states': 'United States',
  'united states of america': 'United States',
  uk: 'United Kingdom',
  'u.k.': 'United Kingdom',
  'united kingdom': 'United Kingdom',
};

const COUNTRY_NAMES = new Set([
  'argentina', 'australia', 'austria', 'belgium', 'brazil', 'canada', 'chile', 'china', 'colombia',
  'costa rica', 'croatia', 'czech republic', 'denmark', 'dominican republic', 'egypt', 'finland',
  'france', 'germany', 'greece', 'hungary', 'iceland', 'india', 'indonesia', 'ireland', 'israel',
  'italy', 'japan', 'jordan', 'kenya', 'malaysia', 'mexico', 'morocco', 'netherlands', 'new zealand',
  'norway', 'peru', 'philippines', 'poland', 'portugal', 'singapore', 'south africa', 'south korea',
  'spain', 'sweden', 'switzerland', 'taiwan', 'tanzania', 'thailand', 'turkey', 'united kingdom',
  'united states', 'vietnam',
]);

const SMALL = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

export interface StoryQuery {
  today: string;
  time: TimeFilter;
  profileCountries: number | null;
  profileName: string | null;
}

export interface StoryMoney {
  currency: string;
  amount: number;
}

export interface StoryDelta {
  percent: number;
  priorAmount: number;
  currency: string;
}

export interface CategorySlice {
  key: CostCategory;
  label: string;
  amount: number;
  color: string;
  percent: number;
}

export interface ComparisonItem {
  icon: string;
  value: string;
  label: string;
  percent: number;
}

export interface MonthBucket {
  key: string;
  label: string;
  amount: number;
  prior: number | null;
}

export interface TripCardModel {
  id: string;
  name: string;
  note: string | null;
  month: string;
  day: string;
  year: string;
  route: string;
  total: number | null;
  currency: string | null;
  perTraveler: number | null;
  miles: number | null;
  code: string | null;
  segments: Array<{ color: string; amount: number }>;
}

export interface BandRow {
  label: string;
  color: string;
  trips: number;
  amount: number;
}

export interface RankedLine {
  rank: number;
  title: string;
  trip: string;
  amount: number;
}

export interface FlightRecord {
  title: string;
  route: string;
  subtitle: string;
  value: string;
  unit: string;
  icon: 'plane' | 'route';
}

export interface TravelStory {
  time: TimeFilter;
  years: number[];
  scopeLabel: string;
  eyebrow: string;
  headline: string[];
  hero: {
    spend: StoryMoney | null;
    otherCurrencies: StoryMoney[];
    itineraries: number;
    nights: number | null;
    travelerNights: number | null;
    miles: number | null;
    milesCaption: string | null;
    costPerNight: number | null;
  };
  mrz: string;
  biggest: { amount: StoryMoney; detail: string } | null;
  averagePerTraveler: { amount: StoryMoney; delta: StoryDelta | null } | null;
  longest: { nights: number; detail: string } | null;
  flights: { count: number; detail: string };
  categories: CategorySlice[];
  feels: ComparisonItem[];
  months: MonthBucket[];
  legendCurrent: string | null;
  legendPrior: string | null;
  spendingTotal: { amount: StoryMoney; delta: StoryDelta | null } | null;
  averageTrip: { average: number; median: number; currency: string } | null;
  perNightDetail: { perNight: number; perTravelerNight: number | null; currency: string } | null;
  lifetime: { amounts: StoryMoney[]; past: number; planned: number };
  bands: BandRow[];
  bandTripCount: number;
  topLines: RankedLine[];
  categoryByTrip: Array<{ id: string; name: string; when: string; total: number; segments: Array<{ color: string; amount: number }> }>;
  currency: string | null;
  trips: TripCardModel[];
  earlierTrips: TripCardModel[];
  passport: {
    miles: number | null;
    milesDetail: string;
    countries: number;
    profileCountries: number | null;
    nights: number | null;
    nightsDetail: string | null;
    longest: { miles: number; route: string } | null;
    far: ComparisonItem[];
    records: FlightRecord[];
    weekdays: Array<{ label: string; count: number }>;
  };
  footnote: string;
  shareText: string;
}

export function spellCount(value: number): string {
  if (!Number.isInteger(value) || value < 0 || value > 99) return value.toLocaleString('en-US');
  if (value < 20) return SMALL[value];
  const ten = Math.floor(value / 10);
  const one = value % 10;
  return one ? `${TENS[ten]}-${SMALL[one]}` : TENS[ten];
}

export function parsePlace(value: string): { label: string; country: string | null } {
  const parts = value.split(',').map((part) => part.trim()).filter(Boolean);
  if (parts.length === 0) return { label: '', country: null };
  if (parts.length === 1) {
    const country = knownCountry(parts[0]);
    return { label: parts[0], country };
  }
  const last = parts[parts.length - 1];
  if (/^[A-Za-z]{2}$/.test(last)) return { label: parts.join(', '), country: null };
  return { label: parts.slice(0, -1).join(', '), country: canonicalCountry(last) };
}

export function carrierFromTitle(title: string | null | undefined): string | null {
  if (!title) return null;
  const match = title.trim().match(/^(.+?)\s+\d{2,4}\b/);
  if (!match) return null;
  const carrier = match[1].replace(/[·,]+$/g, '').trim();
  if (carrier.length < 2 || carrier.length > 40) return null;
  return carrier;
}

export function formatStoryMoney(amount: number, currency: string): string {
  const rounded = Math.round(amount);
  if (normalizeCurrency(currency) === 'USD') return `$${rounded.toLocaleString('en-US')}`;
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(rounded);
  } catch {
    return `${rounded.toLocaleString('en-US')} ${currency}`;
  }
}

export function buildTravelStory(input: MetricsInput, query: StoryQuery): TravelStory {
  const { trips, occurrences } = selectMetricRecords(input);
  const openLines = occurrences.filter((line) => !line.archived && !isCancelledStatus(line.status, line.cancelled));
  const years = collectYears(trips, openLines);
  const viewTrips = selectViewTrips(trips, query);
  const viewIds = new Set(viewTrips.map((trip) => trip.id));
  const viewLines = openLines.filter((line) => line.tripId && viewIds.has(line.tripId));
  const currency = primaryCurrency(viewLines);
  const otherCurrencies = moneyByCurrency(viewLines).filter((row) => row.currency !== currency);
  const priced = currency ? viewLines.filter((line) => moneyOf(line, currency) != null) : [];
  const spendAmount = sum(priced.map((line) => moneyOf(line, currency!) ?? 0));
  const spend = currency && priced.length ? { currency, amount: spendAmount } : null;

  const nightRows = viewTrips.map((trip) => ({ trip, nights: tripNights(trip) }));
  const nightsKnown = viewTrips.length > 0 && nightRows.every((row) => row.nights != null);
  const nights = nightsKnown ? nightRows.reduce((total, row) => total + (row.nights ?? 0), 0) : null;
  const travelersKnown = nightsKnown && nightRows.every((row) => (row.trip.travelers ?? 0) >= 1);
  const travelerNights = travelersKnown
    ? nightRows.reduce((total, row) => total + (row.nights ?? 0) * (row.trip.travelers ?? 0), 0)
    : null;

  const flightLines = viewLines.filter((line) => line.category === 'flights');
  const legDistances = flightLines.map((line) => ({ line, miles: legMiles(line) }));
  const milesKnown = flightLines.length > 0 && legDistances.every((leg) => leg.miles != null);
  const miles = milesKnown ? legDistances.reduce((total, leg) => total + (leg.miles ?? 0), 0) : null;
  const countries = countriesOf(viewTrips);
  const home = mode(flightLines.map((line) => line.origin?.toUpperCase() ?? '').filter((code) => code.length === 3));

  const categories = categorySlices(priced, currency, spendAmount);
  const tripTotals = viewTrips.map((trip) => ({
    trip,
    total: currency ? sum(priced.filter((line) => line.tripId === trip.id).map((line) => moneyOf(line, currency!) ?? 0)) : 0,
    nights: tripNights(trip),
  })).filter((row) => row.total > 0);

  const months = buildMonths(priced, openLines, currency);
  const priorAmount = months.some((month) => month.prior != null)
    ? months.reduce((total, month) => total + (month.prior ?? 0), 0)
    : 0;
  const delta = spend && priorAmount > 0
    ? { percent: Math.round(((spend.amount - priorAmount) / priorAmount) * 100), priorAmount, currency: spend.currency }
    : null;

  const contributing = tripTotals.filter((row) => row.total > 0);
  const averagePerTraveler = perTraveler(contributing.map((row) => row.trip), spend);
  const priorTrips = tripsTouchingMonths(openLines, trips, months.map((month) => shiftMonth(month.key, -12)), currency);
  const priorAverage = perTraveler(priorTrips, currency && priorAmount > 0 ? { currency, amount: priorAmount } : null);
  const averageDelta = averagePerTraveler && priorAverage && priorAverage.amount.currency === averagePerTraveler.amount.currency && priorAverage.amount.amount > 0
    ? {
      percent: Math.round(((averagePerTraveler.amount.amount - priorAverage.amount.amount) / priorAverage.amount.amount) * 100),
      priorAmount: priorAverage.amount.amount,
      currency: averagePerTraveler.amount.currency,
    }
    : null;

  const biggest = [...tripTotals].sort((left, right) => right.total - left.total)[0];
  const longest = [...nightRows].filter((row) => row.nights != null).sort((left, right) => (right.nights ?? 0) - (left.nights ?? 0))[0];
  const carriers = new Set(flightLines.map((line) => carrierFromTitle(line.title)?.toLowerCase()).filter((value): value is string => Boolean(value)));
  const tripsWithFlights = new Set(flightLines.map((line) => line.tripId).filter(Boolean));
  const cards = viewTrips.map((trip) => tripCard(trip, priced, currency));
  const earlier = query.time.kind === 'all'
    ? trips
      .filter((trip) => classifyTripPhase(trip.start, trip.end, query.today) === 'completed')
      .sort((left, right) => (left.start ?? '').localeCompare(right.start ?? ''))
      .map((trip) => tripCard(trip, openLines, primaryCurrency(openLines.filter((line) => line.tripId === trip.id)) ?? currency))
    : [];

  const lifetimeAmounts = moneyByCurrency(openLines);
  const past = trips.filter((trip) => classifyTripPhase(trip.start, trip.end, query.today) === 'completed').length;
  const planned = trips.filter((trip) => {
    const phase = classifyTripPhase(trip.start, trip.end, query.today);
    return phase === 'upcoming' || phase === 'active' || phase === 'planning';
  }).length;

  const headline = headlineLines(viewTrips.length, countries.length, nights);
  const milesCaption = milesCaptionFor(miles, flightLines.length, legDistances.filter((leg) => leg.miles == null).length);
  const costPerNight = spend && nights ? Math.round(spend.amount / nights) : null;
  const perTravelerNight = spend && travelerNights ? Math.round(spend.amount / travelerNights) : null;
  const feels = feelBars({
    miles,
    nights,
    dining: categoryAmount(priced, 'dining', currency),
    flights: flightLines.length,
    countries: countries.length,
    spend: spendAmount,
    currency,
  });
  const bands = valueBands(tripTotals.map((row) => row.total), currency);
  const topLines = [...priced]
    .sort((left, right) => (moneyOf(right, currency!) ?? 0) - (moneyOf(left, currency!) ?? 0))
    .slice(0, 5)
    .map((line, index) => ({
      rank: index + 1,
      title: line.title?.trim() || CATEGORY_STYLE[line.category].label,
      trip: trips.find((trip) => trip.id === line.tripId)?.name ?? 'Trip',
      amount: moneyOf(line, currency!) ?? 0,
    }));

  const totals = tripTotals.map((row) => row.total).sort((left, right) => left - right);
  const averageTrip = currency && totals.length
    ? { average: Math.round(sum(totals) / totals.length), median: median(totals), currency }
    : null;

  const passport = buildPassport({
    miles,
    flightLines,
    legDistances,
    countries: countries.length,
    profileCountries: query.profileCountries,
    nights,
    trips: viewTrips,
    records: legDistances,
  });

  const footnote = buildFootnote(priced.length, viewTrips.length, currency, otherCurrencies);
  const shareText = buildShare(headline, spend, nights, miles);

  return {
    time: query.time,
    years,
    scopeLabel: scopeLabel(trips, viewTrips, query),
    eyebrow: query.time.kind === 'year' ? String(query.time.year) : 'Your year ahead',
    headline,
    hero: {
      spend,
      otherCurrencies,
      itineraries: viewTrips.length,
      nights,
      travelerNights,
      miles,
      milesCaption,
      costPerNight,
    },
    mrz: buildMrz(query.profileName, viewTrips.length, nights, countries.length, home, query.today),
    biggest: biggest && currency ? {
      amount: { currency, amount: biggest.total },
      detail: `${biggest.trip.name}${biggest.trip.travelers ? ` · ${biggest.trip.travelers} ${biggest.trip.travelers === 1 ? 'traveler' : 'travelers'}` : ''}`,
    } : null,
    averagePerTraveler: averagePerTraveler ? { ...averagePerTraveler, delta: averageDelta } : null,
    longest: longest?.nights ? {
      nights: longest.nights,
      detail: `${longest.trip.name}${dateSpan(longest.trip) ? ` · ${dateSpan(longest.trip)}` : ''}`,
    } : null,
    flights: {
      count: flightLines.length,
      detail: `Across ${tripsWithFlights.size} ${tripsWithFlights.size === 1 ? 'trip' : 'trips'}${carriers.size ? `, ${carriers.size} ${carriers.size === 1 ? 'carrier' : 'carriers'}` : ''}`,
    },
    categories,
    feels,
    months: months.map((month) => ({ ...month, label: monthTick(month.key, months.map((item) => item.key)) })),
    legendCurrent: months.length ? `${rangeLabel(months[0].key, months[months.length - 1].key)} planned` : null,
    legendPrior: months.some((month) => month.prior != null) && months.length
      ? `${rangeLabel(shiftMonth(months[0].key, -12), shiftMonth(months[months.length - 1].key, -12))} recorded`
      : null,
    spendingTotal: spend ? { amount: spend, delta } : null,
    averageTrip,
    perNightDetail: spend && costPerNight != null
      ? { perNight: costPerNight, perTravelerNight: perTravelerNight, currency: spend.currency }
      : null,
    lifetime: { amounts: lifetimeAmounts, past, planned },
    bands,
    bandTripCount: tripTotals.length,
    topLines,
    categoryByTrip: cards.filter((card) => card.total != null).map((card) => ({
      id: card.id,
      name: card.name,
      when: `${card.month} ${card.year}`,
      total: card.total ?? 0,
      segments: card.segments,
    })),
    currency,
    trips: cards,
    earlierTrips: earlier,
    passport,
    footnote,
    shareText,
  };
}

function collectYears(trips: TripInput[], lines: OccurrenceInput[]): number[] {
  const years = new Set<number>();
  for (const trip of trips) {
    const year = Number((trip.start ?? '').slice(0, 4));
    if (year >= 1900 && year <= 2200) years.add(year);
  }
  for (const line of lines) {
    const year = Number((line.serviceDate ?? '').slice(0, 4));
    if (year >= 1900 && year <= 2200) years.add(year);
  }
  return [...years].sort((left, right) => right - left);
}

function selectViewTrips(trips: TripInput[], query: StoryQuery): TripInput[] {
  const selected = query.time.kind === 'year'
    ? trips.filter((trip) => (trip.start ?? '').slice(0, 4) === String(query.time.year))
    : trips.filter((trip) => {
      const phase = classifyTripPhase(trip.start, trip.end, query.today);
      return phase === 'upcoming' || phase === 'active';
    });
  return [...selected].sort((left, right) => (left.start ?? '').localeCompare(right.start ?? ''));
}

function scopeLabel(allTrips: TripInput[], viewTrips: TripInput[], query: StoryQuery): string {
  if (query.time.kind === 'year') {
    const count = viewTrips.length;
    const noun = `${count} ${count === 1 ? 'trip' : 'trips'}`;
    const starts = viewTrips.map((trip) => trip.start).filter((date): date is string => Boolean(date)).sort();
    if (!starts.length) return noun;
    const first = MONTHS[Number(starts[0].slice(5, 7)) - 1];
    const last = MONTHS[Number(starts[starts.length - 1].slice(5, 7)) - 1];
    const span = first === last ? `${first} ${query.time.year}` : `${first} – ${last} ${query.time.year}`;
    return `${noun} · ${span}`;
  }
  let upcoming = 0;
  let past = 0;
  let active = 0;
  for (const trip of allTrips) {
    const phase = classifyTripPhase(trip.start, trip.end, query.today);
    if (phase === 'upcoming') upcoming += 1;
    else if (phase === 'completed') past += 1;
    else if (phase === 'active') active += 1;
  }
  const parts = [
    active ? `${active} in progress` : '',
    `${upcoming} upcoming`,
    `${past} past`,
  ].filter(Boolean);
  return parts.join(' · ');
}

function headlineLines(trips: number, countries: number, nights: number | null): string[] {
  if (trips === 0) return ['Nothing planned', 'in this view.'];
  const lines = [
    `${capitalize(spellCount(trips))} ${trips === 1 ? 'trip' : 'trips'},`,
    `${spellCount(countries)} ${countries === 1 ? 'country' : 'countries'},`,
  ];
  if (nights == null) return [...lines.slice(0, 1), lines[1].replace(/,$/, '.')];
  lines.push(`${spellCount(nights)} ${nights === 1 ? 'night' : 'nights'}.`);
  return lines;
}

function tripNights(trip: TripInput): number | null {
  const nights = differenceInDateOnlyDays(trip.start, trip.end);
  return nights > 0 ? nights : null;
}

function moneyOf(line: OccurrenceInput, currency: string): number | null {
  const amount = recordedAmount(line.amount);
  const code = normalizeCurrency(line.currency);
  if (amount == null || code !== currency) return null;
  return amount;
}

function primaryCurrency(lines: OccurrenceInput[]): string | null {
  const counts = new Map<string, number>();
  for (const line of lines) {
    const amount = recordedAmount(line.amount);
    const currency = normalizeCurrency(line.currency);
    if (amount == null || !currency) continue;
    counts.set(currency, (counts.get(currency) ?? 0) + 1);
  }
  const ranked = [...counts.entries()].sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]));
  return ranked[0]?.[0] ?? null;
}

function moneyByCurrency(lines: OccurrenceInput[]): StoryMoney[] {
  const totals = new Map<string, number>();
  for (const line of lines) {
    const amount = recordedAmount(line.amount);
    const currency = normalizeCurrency(line.currency);
    if (amount == null || !currency) continue;
    totals.set(currency, (totals.get(currency) ?? 0) + amount);
  }
  return [...totals.entries()]
    .map(([currency, amount]) => ({ currency, amount: Math.round(amount) }))
    .sort((left, right) => left.currency.localeCompare(right.currency));
}

function categorySlices(lines: OccurrenceInput[], currency: string | null, total: number): CategorySlice[] {
  if (!currency || total <= 0) return [];
  return CATEGORY_ORDER.map((key) => {
    const amount = categoryAmount(lines, key, currency);
    return {
      key,
      label: CATEGORY_STYLE[key].label,
      amount,
      color: CATEGORY_STYLE[key].color,
      percent: (amount / total) * 100,
    };
  }).filter((slice) => slice.amount > 0);
}

function categoryAmount(lines: OccurrenceInput[], category: CostCategory, currency: string | null): number {
  if (!currency) return 0;
  return sum(lines.filter((line) => line.category === category).map((line) => moneyOf(line, currency) ?? 0));
}

function buildMonths(current: OccurrenceInput[], all: OccurrenceInput[], currency: string | null): MonthBucket[] {
  if (!currency) return [];
  const currentMap = monthSums(current, currency);
  const keys = [...currentMap.keys()].sort();
  if (!keys.length) return [];
  const span = monthSpan(keys[0], keys[keys.length - 1]);
  const natural = span + 1;
  const length = natural <= 12 ? 12 : natural;
  const padded = Array.from({ length }, (_, index) => addMonths(keys[0], index));
  const priorMap = monthSums(all, currency);
  const hasPrior = padded.some((key) => (priorMap.get(shiftMonth(key, -12)) ?? 0) > 0);
  return padded.map((key) => ({
    key,
    label: MONTHS[Number(key.slice(5, 7)) - 1],
    amount: currentMap.get(key) ?? 0,
    prior: hasPrior ? (priorMap.get(shiftMonth(key, -12)) ?? 0) : null,
  }));
}

function monthSums(lines: OccurrenceInput[], currency: string): Map<string, number> {
  const map = new Map<string, number>();
  for (const line of lines) {
    const amount = moneyOf(line, currency);
    const key = line.serviceDate?.slice(0, 7);
    if (amount == null || !key || key.length !== 7) continue;
    map.set(key, (map.get(key) ?? 0) + amount);
  }
  return map;
}

function tripsTouchingMonths(lines: OccurrenceInput[], trips: TripInput[], months: string[], currency: string | null): TripInput[] {
  if (!currency) return [];
  const wanted = new Set(months);
  const ids = new Set(lines.filter((line) => {
    const key = line.serviceDate?.slice(0, 7);
    return key && wanted.has(key) && moneyOf(line, currency) != null;
  }).map((line) => line.tripId).filter((id): id is string => Boolean(id)));
  return trips.filter((trip) => ids.has(trip.id));
}

function perTraveler(trips: TripInput[], spend: StoryMoney | null): { amount: StoryMoney } | null {
  if (!spend || !trips.length) return null;
  if (trips.some((trip) => (trip.travelers ?? 0) < 1)) return null;
  const travelers = trips.reduce((total, trip) => total + (trip.travelers ?? 0), 0);
  if (travelers < 1) return null;
  return { amount: { currency: spend.currency, amount: Math.round(spend.amount / travelers) } };
}

function legMiles(line: OccurrenceInput): number | null {
  if (line.category !== 'flights') return null;
  const origin = AIRPORTS[line.origin?.toUpperCase() ?? ''];
  const destination = AIRPORTS[line.destination?.toUpperCase() ?? ''];
  if (!origin || !destination) return null;
  return greatCircleMiles(origin, destination);
}

function countriesOf(trips: TripInput[]): string[] {
  const found = new Map<string, string>();
  for (const trip of trips) {
    for (const location of trip.locations ?? []) {
      const country = parsePlace(location).country;
      if (!country) continue;
      const key = country.toLowerCase();
      if (!found.has(key)) found.set(key, country);
    }
  }
  return [...found.values()];
}

function tripCard(trip: TripInput, lines: OccurrenceInput[], currency: string | null): TripCardModel {
  const own = lines.filter((line) => line.tripId === trip.id);
  const segments = CATEGORY_ORDER.map((key) => ({
    color: CATEGORY_STYLE[key].color,
    amount: currency ? categoryAmount(own, key, currency) : 0,
  })).filter((segment) => segment.amount > 0);
  const total = currency ? sum(segments.map((segment) => segment.amount)) : 0;
  const flights = own.filter((line) => line.category === 'flights');
  const distances = flights.map(legMiles);
  const miles = flights.length > 0 && distances.every((distance) => distance != null)
    ? distances.reduce<number>((sumMiles, distance) => sumMiles + (distance ?? 0), 0)
    : null;
  const start = trip.start ?? '';
  const route = (trip.locations ?? []).map((location) => parsePlace(location).label).filter(Boolean).join(' → ');
  const nights = tripNights(trip);
  const travelers = trip.travelers ?? null;
  const detail = [
    route,
    nights ? `${nights} ${nights === 1 ? 'night' : 'nights'}` : '',
    travelers ? `${travelers} ${travelers === 1 ? 'traveler' : 'travelers'}` : '',
  ].filter(Boolean).join(' · ');
  const code = trip.code?.startsWith('demo:') ? trip.code.slice(5) : trip.code ?? null;
  return {
    id: trip.id,
    name: trip.name,
    note: trip.note ?? null,
    month: start ? (MONTHS[Number(start.slice(5, 7)) - 1] ?? '').toUpperCase() : '',
    day: start ? String(Number(start.slice(8, 10))) : '',
    year: start.slice(0, 4),
    route: detail,
    total: total > 0 ? total : null,
    currency: total > 0 ? currency : null,
    perTraveler: total > 0 && travelers ? Math.round(total / travelers) : null,
    miles,
    code,
    segments,
  };
}

function valueBands(totals: number[], currency: string | null): BandRow[] {
  if (!currency || !totals.length) return [];
  const max = Math.max(...totals);
  const cuts = bandCuts(max);
  const groups = [
    { name: 'High', color: '#F2536E', match: (amount: number) => amount >= cuts.high, label: `High (${formatStoryMoney(cuts.high, currency)} and up)` },
    { name: 'Mid', color: '#EE7C5C', match: (amount: number) => amount >= cuts.mid && amount < cuts.high, label: `Mid (${formatStoryMoney(cuts.mid, currency)} – ${formatStoryMoney(cuts.high, currency)})` },
    { name: 'Entry', color: '#E2913C', match: (amount: number) => amount < cuts.mid, label: `Entry (under ${formatStoryMoney(cuts.mid, currency)})` },
  ];
  return groups.map((group) => {
    const members = totals.filter(group.match);
    return {
      label: group.label,
      color: group.color,
      trips: members.length,
      amount: sum(members),
    };
  }).filter((group) => group.trips > 0);
}

function bandCuts(max: number): { high: number; mid: number } {
  if (max >= 5000) {
    const high = Math.max(1, Math.round((max * 0.7) / 1000) * 1000);
    const mid = Math.max(1, Math.round((max * 0.5) / 1000) * 1000);
    if (high > mid) return { high, mid };
  }
  return { high: max * 0.7, mid: max * 0.5 };
}

function feelBars(input: { miles: number | null; nights: number | null; dining: number; flights: number; countries: number; spend: number; currency: string | null }): ComparisonItem[] {
  const items: ComparisonItem[] = [];
  if (input.miles != null) {
    items.push({ icon: '🌍', value: formatTurns(input.miles, EARTH_MILES), label: 'around the earth', percent: Math.min(100, (input.miles / EARTH_MILES) * 100) });
  }
  if (input.nights != null) {
    items.push({ icon: '🛏', value: input.nights.toLocaleString('en-US'), label: "nights in a bed that isn't yours", percent: Math.min(100, (input.nights / 80) * 100) });
  }
  if (input.dining > 0) {
    items.push({ icon: '🍽', value: formatStoryMoney(input.dining, input.currency ?? 'USD'), label: 'spent at the table', percent: input.spend > 0 ? Math.max(8, (input.dining / input.spend) * 100) : 8 });
  }
  if (input.flights > 0) {
    items.push({ icon: '✈', value: String(input.flights), label: input.flights === 1 ? 'flight planned' : 'flights planned', percent: Math.min(100, input.flights * 8) });
  }
  if (input.countries > 0) {
    items.push({ icon: '📍', value: String(input.countries), label: input.countries === 1 ? 'country on the route' : 'countries on the route', percent: Math.min(100, input.countries * 18) });
  }
  return items;
}

function buildPassport(input: {
  miles: number | null;
  flightLines: OccurrenceInput[];
  legDistances: Array<{ line: OccurrenceInput; miles: number | null }>;
  countries: number;
  profileCountries: number | null;
  nights: number | null;
  trips: TripInput[];
  records: Array<{ line: OccurrenceInput; miles: number | null }>;
}): TravelStory['passport'] {
  const known = input.records.filter((record): record is { line: OccurrenceInput; miles: number } => record.miles != null);
  const longest = [...known].sort((left, right) => right.miles - left.miles)[0];
  const shortest = [...known].sort((left, right) => left.miles - right.miles)[0];
  const byTrip = new Map<string, number>();
  for (const line of input.flightLines) {
    if (!line.tripId) continue;
    byTrip.set(line.tripId, (byTrip.get(line.tripId) ?? 0) + 1);
  }
  const busiest = [...byTrip.entries()].sort((left, right) => right[1] - left[1])[0];
  const busiestTrip = input.trips.find((trip) => trip.id === busiest?.[0]);
  const records: FlightRecord[] = [];
  if (longest) {
    records.push({
      title: 'Longest hop',
      route: routeOf(longest.line),
      subtitle: subtitleOf(longest.line, input.trips),
      value: longest.miles.toLocaleString('en-US'),
      unit: 'mi',
      icon: 'plane',
    });
  }
  if (shortest && longest && shortest.line.id !== longest.line.id) {
    records.push({
      title: 'Shortest hop',
      route: routeOf(shortest.line),
      subtitle: subtitleOf(shortest.line, input.trips),
      value: shortest.miles.toLocaleString('en-US'),
      unit: 'mi',
      icon: 'plane',
    });
  }
  if (busiest && busiestTrip && busiest[1] > 1) {
    records.push({
      title: 'Most flights',
      route: busiestTrip.name,
      subtitle: `${busiest[1]} flights on this trip`,
      value: String(busiest[1]),
      unit: 'flights',
      icon: 'route',
    });
  }
  const weekdayMap = new Map<string, number>();
  for (const line of input.flightLines) {
    const day = weekdayOfDateOnly(line.serviceDate);
    if (!day) continue;
    weekdayMap.set(day, (weekdayMap.get(day) ?? 0) + 1);
  }
  const far: ComparisonItem[] = [];
  if (input.miles != null) {
    far.push({ icon: '🌍', value: formatTurns(input.miles, EARTH_MILES), label: 'around the earth', percent: Math.min(100, (input.miles / EARTH_MILES) * 100) });
    far.push({ icon: '🌙', value: formatTurns(input.miles, MOON_MILES), label: 'of the way to the moon', percent: Math.max(6, Math.min(100, (input.miles / MOON_MILES) * 100)) });
  }
  if (longest) {
    far.push({ icon: '🧭', value: longest.miles.toLocaleString('en-US'), label: 'miles, longest single hop', percent: input.miles ? Math.max(8, (longest.miles / input.miles) * 100) : 40 });
  }
  if (input.nights != null) {
    far.push({ icon: '🛏', value: input.nights.toLocaleString('en-US'), label: input.nights === 1 ? 'night away' : 'nights away', percent: Math.min(100, (input.nights / 80) * 100) });
  }
  const missing = input.flightLines.length - known.length;
  return {
    miles: input.miles,
    milesDetail: input.miles == null
      ? (input.flightLines.length ? `Distance needs airports on every flight. ${missing} ${missing === 1 ? 'leg is' : 'legs are'} missing one.` : 'No flights in this view.')
      : `${input.flightLines.length} ${input.flightLines.length === 1 ? 'flight' : 'flights'} · great-circle`,
    countries: input.countries,
    profileCountries: input.profileCountries,
    nights: input.nights,
    nightsDetail: input.nights != null && input.nights <= 365 ? `${Math.round((input.nights / 365) * 100)}% of the year` : null,
    longest: longest ? { miles: longest.miles, route: routeOf(longest.line) } : null,
    far,
    records,
    weekdays: WEEKDAYS.map((day) => ({ label: day.slice(0, 3), count: weekdayMap.get(day) ?? 0 })),
  };
}

function routeOf(line: OccurrenceInput): string {
  if (line.origin && line.destination) return `${line.origin} → ${line.destination}`;
  return line.title?.trim() || 'Flight';
}

function subtitleOf(line: OccurrenceInput, trips: TripInput[]): string {
  const trip = trips.find((item) => item.id === line.tripId)?.name;
  return [line.title, trip, line.memo].filter(Boolean).join(' · ');
}

function milesCaptionFor(miles: number | null, flights: number, missing: number): string | null {
  if (miles == null) {
    if (!flights) return null;
    return `Great-circle distance needs an airport on every flight. ${missing} ${missing === 1 ? 'leg is' : 'legs are'} missing one.`;
  }
  return `${formatTurns(miles, EARTH_MILES)} around the earth`;
}

function buildFootnote(priced: number, trips: number, currency: string | null, others: StoryMoney[]): string {
  const lineWord = priced === 1 ? 'line' : 'lines';
  const tripWord = trips === 1 ? 'itinerary' : 'itineraries';
  const money = currency ? `priced ${currency} ${lineWord}` : `priced ${lineWord}`;
  let text = `Planned and recorded amounts only. A line without a currency is left out rather than counted as zero — totals here cover the ${priced} ${money} across your ${trips} ${tripWord}.`;
  if (others.length) {
    const list = others.map((row) => formatStoryMoney(row.amount, row.currency)).join(', ');
    text += ` ${list} ${others.length === 1 ? 'is' : 'are'} kept separate.`;
  }
  return text;
}

function buildShare(headline: string[], spend: StoryMoney | null, nights: number | null, miles: number | null): string {
  const lines = [headline.join(' ').replace(/\s+/g, ' ')];
  if (spend) lines.push(`Planned spend ${formatStoryMoney(spend.amount, spend.currency)}`);
  if (nights != null) lines.push(`${nights} nights away`);
  if (miles != null) lines.push(`${miles.toLocaleString('en-US')} great-circle miles`);
  lines.push('Planned amounts only. taai does not book travel.');
  return lines.join('\n');
}

/** Passport-style name: uppercased, accents removed, spaces and punctuation become <. */
export function mrzName(name: string | null | undefined): string {
  const stripped = (name ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  const encoded = stripped
    .toUpperCase()
    .replace(/[^A-Z]+/g, '<')
    .replace(/^<+|<+$/g, '');
  return encoded || 'TRAVELER';
}

function buildMrz(name: string | null, trips: number, nights: number | null, countries: number, home: string | null, today: string): string {
  const issued = mrzDate(today);
  const body = `TAAI<<${mrzName(name)}<<${trips}TRIPS<${nights ?? 0}N<${countries}CTY`;
  const tail = `ISSUED${issued}${home ?? ''}`;
  const filler = '<'.repeat(Math.max(4, 72 - body.length - tail.length));
  return `${body}${filler}${tail}<<<<TAAI.TRAVEL`;
}

function mrzDate(today: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(today);
  if (!match) return '';
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  return `${match[3]}${months[Number(match[2]) - 1] ?? ''}${match[1].slice(2)}`;
}

function dateSpan(trip: TripInput): string | null {
  const start = formatDateOnly(trip.start, 'MMM d');
  const end = formatDateOnly(trip.end, 'MMM d');
  if (!start || !end) return null;
  return `${start} – ${end}`;
}

function formatTurns(miles: number, baseline: number): string {
  const value = miles / baseline;
  if (value >= 10) return `${Math.round(value)}×`;
  if (value >= 1) return `${(Math.round(value * 10) / 10).toFixed(1)}×`;
  return `${(Math.round(value * 100) / 100).toFixed(2)}×`;
}

function knownCountry(value: string): string | null {
  const canonical = canonicalCountry(value);
  return COUNTRY_NAMES.has(canonical.toLowerCase()) ? canonical : null;
}

function canonicalCountry(value: string): string {
  const key = value.trim().toLowerCase();
  return COUNTRY_ALIASES[key] ?? COUNTRY_ALIASES[key.replace(/\./g, '')] ?? value.trim();
}

function mode(values: string[]): string | null {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  const ranked = [...counts.entries()].sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]));
  return ranked[0]?.[0] ?? null;
}

function median(sorted: number[]): number {
  if (!sorted.length) return 0;
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return Math.round(sorted[mid]);
  return Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function capitalize(value: string): string {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

function addMonths(key: string, count: number): string {
  const [year, month] = key.split('-').map(Number);
  const index = year * 12 + (month - 1) + count;
  const nextYear = Math.floor(index / 12);
  const nextMonth = (index % 12) + 1;
  return `${nextYear}-${String(nextMonth).padStart(2, '0')}`;
}

function shiftMonth(key: string, count: number): string {
  return addMonths(key, count);
}

function monthSpan(start: string, end: string): number {
  const [startYear, startMonth] = start.split('-').map(Number);
  const [endYear, endMonth] = end.split('-').map(Number);
  return (endYear * 12 + endMonth) - (startYear * 12 + startMonth);
}

function monthTick(key: string, keys: string[]): string {
  const label = MONTHS[Number(key.slice(5, 7)) - 1];
  const duplicates = keys.filter((item) => item.slice(5, 7) === key.slice(5, 7)).length > 1;
  return duplicates ? `${label} '${key.slice(2, 4)}` : label;
}

function rangeLabel(start: string, end: string): string {
  const startYear = start.slice(0, 4);
  const endYear = end.slice(0, 4);
  if (startYear === endYear) return startYear;
  return `${startYear} – ${endYear.slice(2)}`;
}
