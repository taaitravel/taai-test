import { asDateOnly, compareDateOnly, differenceInDateOnlyDays } from '@/lib/date-time';
import { classifyTripPhase, weekdayOfDateOnly } from '@/lib/dashboard/trip-phase';

/**
 * Travel metrics for the signed-in dashboard.
 *
 * Recorded cost, planned cost, traveler-reported payment, and settled payment
 * stay separate. A stored estimate is never labeled paid. Amounts without a
 * currency are counted as coverage gaps and are not added into a total.
 * Mixed currencies are not converted. A missing price is not reported as zero.
 */

export const COST_CATEGORIES = [
  'flights',
  'properties',
  'activities',
  'dining',
  'transport',
  'unclassified',
] as const;

export type CostCategory = (typeof COST_CATEGORIES)[number];
export type CategoryFilter = CostCategory | 'all';
export type Provenance = 'user' | 'synthetic' | 'fixture' | 'qa_fixture';
export type TimeFilter = { kind: 'all' } | { kind: 'year'; year: number };

export const PROVENANCE_GAP =
  'No itinerary column marks QA or test trips. A name such as “QA” is not treated as a fixture, so those trips stay visible. Exclusion happens only when a record carries provenance synthetic, fixture, or qa_fixture.';

const FIXTURE_PROVENANCE = new Set<Provenance>(['synthetic', 'fixture', 'qa_fixture']);

export interface TripInput {
  id: string;
  name: string;
  start: string | null;
  end: string | null;
  budget: number | null;
  spending: number | null;
  provenance?: Provenance | null;
}

export interface OccurrenceInput {
  id: string;
  tripId: string | null;
  source: 'cart' | 'external' | 'provider';
  category: CostCategory;
  amount: number | null;
  currency: string | null;
  serviceDate: string | null;
  serviceEnd: string | null;
  status: string | null;
  cancelled?: boolean;
  archived?: boolean;
  rooms: number | null;
  segments: number | null;
  linkedToId: string | null;
  provenance?: Provenance | null;
}

export interface ShareInput {
  id: string;
  occurrenceId: string;
  attendeeUserId: string | null;
  method: string;
  amount: number | null;
  autoAdded: boolean;
  paymentStatus: string | null;
}

export interface SettlementInput {
  id: string;
  occurrenceId: string | null;
  category: CostCategory;
  amount: number | null;
  currency: string | null;
  settledOn: string | null;
  status: string | null;
}

export interface ReportedPaymentInput {
  id: string;
  occurrenceId: string | null;
  category: CostCategory;
  amount: number | null;
  currency: string | null;
  status: string;
  evidence: string;
}

export interface MetricsInput {
  trips: TripInput[];
  occurrences: OccurrenceInput[];
  shares: ShareInput[];
  settlements: SettlementInput[];
  reportedPayments: ReportedPaymentInput[];
  reimbursementCount: number;
}

export interface MetricsQuery {
  today: string;
  time: TimeFilter;
  category: CategoryFilter;
  viewerId: string | null;
}

export interface MoneyTotal {
  currency: string;
  amount: number;
  count: number;
}

export interface CategoryRollup {
  eligible: number;
  cancelledExcluded: number;
  archivedExcluded: number;
  missingPrice: number;
  missingCurrency: number;
  missingServiceDate: number;
  byCurrency: MoneyTotal[];
}

export interface PricedAverage {
  currency: string;
  average: number;
  priced: number;
  total: number;
}

export interface ScheduleCohort {
  eligible: number;
  averages: PricedAverage[];
  pricedWithoutCurrency: number;
}

export interface ChartPoint {
  date: string;
  cumulative: number;
}

export interface ChartSeries {
  currency: string;
  kind: 'recorded' | 'settled';
  points: ChartPoint[];
}

export interface CashflowTotal {
  currency: string;
  gross: number;
  refunds: number;
  net: number | null;
  grossCount: number;
  refundCount: number;
  missingRefundAmount: number;
}

export interface OpenTripFigure {
  id: string;
  name: string;
  phase: 'active' | 'upcoming' | 'planning';
  spending: number | null;
  budget: number | null;
}

export interface MetricsResult {
  categories: Record<CostCategory | 'all', CategoryRollup>;
  reconciliationOk: boolean;
  recordedChart: ChartSeries[];
  settledChart: ChartSeries[];
  cashflow: CashflowTotal[];
  cashflowNote: string;
  reportedByCurrency: MoneyTotal[];
  reportedMissingAmount: number;
  personalShare: MoneyTotal[];
  personalShareNote: string;
  unusedEqualSplits: number;
  refundedSharesExcluded: number;
  personalMissingCurrency: number;
  groupTotals: MoneyTotal[];
  reimbursementsExcluded: number;
  fixturesExcluded: number;
  openTripFigures: OpenTripFigure[];
  activity: {
    scheduled: ScheduleCohort;
    completed: ScheduleCohort;
    undated: number;
  };
  weekdayCounts: Array<{ weekday: string; count: number }>;
  flights: {
    bookings: number;
    segmentsKnown: number | null;
    bookingsMissingSegments: number;
    fares: MoneyTotal[];
  };
  hotels: {
    stays: number;
    roomNights: number | null;
    staysMissingRooms: number;
    staysMissingNights: number;
    averageStayPrice: PricedAverage[];
  };
  years: number[];
  datedOccurrencesOmitted: number;
  datedSettlementsOmitted: number;
}

export function normalizeCurrency(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const code = value.trim().toUpperCase();
  return /^[A-Z]{3}$/.test(code) ? code : null;
}

/** Positive finite amounts only. Zero is not treated as a recorded price. */
export function recordedAmount(value: unknown): number | null {
  const amount = typeof value === 'number' ? value : typeof value === 'string' && value.trim() ? Number(value) : NaN;
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return Math.round(amount * 100) / 100;
}

export function isCancelledStatus(status: string | null | undefined, flagged?: boolean): boolean {
  if (flagged) return true;
  const value = (status ?? '').trim().toLowerCase();
  return value === 'cancelled' || value === 'canceled';
}

export function categoryForSource(type: string | null | undefined, itemKind?: string | null): CostCategory {
  const kind = `${itemKind ?? ''} ${type ?? ''}`.trim().toLowerCase();
  if (!kind) return 'unclassified';
  if (/(^|[^a-z])(flight|flights)([^a-z]|$)/.test(kind)) return 'flights';
  if (/(hotel|property|properties|accommodation|stay)/.test(kind)) return 'properties';
  if (/(activity|activities|tour|experience)/.test(kind)) return 'activities';
  if (/(dining|restaurant|reservation)/.test(kind) && !/transfer/.test(kind)) return 'dining';
  if (/(car|cars|transport|rail|transfer|ferry)/.test(kind)) return 'transport';
  return 'unclassified';
}

export function isFixtureProvenance(value: Provenance | null | undefined): boolean {
  return value != null && FIXTURE_PROVENANCE.has(value);
}

export function occupiedNights(checkIn: string | null, checkOut: string | null): number | null {
  const start = asDateOnly(checkIn);
  const end = asDateOnly(checkOut);
  if (!start || !end) return null;
  const nights = differenceInDateOnlyDays(start, end);
  return nights > 0 ? nights : null;
}

export function roomNights(rooms: number | null, nights: number | null): number | null {
  if (nights == null || rooms == null) return null;
  if (!Number.isInteger(rooms) || rooms <= 0) return null;
  return rooms * nights;
}

const EMPTY_ROLLUP = (): CategoryRollup => ({
  eligible: 0,
  cancelledExcluded: 0,
  archivedExcluded: 0,
  missingPrice: 0,
  missingCurrency: 0,
  missingServiceDate: 0,
  byCurrency: [],
});

function cents(amount: number): number {
  return Math.round(amount * 100);
}

function fromCents(value: number): number {
  return Math.round(value) / 100;
}

function addMoney(map: Map<string, { cents: number; count: number }>, currency: string, amount: number) {
  const row = map.get(currency) ?? { cents: 0, count: 0 };
  row.cents += cents(amount);
  row.count += 1;
  map.set(currency, row);
}

function moneyList(map: Map<string, { cents: number; count: number }>): MoneyTotal[] {
  return [...map.entries()]
    .map(([currency, row]) => ({ currency, amount: fromCents(row.cents), count: row.count }))
    .sort((left, right) => left.currency.localeCompare(right.currency));
}

/** Calendar dates only. A timestamp prefix is not a service-local or settlement date. */
function exactDateOnly(value: string | null | undefined): string | null {
  if (typeof value !== 'string' || value.trim().length !== 10) return null;
  return asDateOnly(value.trim());
}

function inTime(date: string | null, time: TimeFilter): 'in' | 'out' | 'undated' {
  const exact = exactDateOnly(date);
  if (!exact) return 'undated';
  if (time.kind === 'all') return 'in';
  return exact.slice(0, 4) === String(time.year) ? 'in' : 'out';
}

function serviceComplete(record: OccurrenceInput, today: string): boolean | null {
  const end = exactDateOnly(record.serviceEnd);
  const start = exactDateOnly(record.serviceDate);
  if (record.category === 'properties' && end) {
    return compareDateOnly(today, end) >= 0;
  }
  const boundary = end ?? start;
  if (!boundary) {
    if ((record.status ?? '').toLowerCase() === 'completed') return true;
    return null;
  }
  return compareDateOnly(boundary, today) < 0;
}

function averagesFor(records: OccurrenceInput[]): { averages: PricedAverage[]; pricedWithoutCurrency: number } {
  const total = records.length;
  const map = new Map<string, { cents: number; count: number }>();
  let pricedWithoutCurrency = 0;
  for (const record of records) {
    const amount = recordedAmount(record.amount);
    const currency = normalizeCurrency(record.currency);
    if (amount == null) continue;
    if (!currency) {
      pricedWithoutCurrency += 1;
      continue;
    }
    addMoney(map, currency, amount);
  }
  const averages = moneyList(map).map((row) => ({
    currency: row.currency,
    average: fromCents(Math.round((cents(row.amount)) / row.count)),
    priced: row.count,
    total,
  }));
  return { averages, pricedWithoutCurrency };
}

function collapseLinked(records: OccurrenceInput[]): OccurrenceInput[] {
  const byId = new Map(records.map((record) => [record.id, record]));
  const dropped = new Set<string>();
  for (const record of records) {
    if (!record.linkedToId || dropped.has(record.id)) continue;
    const other = byId.get(record.linkedToId);
    if (!other || other.id === record.id) continue;
    const recordMoney = recordedAmount(record.amount) != null && normalizeCurrency(record.currency);
    const otherMoney = recordedAmount(other.amount) != null && normalizeCurrency(other.currency);
    if (recordMoney && !otherMoney) dropped.add(other.id);
    else dropped.add(record.id);
  }
  return records.filter((record) => !dropped.has(record.id));
}

function explicitShare(share: ShareInput): boolean {
  const method = share.method.trim().toLowerCase();
  if (share.autoAdded) return false;
  if (method === 'equal') return false;
  return method === 'amount' || method === 'percent';
}

export function buildTravelMetrics(input: MetricsInput, query: MetricsQuery): MetricsResult {
  const fixtureTripIds = new Set(
    input.trips.filter((trip) => isFixtureProvenance(trip.provenance)).map((trip) => trip.id),
  );
  const fixturesExcluded = input.trips.filter((trip) => fixtureTripIds.has(trip.id)).length;

  const keptTrips = input.trips.filter((trip) => !fixtureTripIds.has(trip.id));
  const rawOccurrences = input.occurrences.filter((record) => {
    if (isFixtureProvenance(record.provenance)) return false;
    if (record.tripId && fixtureTripIds.has(record.tripId)) return false;
    return true;
  });
  const occurrences = collapseLinked(rawOccurrences);

  const years = new Set<number>();
  for (const record of occurrences) {
    if (record.archived || isCancelledStatus(record.status, record.cancelled)) continue;
    const date = exactDateOnly(record.serviceDate);
    if (date) years.add(Number(date.slice(0, 4)));
  }
  for (const payment of input.settlements) {
    const status = (payment.status ?? '').toLowerCase();
    if (status !== 'completed' && status !== 'refunded') continue;
    const date = exactDateOnly(payment.settledOn);
    if (date) years.add(Number(date.slice(0, 4)));
  }

  const categoryMatches = (category: CostCategory) => query.category === 'all' || query.category === category;

  const rollups = Object.fromEntries(COST_CATEGORIES.map((category) => [category, EMPTY_ROLLUP()])) as Record<CostCategory, CategoryRollup>;
  const all = EMPTY_ROLLUP();
  const recordedSeries = new Map<string, Map<string, number>>();
  let datedOccurrencesOmitted = 0;

  const considered = occurrences.filter((record) => categoryMatches(record.category));

  for (const record of considered) {
    const rollup = rollups[record.category];
    const touch = (target: CategoryRollup, field: keyof CategoryRollup) => {
      if (field === 'byCurrency') return;
      target[field] += 1;
      all[field] += 1;
    };
    if (record.archived) {
      touch(rollup, 'archivedExcluded');
      continue;
    }
    if (isCancelledStatus(record.status, record.cancelled)) {
      touch(rollup, 'cancelledExcluded');
      continue;
    }
    const timing = inTime(record.serviceDate, query.time);
    if (timing === 'out') {
      datedOccurrencesOmitted += 1;
      continue;
    }
    if (timing === 'undated' && query.time.kind === 'year') continue;
    touch(rollup, 'eligible');
    const amount = recordedAmount(record.amount);
    const currency = normalizeCurrency(record.currency);
    if (amount == null) touch(rollup, 'missingPrice');
    else if (!currency) touch(rollup, 'missingCurrency');
    if (timing === 'undated') touch(rollup, 'missingServiceDate');
    if (amount != null && currency) {
      addMoney(toMap(rollup), currency, amount);
      addMoney(toMap(all), currency, amount);
      const serviceDate = exactDateOnly(record.serviceDate);
      if (timing === 'in' && serviceDate) {
        const byDate = recordedSeries.get(currency) ?? new Map<string, number>();
        byDate.set(serviceDate, (byDate.get(serviceDate) ?? 0) + cents(amount));
        recordedSeries.set(currency, byDate);
      }
    }
  }

  for (const category of COST_CATEGORIES) rollups[category].byCurrency = moneyList(toMap(rollups[category]));
  all.byCurrency = moneyList(toMap(all));

  const summed = new Map<string, { cents: number; count: number }>();
  for (const category of COST_CATEGORIES) {
    for (const row of rollups[category].byCurrency) {
      const current = summed.get(row.currency) ?? { cents: 0, count: 0 };
      current.cents += cents(row.amount);
      current.count += row.count;
      summed.set(row.currency, current);
    }
  }
  const summedList = moneyList(summed);
  const reconciliationOk = summedList.length === all.byCurrency.length
    && summedList.every((row, index) => {
      const other = all.byCurrency[index];
      return other?.currency === row.currency && other.amount === row.amount && other.count === row.count;
    });

  const eligibleNow = considered.filter((record) => {
    if (record.archived || isCancelledStatus(record.status, record.cancelled)) return false;
    const timing = inTime(record.serviceDate, query.time);
    if (timing === 'out') return false;
    if (timing === 'undated' && query.time.kind === 'year') return false;
    return true;
  });

  const activityRecords = eligibleNow.filter((record) => record.category === 'activities' && (query.category === 'all' || query.category === 'activities'));
  const scheduled: OccurrenceInput[] = [];
  const completed: OccurrenceInput[] = [];
  let undated = 0;
  for (const record of activityRecords) {
    const done = serviceComplete(record, query.today);
    if (done === true) completed.push(record);
    else if (done === false) scheduled.push(record);
    else undated += 1;
  }
  const scheduledCohort = averagesFor(scheduled);
  const completedCohort = averagesFor(completed);

  const weekdayMap = new Map<string, number>();
  for (const record of eligibleNow) {
    const day = weekdayOfDateOnly(exactDateOnly(record.serviceDate));
    if (!day) continue;
    weekdayMap.set(day, (weekdayMap.get(day) ?? 0) + 1);
  }
  const weekdayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const weekdayCounts = weekdayOrder
    .filter((weekday) => weekdayMap.has(weekday))
    .map((weekday) => ({ weekday, count: weekdayMap.get(weekday) ?? 0 }));

  const flightRecords = eligibleNow.filter((record) => record.category === 'flights');
  let segmentsKnown = 0;
  let bookingsMissingSegments = 0;
  let anySegments = false;
  const flightMoney = new Map<string, { cents: number; count: number }>();
  for (const record of flightRecords) {
    if (record.segments == null || !Number.isInteger(record.segments) || record.segments <= 0) {
      bookingsMissingSegments += 1;
    } else {
      anySegments = true;
      segmentsKnown += record.segments;
    }
    const amount = recordedAmount(record.amount);
    const currency = normalizeCurrency(record.currency);
    if (amount != null && currency) addMoney(flightMoney, currency, amount);
  }

  const hotelRecords = eligibleNow.filter((record) => record.category === 'properties');
  let roomNightTotal = 0;
  let staysMissingRooms = 0;
  let staysMissingNights = 0;
  let anyRoomNights = false;
  for (const record of hotelRecords) {
    const nights = occupiedNights(exactDateOnly(record.serviceDate), exactDateOnly(record.serviceEnd));
    const rooms = roomNights(record.rooms, nights);
    if (nights == null) staysMissingNights += 1;
    if (record.rooms == null) staysMissingRooms += 1;
    if (rooms == null) continue;
    anyRoomNights = true;
    roomNightTotal += rooms;
  }
  const hotelPrices = averagesFor(hotelRecords);

  const occurrenceById = new Map(occurrences.map((record) => [record.id, record]));
  const personal = new Map<string, { cents: number; count: number }>();
  let unusedEqualSplits = 0;
  let refundedSharesExcluded = 0;
  let personalMissingCurrency = 0;
  for (const share of input.shares) {
    const parent = occurrenceById.get(share.occurrenceId);
    if (!parent || parent.archived || isCancelledStatus(parent.status, parent.cancelled)) continue;
    if (parent.tripId && fixtureTripIds.has(parent.tripId)) continue;
    if (!categoryMatches(parent.category)) continue;
    const shareTiming = inTime(parent.serviceDate, query.time);
    if (shareTiming === 'out' || (shareTiming === 'undated' && query.time.kind === 'year')) continue;
    const status = (share.paymentStatus ?? '').toLowerCase();
    if (status === 'refunded') {
      refundedSharesExcluded += 1;
      continue;
    }
    if (!explicitShare(share)) {
      unusedEqualSplits += 1;
      continue;
    }
    if (query.viewerId && share.attendeeUserId !== query.viewerId) continue;
    if (!query.viewerId) continue;
    const amount = recordedAmount(share.amount);
    const currency = normalizeCurrency(parent.currency);
    if (amount == null) continue;
    if (!currency) {
      personalMissingCurrency += 1;
      continue;
    }
    addMoney(personal, currency, amount);
  }

  const cashflowMap = new Map<string, CashflowTotal>();
  const settledSeries = new Map<string, Map<string, number>>();
  let datedSettlementsOmitted = 0;
  let unrecognizedSettlements = 0;
  let missingSettlementCurrency = 0;
  let missingSettlementDate = 0;
  for (const payment of input.settlements) {
    if (!categoryMatches(payment.category)) continue;
    const timing = inTime(payment.settledOn, query.time);
    if (timing === 'out') {
      datedSettlementsOmitted += 1;
      continue;
    }
    const status = (payment.status ?? '').trim().toLowerCase();
    if (status !== 'completed' && status !== 'refunded') {
      if (status) unrecognizedSettlements += 1;
      continue;
    }
    const currency = normalizeCurrency(payment.currency);
    const amount = recordedAmount(payment.amount);
    if (!currency) {
      missingSettlementCurrency += 1;
      continue;
    }
    const row = cashflowMap.get(currency) ?? {
      currency,
      gross: 0,
      refunds: 0,
      net: 0,
      grossCount: 0,
      refundCount: 0,
      missingRefundAmount: 0,
    };
    if (status === 'refunded' && amount == null) {
      row.missingRefundAmount += 1;
      row.net = null;
      cashflowMap.set(currency, row);
      continue;
    }
    if (amount == null) {
      missingSettlementCurrency += 1;
      continue;
    }
    const settledOn = exactDateOnly(payment.settledOn);
    if (status === 'completed') {
      row.gross = fromCents(cents(row.gross) + cents(amount));
      row.grossCount += 1;
      if (timing === 'in' && settledOn) {
        const byDate = settledSeries.get(currency) ?? new Map<string, number>();
        byDate.set(settledOn, (byDate.get(settledOn) ?? 0) + cents(amount));
        settledSeries.set(currency, byDate);
      }
    } else {
      row.refunds = fromCents(cents(row.refunds) + cents(amount));
      row.refundCount += 1;
      if (timing === 'in' && settledOn) {
        const byDate = settledSeries.get(currency) ?? new Map<string, number>();
        byDate.set(settledOn, (byDate.get(settledOn) ?? 0) - cents(amount));
        settledSeries.set(currency, byDate);
      }
    }
    if (timing === 'undated') missingSettlementDate += 1;
    if (row.missingRefundAmount === 0) row.net = fromCents(cents(row.gross) - cents(row.refunds));
    cashflowMap.set(currency, row);
  }

  const reported = new Map<string, { cents: number; count: number }>();
  let reportedMissingAmount = 0;
  for (const payment of input.reportedPayments) {
    if (!categoryMatches(payment.category)) continue;
    if (payment.evidence === 'settled_payment') continue;
    const status = payment.status.toLowerCase();
    if (status !== 'reported_paid' && status !== 'partially_paid') continue;
    const amount = recordedAmount(payment.amount);
    const currency = normalizeCurrency(payment.currency);
    if (amount == null || !currency) {
      reportedMissingAmount += 1;
      continue;
    }
    addMoney(reported, currency, amount);
  }

  const openTripFigures: OpenTripFigure[] = [];
  for (const trip of keptTrips) {
    const phase = classifyTripPhase(trip.start, trip.end, query.today);
    if (phase === 'completed') continue;
    const spending = recordedAmount(trip.spending);
    const budget = recordedAmount(trip.budget);
    if (spending == null && budget == null) continue;
    openTripFigures.push({
      id: trip.id,
      name: trip.name,
      phase,
      spending,
      budget,
    });
  }

  const cashflowNote = [
    'Verified paid spend counts only a completed or refunded settlement with a currency.',
    'Traveler-reported paid amounts stay out of this total.',
    unrecognizedSettlements ? `${unrecognizedSettlements} settlement rows have a status that is not completed or refunded.` : '',
    missingSettlementCurrency ? `${missingSettlementCurrency} settlement rows are missing an amount or currency.` : '',
    missingSettlementDate ? `${missingSettlementDate} included settlements have no settlement date, so they are in the total and not on the cashflow chart.` : '',
  ].filter(Boolean).join(' ');

  return {
    categories: { ...rollups, all },
    reconciliationOk,
    recordedChart: toSeries(recordedSeries, 'recorded'),
    settledChart: toSeries(settledSeries, 'settled'),
    cashflow: [...cashflowMap.values()].sort((left, right) => left.currency.localeCompare(right.currency)),
    cashflowNote,
    reportedByCurrency: moneyList(reported),
    reportedMissingAmount,
    personalShare: moneyList(personal),
    personalShareNote: 'Your share uses an explicit percent or amount split for you. An equal split is not applied, and the person who paid is not treated as the person who owes the cost. Shares are not added on top of the booking total.',
    unusedEqualSplits,
    refundedSharesExcluded,
    personalMissingCurrency,
    groupTotals: all.byCurrency,
    reimbursementsExcluded: Math.max(0, input.reimbursementCount),
    fixturesExcluded,
    openTripFigures,
    activity: {
      scheduled: { eligible: scheduled.length, ...scheduledCohort },
      completed: { eligible: completed.length, ...completedCohort },
      undated,
    },
    weekdayCounts,
    flights: {
      bookings: flightRecords.length,
      segmentsKnown: anySegments ? segmentsKnown : null,
      bookingsMissingSegments,
      fares: moneyList(flightMoney),
    },
    hotels: {
      stays: hotelRecords.length,
      roomNights: anyRoomNights ? roomNightTotal : null,
      staysMissingRooms,
      staysMissingNights,
      averageStayPrice: hotelPrices.averages,
    },
    years: [...years].sort((left, right) => left - right),
    datedOccurrencesOmitted,
    datedSettlementsOmitted,
  };
}

const rollupMaps = new WeakMap<CategoryRollup, Map<string, { cents: number; count: number }>>();

function toMap(rollup: CategoryRollup): Map<string, { cents: number; count: number }> {
  let map = rollupMaps.get(rollup);
  if (!map) {
    map = new Map();
    rollupMaps.set(rollup, map);
  }
  return map;
}

function toSeries(source: Map<string, Map<string, number>>, kind: ChartSeries['kind']): ChartSeries[] {
  return [...source.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([currency, byDate]) => {
      const dates = [...byDate.keys()].sort((left, right) => left.localeCompare(right));
      let running = 0;
      const points = dates.map((date) => {
        running += byDate.get(date) ?? 0;
        return { date, cumulative: fromCents(running) };
      });
      return { currency, kind, points };
    });
}

export function formatRecordedMoney(amount: number, currency: string): string {
  const code = normalizeCurrency(currency);
  if (!code) return amount.toFixed(2);
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code,
      currencyDisplay: 'code',
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${code}`;
  }
}
