import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { occurrenceFromExternal } from './analytics-sources';
import { greatCircleMiles, AIRPORTS } from './airports';
import { DEMO_TRIPS, demoMetricsInput, demoTripTotal } from './demo-itineraries';
import { renderDemoSeedSql } from './demo-seed-sql';
import { buildTravelMetrics, type MetricsInput } from './travel-metrics';
import { buildTravelStory, carrierFromTitle, parsePlace, spellCount } from './travel-story';

const TODAY = '2026-11-18';

const story = (time: { kind: 'all' } | { kind: 'year'; year: number } = { kind: 'all' }) => buildTravelStory(demoMetricsInput(), {
  today: TODAY,
  time,
  profileCountries: null,
  profileName: 'Marco Brugo',
});

describe('demo itineraries', () => {
  it('keeps the five upcoming trips at the founder totals', () => {
    const upcoming = DEMO_TRIPS.slice(0, 5);
    expect(upcoming.map((trip) => trip.name)).toEqual([
      'Powder & Park Ave',
      'The Capital Table',
      'Southbound',
      'Casa de Campo',
      'Atlantic Edge',
    ]);
    expect(upcoming.map(demoTripTotal)).toEqual([13116, 6978, 19810, 17415, 25300]);
    expect(upcoming.reduce((sum, trip) => sum + demoTripTotal(trip), 0)).toBe(82619);
    const byCat = { flight: 0, stay: 0, activity: 0, dining: 0, transport: 0 };
    for (const trip of upcoming) {
      for (const item of trip.items) byCat[item.cat] += item.amount;
    }
    expect(byCat).toEqual({ flight: 12496, transport: 4493, stay: 38925, activity: 13605, dining: 13100 });
    expect(upcoming.every((trip) => trip.items.every((item) => item.currency === 'USD' && item.amount > 0))).toBe(true);
  });

  it('gives 2025 and 2026 a real prior year without touching another account', () => {
    const sql = renderDemoSeedSql();
    expect(sql).toContain('no auth user for info@taai.travel, so no itineraries were inserted.');
    expect(sql).toContain('where userid = demo_id');
    expect(sql).not.toMatch(/delete from public\.itinerary\s+where(?![\s\S]*userid = demo_id)/);
    expect(sql).toContain('20261103235000_security_definer_and_rls_hardening.sql');
    expect(sql).toContain('Does not depend on');
    for (const trip of DEMO_TRIPS) expect(sql).toContain(`demo:${trip.code}`);
    expect(readFileSync(resolve('supabase/migrations/20261118120000_demo_account_itineraries.sql'), 'utf8')).toBe(sql);
  });
});

describe('travel story from the demo account', () => {
  const ahead = story();

  it('describes the year ahead from trip dates, not a hardcoded headline', () => {
    expect(ahead.headline).toEqual(['Five trips,', 'four countries,', 'fifty-seven nights.']);
    expect(ahead.hero.itineraries).toBe(5);
    expect(ahead.hero.nights).toBe(57);
    expect(ahead.hero.travelerNights).toBe(168);
    expect(ahead.hero.spend).toEqual({ currency: 'USD', amount: 82619 });
    expect(ahead.hero.costPerNight).toBe(1449);
    expect(ahead.scopeLabel).toBe('5 upcoming · 8 past');
    expect(ahead.flights.count).toBe(8);
    expect(ahead.biggest?.amount.amount).toBe(25300);
    expect(ahead.biggest?.detail).toContain('Atlantic Edge');
    expect(ahead.longest?.nights).toBe(15);
    expect(ahead.longest?.detail).toContain('Southbound');
    expect(ahead.averageTrip).toMatchObject({ average: 16524, median: 17415, currency: 'USD' });
    expect(ahead.averagePerTraveler?.amount.amount).toBe(5164);
    expect(ahead.bands.map((band) => band.trips)).toEqual([2, 2, 1]);
    expect(ahead.bands.map((band) => band.amount)).toEqual([45110, 30531, 6978]);
    expect(ahead.topLines[0]).toMatchObject({ title: 'Villa, Casa de Campo', amount: 7200 });
    expect(ahead.legendPrior).toBeTruthy();
    expect(ahead.averagePerTraveler?.delta).not.toBeNull();
    expect(ahead.footnote).toContain('left out rather than counted as zero');
    expect(ahead.footnote).not.toMatch(/booked through taai/i);
    expect(ahead.shareText).toContain('taai does not book travel');
  });

  it('filters a year by the trip start and keeps a prior year only when it exists', () => {
    const year = story({ kind: 'year', year: 2027 });
    expect(year.scopeLabel).toBe('4 trips · Jan – Sep 2027');
    expect(year.hero.spend?.amount).toBe(82619 - 13116);
    expect(year.trips.map((trip) => trip.name)).toEqual([
      'The Capital Table',
      'Southbound',
      'Casa de Campo',
      'Atlantic Edge',
    ]);
    expect(year.legendPrior).toBeTruthy();

    const lonely = buildTravelStory({
      trips: [{ id: 'only', name: 'Only', start: '2027-01-02', end: '2027-01-05', budget: 100, spending: null, travelers: 1, locations: ['Lisbon, Portugal'] }],
      occurrences: [{
        id: 'line', tripId: 'only', source: 'external', category: 'dining', amount: 80, currency: 'USD',
        serviceDate: '2027-01-02', serviceEnd: null, status: 'active', rooms: null, segments: null, linkedToId: null,
      }],
      shares: [], settlements: [], reportedPayments: [], reimbursementCount: 0,
    }, { today: TODAY, time: { kind: 'year', year: 2027 }, profileCountries: null, profileName: null });
    expect(lonely.legendPrior).toBeNull();
    expect(lonely.spendingTotal?.delta).toBeNull();
    expect(lonely.averagePerTraveler?.delta).toBeNull();
  });

  it('does not add a second currency or a missing price into the total', () => {
    const input: MetricsInput = {
      ...demoMetricsInput(),
      occurrences: [
        ...demoMetricsInput().occurrences,
        {
          id: 'eur', tripId: 'LIS-2709', source: 'external', category: 'dining', amount: 50, currency: 'EUR',
          serviceDate: '2027-09-11', serviceEnd: null, status: 'active', rooms: null, segments: null, linkedToId: null, title: 'A dinner',
        },
        {
          id: 'blank', tripId: 'LIS-2709', source: 'external', category: 'activities', amount: null, currency: 'USD',
          serviceDate: '2027-09-12', serviceEnd: null, status: 'active', rooms: null, segments: null, linkedToId: null, title: 'Unpriced walk',
        },
      ],
    };
    const mixed = buildTravelStory(input, { today: TODAY, time: { kind: 'all' }, profileCountries: 34, profileName: null });
    expect(mixed.hero.spend).toEqual({ currency: 'USD', amount: 82619 });
    expect(mixed.hero.otherCurrencies).toEqual([{ currency: 'EUR', amount: 50 }]);
    expect(mixed.footnote).toContain('kept separate');
    expect(mixed.categories.reduce((sum, slice) => sum + slice.amount, 0)).toBe(82619);
  });

  it('keeps a demo row and still drops a fixture', () => {
    const kept = buildTravelMetrics(demoMetricsInput(), {
      today: TODAY, time: { kind: 'all' }, category: 'all', viewerId: 'demo',
    });
    expect(kept.fixturesExcluded).toBe(0);
    expect(kept.categories.all.byCurrency[0]).toMatchObject({ currency: 'USD' });

    const flagged = buildTravelMetrics({
      ...demoMetricsInput(),
      trips: demoMetricsInput().trips.map((trip) => trip.id === 'LIS-2709' ? { ...trip, provenance: 'qa_fixture' as const } : trip),
    }, { today: TODAY, time: { kind: 'all' }, category: 'all', viewerId: 'demo' });
    expect(flagged.fixturesExcluded).toBe(1);
    const allUsd = DEMO_TRIPS.reduce((sum, trip) => sum + demoTripTotal(trip), 0);
    expect(flagged.categories.all.byCurrency[0].amount).toBe(allUsd - 25300);
  });
});

describe('place, carrier, and distance helpers', () => {
  it('reads a country from the last segment and spells the headline counts', () => {
    expect(parsePlace('Killington, VT, United States')).toEqual({ label: 'Killington, VT', country: 'United States' });
    expect(parsePlace('La Romana, Dominican Republic').country).toBe('Dominican Republic');
    expect(parsePlace('Killington, VT').country).toBeNull();
    expect(parsePlace('Miami').country).toBeNull();
    expect(spellCount(57)).toBe('fifty-seven');
    expect(carrierFromTitle('Aerolíneas 1692 · FTE → BRC')).toBe('Aerolíneas');
    expect(carrierFromTitle('Hotel, Rome')).toBeNull();
  });

  it('measures a hop only when both airports are known', () => {
    const hop = greatCircleMiles(AIRPORTS.JFK, AIRPORTS.EZE);
    expect(hop).toBeGreaterThan(5000);
    expect(hop).toBeLessThan(5600);
    const ahead = story();
    expect(ahead.hero.miles).toBeGreaterThan(0);
    expect(ahead.passport.longest?.route).toBe('JFK → EZE');
    expect(ahead.passport.milesDetail).toContain('great-circle');
  });

  it('uses a service date column and ignores a timestamp', () => {
    const external = occurrenceFromExternal({
      id: 'e1',
      itinerary_id: 9,
      category: 'flight',
      currency: 'USD',
      total_amount: 100,
      start_at: '2026-11-01T15:00:00.000Z',
      service_date: '2026-12-26',
      service_end_date: '2026-12-26T00:00:00.000Z',
      booking_title: 'American 1142 · MIA → LGA',
      origin: 'mia',
      destination: 'LGA',
      notes: '3 seats',
    });
    expect(external.serviceDate).toBe('2026-12-26');
    expect(external.serviceEnd).toBeNull();
    expect(external.origin).toBe('MIA');
    expect(external.destination).toBe('LGA');
    expect(external.title).toBe('American 1142 · MIA → LGA');
  });
});
