import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CountriesMap } from '@/components/CountriesMap';
import { localDateOnlyFromDate } from '@/lib/date-time';
import { buildTravelMetrics, formatRecordedMoney, PROVENANCE_GAP, type CategoryFilter, type TimeFilter } from '@/lib/dashboard/travel-metrics';
import type { TravelAnalyticsState } from '@/hooks/useTravelAnalytics';
import { AnalyticsByMiles } from './AnalyticsByMiles';
import { RecordedCostChart } from './RecordedCostChart';

interface TravelMetricsProps {
  userStats: {
    totalTrips: number;
    countriesVisited: number;
    citiesVisited: number;
    profileFlightFrequency: number;
    travelerLevel: string;
  };
  visitedCountries: string[];
  phaseCounts: {
    active: number;
    upcoming: number;
    planning: number;
    completed: number;
  };
  analytics: TravelAnalyticsState;
  startOpen?: boolean;
}

export const TravelMetrics = ({ userStats, visitedCountries, phaseCounts, analytics, startOpen = false }: TravelMetricsProps) => {
  const [open, setOpen] = useState(startOpen);
  const [time, setTime] = useState<TimeFilter>({ kind: 'all' });
  const [category, setCategory] = useState<CategoryFilter>('all');
  const today = localDateOnlyFromDate();
  const metrics = useMemo(
    () => buildTravelMetrics(analytics.input, {
      today,
      time,
      category,
      viewerId: analytics.viewerId,
    }),
    [analytics.input, analytics.viewerId, today, time, category],
  );
  const safeTime = time.kind === 'year' && !metrics.years.includes(time.year) ? { kind: 'all' as const } : time;
  const display = safeTime === time ? metrics : buildTravelMetrics(analytics.input, {
    today,
    time: safeTime,
    category,
    viewerId: analytics.viewerId,
  });
  const chart = display.settledChart.length > 0 ? display.settledChart : display.recordedChart;
  const chartCaption = display.settledChart.length > 0
    ? 'Verified paid, by settlement date. Recorded costs are not added to this line.'
    : 'Recorded costs by service date. This is not money paid.';

  return (
    <Card className="bright-card p-4 sm:p-6 overflow-hidden">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <p className="font-mono-label mb-1">Overview</p>
          <h2 className="font-display text-xl font-semibold text-foreground sm:text-2xl">Travel Metrics</h2>
        </div>
        <Button
          size="sm"
          className="bright-btn-grad h-9 rounded-full px-4 font-medium"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
        >
          View metrics
        </Button>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 sm:gap-5 md:grid-cols-2">
        <Card className="bright-card">
          <CardContent className="flex min-h-[250px] flex-col p-4">
            <p className="font-mono-label mb-1">Costs over time</p>
            <p className="text-xs text-muted-foreground">Cumulative, one currency at a time. Not a commission chart.</p>
            {analytics.loading ? (
              <p className="mt-6 text-sm text-muted-foreground">Loading cost records…</p>
            ) : chart.length > 0 ? (
              <RecordedCostChart series={chart} caption={chartCaption} />
            ) : (
              <div className="mt-4 rounded-lg border border-border bg-muted p-4">
                <p className="text-sm font-medium text-foreground">A cumulative total is unavailable</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Verified paid spend needs a settled payment with a currency and a settlement date. Recorded costs need a currency and a service date. Stored trip totals have no currency, so they are not drawn as one line and they are not called paid.
                </p>
                <p className="mt-2 text-xs text-muted-foreground">{display.categories.all.missingCurrency} priced rows have no currency. {display.categories.all.missingPrice} eligible rows have no price.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bright-card">
          <CardContent className="p-3">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="font-mono-label mb-1">Profile countries</p>
                <p className="font-display text-4xl font-semibold text-foreground">{visitedCountries.length}</p>
              </div>
            </div>
            <p className="mb-2 text-xs text-muted-foreground">Saved on your profile. Not verified from bookings.</p>
            <div className="h-[220px]">
              <CountriesMap visitedCountries={visitedCountries} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:gap-5 md:grid-cols-2">
        <Card className="bright-card">
          <CardContent className="p-4">
            <p className="font-mono-label mb-1">Recorded costs on open trips</p>
            <p className="mb-3 text-xs text-muted-foreground">
              Stored on the trip as planned or recorded amounts. No currency is stored on the trip, so these figures are not added together and are not verified paid spend.
            </p>
            <div className="space-y-2">
              {display.openTripFigures.length > 0 ? display.openTripFigures.map((trip) => (
                <div key={trip.id} className="rounded-xl bg-muted/60 px-3 py-2">
                  <p className="truncate text-sm text-foreground">{trip.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {trip.phase === 'active' ? 'In progress' : trip.phase === 'upcoming' ? 'Upcoming' : 'No dates'}
                    {trip.budget != null ? ` · Planned ${trip.budget.toLocaleString()}` : ''}
                    {trip.spending != null ? ` · Recorded ${trip.spending.toLocaleString()}` : ''}
                    {' · currency not recorded'}
                  </p>
                </div>
              )) : (
                <p className="py-6 text-center text-sm text-muted-foreground">No stored cost on an open trip.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bright-card">
          <CardContent className="p-4">
            <dl className="space-y-3">
              <Stat label="Trips" value={String(userStats.totalTrips)} />
              <Stat label="In progress" value={String(phaseCounts.active)} />
              <Stat label="Upcoming" value={String(phaseCounts.upcoming)} />
              <Stat label="Past" value={String(phaseCounts.completed)} />
              <Stat label="Undated" value={String(phaseCounts.planning)} />
              <Stat label="Location names" value={String(userStats.citiesVisited)} hint="Names saved on your trips" />
              <Stat label="Traveler level" value={userStats.travelerLevel} hint="From your profile. Not a verified flight count." />
            </dl>
            {display.groupTotals.length > 0 && (
              <p className="mt-3 text-xs text-muted-foreground">
                Currency-qualified booking totals: {display.groupTotals.map((row) => formatRecordedMoney(row.amount, row.currency)).join(', ')}
              </p>
            )}
            <p className="mt-3 text-xs text-muted-foreground">{PROVENANCE_GAP}</p>
          </CardContent>
        </Card>
      </div>

      <AnalyticsByMiles
        open={open}
        onOpenChange={setOpen}
        metrics={display}
        time={safeTime}
        category={category}
        onTime={setTime}
        onCategory={setCategory}
        loading={analytics.loading}
        errors={analytics.errors}
        truncated={analytics.truncated}
      />
    </Card>
  );
};

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border pb-3 last:border-b-0 last:pb-0">
      <div>
        <dt className="text-sm text-muted-foreground">{label}</dt>
        {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      </div>
      <dd className="font-display text-xl font-semibold text-foreground">{value}</dd>
    </div>
  );
}
