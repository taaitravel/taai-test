import { describe, expect, it } from 'vitest';
import { calendarDateInTimeZone, classifyTripInZone, classifyTripPhase, partitionTrips } from './trip-phase';
import { isVerifiedCoordinate } from './coordinates';
import { DASHBOARD_QUICK_ACTIONS, quickActionOpensCheckout } from './quick-actions';
import {
  occurrenceFromCart,
  occurrenceFromExternal,
  reportedFromExternal,
  settlementFromPayment,
} from './analytics-sources';
import {
  buildTravelMetrics,
  categoryForSource,
  occupiedNights,
  roomNights,
  type MetricsInput,
  type MetricsQuery,
} from './travel-metrics';

const TODAY = '2026-11-07';

const query = (overrides: Partial<MetricsQuery> = {}): MetricsQuery => ({
  today: TODAY,
  time: { kind: 'all' },
  category: 'all',
  viewerId: 'viewer',
  ...overrides,
});

const empty = (overrides: Partial<MetricsInput> = {}): MetricsInput => ({
  trips: [],
  occurrences: [],
  shares: [],
  settlements: [],
  reportedPayments: [],
  reimbursementCount: 0,
  ...overrides,
});

describe('trip phase', () => {
  it('keeps a Nov 1–15 trip active on Nov 7', () => {
    expect(classifyTripPhase('2026-11-01', '2026-11-15', '2026-11-07')).toBe('active');
    const parts = partitionTrips(
      [{ id: 1, itin_date_start: '2026-11-01', itin_date_end: '2026-11-15' }],
      '2026-11-07',
    );
    expect(parts.active).toHaveLength(1);
    expect(parts.completed).toHaveLength(0);
    expect(parts.upcoming).toHaveLength(0);
  });

  it('treats the start and end dates as inclusive boundaries', () => {
    expect(classifyTripPhase('2026-11-07', '2026-11-15', '2026-11-07')).toBe('active');
    expect(classifyTripPhase('2026-11-01', '2026-11-07', '2026-11-07')).toBe('active');
    expect(classifyTripPhase('2026-11-08', '2026-11-10', '2026-11-07')).toBe('upcoming');
    expect(classifyTripPhase('2026-10-01', '2026-11-06', '2026-11-07')).toBe('completed');
  });

  it('does not classify a date-only start by parsing it as a UTC instant', () => {
    expect(classifyTripPhase('2026-11-01', '2026-11-15', '2026-11-07')).toBe('active');
  });

  it('uses the destination calendar when a timezone is stored, otherwise the viewer calendar', () => {
    const instant = new Date('2026-11-07T03:00:00.000Z');
    expect(calendarDateInTimeZone(instant, 'America/Los_Angeles')).toBe('2026-11-06');
    expect(calendarDateInTimeZone(instant, 'Europe/Madrid')).toBe('2026-11-07');
    expect(classifyTripInZone('2026-11-07', '2026-11-15', instant, 'America/Los_Angeles', 'Europe/Madrid').phase).toBe('upcoming');
    expect(classifyTripInZone('2026-11-07', '2026-11-15', instant, 'Europe/Madrid', 'America/Los_Angeles').phase).toBe('active');
    expect(classifyTripInZone('2026-11-07', '2026-11-15', instant, null, 'Europe/Madrid')).toMatchObject({
      phase: 'active',
      todaySource: 'viewer',
    });
  });

  it('leaves undated trips out of past and upcoming', () => {
    expect(classifyTripPhase(null, null, TODAY)).toBe('planning');
    expect(classifyTripPhase('2026-11-01', null, TODAY)).toBe('planning');
  });
});

describe('recorded costs are not paid spend', () => {
  it('does not turn a stored trip spending figure into a currency total or a zero', () => {
    const result = buildTravelMetrics(empty({
      trips: [{
        id: 'qa',
        name: 'QA E2E — Iberia 3-City',
        start: '2026-11-01',
        end: '2026-11-15',
        budget: 5000,
        spending: 114705,
      }],
    }), query());
    expect(result.categories.all.byCurrency).toEqual([]);
    expect(result.groupTotals).toEqual([]);
    expect(result.cashflow).toEqual([]);
    expect(result.openTripFigures).toEqual([
      expect.objectContaining({ name: 'QA E2E — Iberia 3-City', spending: 114705, budget: 5000, phase: 'active' }),
    ]);
    expect(result.fixturesExcluded).toBe(0);
  });

  it('excludes a fixture only when provenance is set, never from the name', () => {
    const named = buildTravelMetrics(empty({
      trips: [{ id: '1', name: 'QA weekend', start: '2026-12-01', end: '2026-12-04', budget: 10, spending: 10 }],
    }), query());
    expect(named.fixturesExcluded).toBe(0);
    expect(named.openTripFigures).toHaveLength(1);

    const flagged = buildTravelMetrics(empty({
      trips: [{
        id: '1',
        name: 'Real looking trip',
        start: '2026-12-01',
        end: '2026-12-04',
        budget: 10,
        spending: 10,
        provenance: 'qa_fixture',
      }],
      occurrences: [{
        id: 'cart:1',
        tripId: '1',
        source: 'cart',
        category: 'activities',
        amount: 40,
        currency: 'USD',
        serviceDate: '2026-12-02',
        serviceEnd: null,
        status: 'saved',
        rooms: null,
        segments: null,
        linkedToId: null,
      }],
    }), query());
    expect(flagged.fixturesExcluded).toBe(1);
    expect(flagged.openTripFigures).toHaveLength(0);
    expect(flagged.categories.all.byCurrency).toEqual([]);
  });
});

describe('currency, coverage, and filters', () => {
  const occurrences = [
    {
      id: 'usd',
      tripId: 't',
      source: 'provider' as const,
      category: 'activities' as const,
      amount: 30,
      currency: 'USD',
      serviceDate: '2026-11-02',
      serviceEnd: null,
      status: 'confirmed',
      rooms: null,
      segments: null,
      linkedToId: null,
    },
    {
      id: 'eur',
      tripId: 't',
      source: 'provider' as const,
      category: 'dining' as const,
      amount: 20,
      currency: 'EUR',
      serviceDate: '2025-08-01',
      serviceEnd: null,
      status: 'confirmed',
      rooms: null,
      segments: null,
      linkedToId: null,
    },
    {
      id: 'nocurrency',
      tripId: 't',
      source: 'cart' as const,
      category: 'activities' as const,
      amount: 15,
      currency: null,
      serviceDate: '2026-11-03',
      serviceEnd: null,
      status: 'saved',
      rooms: null,
      segments: null,
      linkedToId: null,
    },
    {
      id: 'noprice',
      tripId: 't',
      source: 'cart' as const,
      category: 'activities' as const,
      amount: null,
      currency: 'USD',
      serviceDate: '2026-11-04',
      serviceEnd: null,
      status: 'saved',
      rooms: null,
      segments: null,
      linkedToId: null,
    },
    {
      id: 'nodate',
      tripId: 't',
      source: 'external' as const,
      category: 'unclassified' as const,
      amount: 8,
      currency: 'USD',
      serviceDate: null,
      serviceEnd: null,
      status: 'active',
      rooms: null,
      segments: null,
      linkedToId: null,
    },
    {
      id: 'cancelled',
      tripId: 't',
      source: 'provider' as const,
      category: 'activities' as const,
      amount: 99,
      currency: 'USD',
      serviceDate: '2026-11-05',
      serviceEnd: null,
      status: 'cancelled',
      rooms: null,
      segments: null,
      linkedToId: null,
    },
  ];

  it('keeps currencies apart and does not treat missing price or currency as zero', () => {
    const result = buildTravelMetrics(empty({ occurrences }), query());
    expect(result.categories.all.byCurrency).toEqual([
      { currency: 'EUR', amount: 20, count: 1 },
      { currency: 'USD', amount: 38, count: 2 },
    ]);
    expect(result.categories.all.missingPrice).toBe(1);
    expect(result.categories.all.missingCurrency).toBe(1);
    expect(result.categories.all.missingServiceDate).toBe(1);
    expect(result.categories.all.cancelledExcluded).toBe(1);
    expect(result.categories.unclassified.byCurrency).toEqual([{ currency: 'USD', amount: 8, count: 1 }]);
    expect(result.reconciliationOk).toBe(true);
    expect(result.categories.all).not.toHaveProperty('amount');
    expect(JSON.stringify(result)).not.toContain('"combined"');
  });

  it('filters by service year and leaves undated amounts out of that year', () => {
    const result = buildTravelMetrics(empty({ occurrences }), query({ time: { kind: 'year', year: 2026 } }));
    expect(result.categories.all.byCurrency).toEqual([{ currency: 'USD', amount: 30, count: 1 }]);
    expect(result.datedOccurrencesOmitted).toBe(1);
    expect(result.years).toEqual([2025, 2026]);
    expect(result.recordedChart).toEqual([
      { currency: 'USD', kind: 'recorded', points: [{ date: '2026-11-02', cumulative: 30 }] },
    ]);
  });

  it('does not read a timestamp prefix as the service-local date', () => {
    const result = buildTravelMetrics(empty({
      occurrences: [{
        ...occurrences[0],
        id: 'instant',
        serviceDate: '2026-11-02T03:00:00.000Z',
        amount: 12,
      }],
    }), query());
    expect(result.recordedChart).toEqual([]);
    expect(result.categories.all.missingServiceDate).toBe(1);
    expect(result.categories.all.byCurrency).toEqual([{ currency: 'USD', amount: 12, count: 1 }]);
  });
});

describe('activities, flights, and hotels', () => {
  it('averages only the priced cohort and separates scheduled from completed', () => {
    const result = buildTravelMetrics(empty({
      occurrences: [
        occ('a1', 'activities', 40, 'USD', '2026-11-20'),
        occ('a2', 'activities', 20, 'USD', '2026-11-21'),
        occ('a3', 'activities', 10, null, '2026-11-22'),
        occ('a4', 'activities', null, 'USD', '2026-11-23'),
        occ('a5', 'activities', 99, 'USD', '2026-11-01', { status: 'cancelled' }),
        occ('done', 'activities', 50, 'EUR', '2026-10-01'),
        occ('undated', 'activities', 5, 'USD', null),
      ],
    }), query());
    expect(result.activity.scheduled.eligible).toBe(4);
    expect(result.activity.scheduled.averages).toEqual([
      { currency: 'USD', average: 30, priced: 2, total: 4 },
    ]);
    expect(result.activity.scheduled.pricedWithoutCurrency).toBe(1);
    expect(result.activity.completed.eligible).toBe(1);
    expect(result.activity.completed.averages).toEqual([
      { currency: 'EUR', average: 50, priced: 1, total: 1 },
    ]);
    expect(result.activity.undated).toBe(1);
    expect(result.categories.activities.cancelledExcluded).toBe(1);
  });

  it('counts flight bookings without inventing segment fares', () => {
    const result = buildTravelMetrics(empty({
      occurrences: [
        occ('f1', 'flights', 400, 'USD', '2026-11-01', { segments: null }),
        occ('f2', 'flights', 180, 'USD', '2026-12-01', { segments: 2 }),
      ],
    }), query());
    expect(result.flights.bookings).toBe(2);
    expect(result.flights.segmentsKnown).toBe(2);
    expect(result.flights.bookingsMissingSegments).toBe(1);
    expect(result.flights.fares).toEqual([{ currency: 'USD', amount: 580, count: 2 }]);
    expect(result.flights.fares[0].amount).not.toBe(290);
  });

  it('computes hotel room-nights as rooms times occupied nights, checkout exclusive', () => {
    expect(occupiedNights('2026-11-01', '2026-11-04')).toBe(3);
    expect(occupiedNights('2026-11-01', '2026-11-01')).toBeNull();
    expect(roomNights(2, 3)).toBe(6);
    expect(roomNights(null, 3)).toBeNull();
    const result = buildTravelMetrics(empty({
      occurrences: [
        occ('h1', 'properties', 600, 'EUR', '2026-11-01', { serviceEnd: '2026-11-04', rooms: 2 }),
        occ('h2', 'properties', 200, 'EUR', '2026-11-08', { serviceEnd: '2026-11-10', rooms: null }),
      ],
    }), query());
    expect(result.hotels.stays).toBe(2);
    expect(result.hotels.roomNights).toBe(6);
    expect(result.hotels.staysMissingRooms).toBe(1);
    expect(result.hotels.averageStayPrice).toEqual([
      { currency: 'EUR', average: 400, priced: 2, total: 2 },
    ]);
  });

  it('counts weekdays from service dates and skips missing dates', () => {
    const result = buildTravelMetrics(empty({
      occurrences: [
        occ('mon', 'dining', 10, 'USD', '2026-11-02'),
        occ('mon2', 'dining', 12, 'USD', '2026-11-09'),
        occ('none', 'dining', 12, 'USD', null),
      ],
    }), query());
    expect(result.weekdayCounts).toEqual([{ weekday: 'Monday', count: 2 }]);
  });
});

describe('groups, duplicates, refunds, and cashflow dates', () => {
  it('does not split a booking equally or add a reimbursement on top', () => {
    const booking = occ('cart:stay', 'properties', 100, 'USD', '2026-11-02', { serviceEnd: '2026-11-05', rooms: 1 });
    const result = buildTravelMetrics(empty({
      occurrences: [booking],
      shares: [
        { id: 'eq', occurrenceId: 'cart:stay', attendeeUserId: 'viewer', method: 'equal', amount: 50, autoAdded: true, paymentStatus: 'pending' },
        { id: 'mine', occurrenceId: 'cart:stay', attendeeUserId: 'viewer', method: 'amount', amount: 40, autoAdded: false, paymentStatus: 'pending' },
        { id: 'theirs', occurrenceId: 'cart:stay', attendeeUserId: 'other', method: 'amount', amount: 60, autoAdded: false, paymentStatus: 'pending' },
        { id: 'back', occurrenceId: 'cart:stay', attendeeUserId: 'viewer', method: 'amount', amount: 10, autoAdded: false, paymentStatus: 'refunded' },
      ],
      reimbursementCount: 1,
    }), query());
    expect(result.groupTotals).toEqual([{ currency: 'USD', amount: 100, count: 1 }]);
    expect(result.personalShare).toEqual([{ currency: 'USD', amount: 40, count: 1 }]);
    expect(result.unusedEqualSplits).toBe(1);
    expect(result.refundedSharesExcluded).toBe(1);
    expect(result.reimbursementsExcluded).toBe(1);
  });

  it('keeps one copy of a shared booking and ignores a currency-less duplicate', () => {
    const result = buildTravelMetrics(empty({
      occurrences: [
        occ('cart:1', 'flights', 500, null, '2026-11-01'),
        occ('external:1', 'flights', 480, 'EUR', null, { linkedToId: 'cart:1' }),
      ],
    }), query());
    expect(result.flights.bookings).toBe(1);
    expect(result.groupTotals).toEqual([{ currency: 'EUR', amount: 480, count: 1 }]);
  });

  it('nets refunds on the settlement date and never promotes a reported payment', () => {
    const result = buildTravelMetrics(empty({
      settlements: [
        { id: 'pay', occurrenceId: null, category: 'flights', amount: 200, currency: 'USD', settledOn: '2026-05-02', status: 'completed' },
        { id: 'part', occurrenceId: null, category: 'flights', amount: 50, currency: 'USD', settledOn: '2026-06-01', status: 'completed' },
        { id: 'refund', occurrenceId: null, category: 'flights', amount: 40, currency: 'USD', settledOn: '2026-06-15', status: 'refunded' },
        { id: 'failed', occurrenceId: null, category: 'flights', amount: 999, currency: 'USD', settledOn: '2026-06-20', status: 'failed' },
      ],
      reportedPayments: [
        { id: 'rep', occurrenceId: null, category: 'flights', amount: 80, currency: 'USD', status: 'reported_paid', evidence: 'unverified' },
        { id: 'partial-missing', occurrenceId: null, category: 'flights', amount: null, currency: 'USD', status: 'partially_paid', evidence: 'unverified' },
      ],
      occurrences: [occ('svc', 'flights', 300, 'USD', '2025-01-01')],
    }), query({ time: { kind: 'year', year: 2026 } }));
    expect(result.cashflow).toEqual([
      expect.objectContaining({ currency: 'USD', gross: 250, refunds: 40, net: 210, grossCount: 2, refundCount: 1 }),
    ]);
    expect(result.settledChart[0].points.at(-1)?.cumulative).toBe(210);
    expect(result.settledChart[0].points[0].date).toBe('2026-05-02');
    expect(result.categories.all.byCurrency).toEqual([]);
    expect(result.reportedByCurrency).toEqual([{ currency: 'USD', amount: 80, count: 1 }]);
    expect(result.reportedMissingAmount).toBe(1);
    expect(result.recordedChart).toEqual([]);
  });

  it('does not publish a net when a refund amount is missing', () => {
    const result = buildTravelMetrics(empty({
      settlements: [
        { id: 'pay', occurrenceId: null, category: 'activities', amount: 70, currency: 'GBP', settledOn: '2026-04-01', status: 'completed' },
        { id: 'refund', occurrenceId: null, category: 'activities', amount: null, currency: 'GBP', settledOn: '2026-04-02', status: 'refunded' },
      ],
    }), query());
    expect(result.cashflow[0]).toMatchObject({ gross: 70, refunds: 0, net: null, missingRefundAmount: 1 });
  });
});

describe('source mapping', () => {
  it('does not invent rooms, segments, currency, or a service date from a timestamp', () => {
    const cart = occurrenceFromCart({
      id: 'c1',
      type: 'activity',
      price: 0,
      booking_status: 'cancelled',
      item_service_dates: { date: '2026-11-02T03:00:00.000Z' },
    }, 'trip');
    expect(cart.amount).toBeNull();
    expect(cart.currency).toBeNull();
    expect(cart.rooms).toBeNull();
    expect(cart.segments).toBeNull();
    expect(cart.serviceDate).toBeNull();
    expect(cart.cancelled).toBe(true);

    const dated = occurrenceFromCart({
      id: 'c2',
      type: 'hotel',
      price: 240,
      item_currency: 'eur',
      item_service_dates: { check_in: '2026-11-01', check_out: '2026-11-04' },
    }, 'trip');
    expect(dated.category).toBe('properties');
    expect(dated.currency).toBe('EUR');
    expect(dated.serviceDate).toBe('2026-11-01');
    expect(dated.serviceEnd).toBe('2026-11-04');
    expect(dated.rooms).toBeNull();

    const external = occurrenceFromExternal({
      id: 'e1',
      itinerary_id: 9,
      category: 'flight',
      currency: 'USD',
      total_amount: 100,
      start_at: '2026-11-01T15:00:00.000Z',
      associated_itinerary_item_id: 'c2',
      record_status: 'active',
    });
    expect(external.serviceDate).toBeNull();
    expect(external.linkedToId).toBe('cart:c2');
    expect(reportedFromExternal({
      id: 'e1',
      itinerary_id: 9,
      category: 'flight',
      currency: 'USD',
      amount_paid: 40,
      payment_status: 'partially_paid',
      evidence_quality: 'unverified',
    }).evidence).toBe('unverified');
  });

  it('places a settlement on the viewer calendar, not the service date', () => {
    const settlement = settlementFromPayment(
      { id: 'p1', booking_id: 'b1', payment_amount: 80, payment_date: '2026-11-07T03:00:00.000Z', payment_status: 'completed' },
      { id: 'b1', booking_type: 'flight', currency: 'USD', total_amount: 80, service_start_date: '2026-12-01' },
      'America/Los_Angeles',
    );
    expect(settlement.settledOn).toBe('2026-11-06');
    expect(settlement.category).toBe('flights');
    expect(categoryForSource('car_rental')).toBe('transport');
    expect(categoryForSource('cruise')).toBe('unclassified');
  });
});

describe('map coordinates and checkout gate', () => {
  it('accepts only finite globe coordinates', () => {
    expect(isVerifiedCoordinate(40.4, -3.7)).toBe(true);
    expect(isVerifiedCoordinate(Number.NaN, 10)).toBe(false);
    expect(isVerifiedCoordinate('40' as unknown as number, 10)).toBe(false);
    expect(isVerifiedCoordinate(91, 0)).toBe(false);
  });

  it('does not route quick actions into travel checkout', () => {
    expect(DASHBOARD_QUICK_ACTIONS.every((action) => !quickActionOpensCheckout(action.to))).toBe(true);
  });
});

function occ(
  id: string,
  category: 'flights' | 'properties' | 'activities' | 'dining' | 'transport' | 'unclassified',
  amount: number | null,
  currency: string | null,
  serviceDate: string | null,
  extra: Record<string, unknown> = {},
) {
  return {
    id,
    tripId: 't',
    source: 'provider' as const,
    category,
    amount,
    currency,
    serviceDate,
    serviceEnd: null,
    status: 'confirmed',
    rooms: null,
    segments: null,
    linkedToId: null,
    ...extra,
  };
}
