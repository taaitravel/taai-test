import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { categoryLabel } from '@/lib/dashboard/analytics-sources';
import { PROVENANCE_GAP, formatRecordedMoney, type CategoryFilter, type MetricsResult, type TimeFilter } from '@/lib/dashboard/travel-metrics';
import { RecordedCostChart } from './RecordedCostChart';

const PILLS: Array<CategoryFilter> = ['all', 'flights', 'properties', 'activities', 'dining', 'transport', 'unclassified'];

interface AnalyticsByMilesProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  metrics: MetricsResult;
  time: TimeFilter;
  category: CategoryFilter;
  onTime: (time: TimeFilter) => void;
  onCategory: (category: CategoryFilter) => void;
  loading: boolean;
  errors: string[];
  truncated: boolean;
}

export const AnalyticsByMiles = ({
  open,
  onOpenChange,
  metrics,
  time,
  category,
  onTime,
  onCategory,
  loading,
  errors,
  truncated,
}: AnalyticsByMilesProps) => {
  const years = metrics.years;
  const rollup = metrics.categories[category];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="left-0 top-0 flex h-[100dvh] max-h-[100dvh] w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-4 overflow-y-auto rounded-none p-4 sm:left-1/2 sm:top-1/2 sm:h-auto sm:max-h-[85vh] sm:w-[min(100%,48rem)] sm:max-w-3xl sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-lg sm:p-6">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Analytics by Miles</DialogTitle>
          <DialogDescription>
            Recorded costs, planned costs, and verified paid spend are separate. A missing figure is left blank rather than shown as zero.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Time range">
          <FilterPill pressed={time.kind === 'all'} onClick={() => onTime({ kind: 'all' })}>All time</FilterPill>
          {years.map((year) => (
            <FilterPill key={year} pressed={time.kind === 'year' && time.year === year} onClick={() => onTime({ kind: 'year', year })}>
              {year}
            </FilterPill>
          ))}
        </div>

        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Category">
          {PILLS.map((pill) => (
            <FilterPill key={pill} pressed={category === pill} onClick={() => onCategory(pill)}>
              {categoryLabel(pill)}
            </FilterPill>
          ))}
        </div>

        {loading && <p className="text-sm text-muted-foreground">Loading the bookings you can see…</p>}
        {truncated && <p className="text-sm text-muted-foreground">This view is capped at the first 200 rows of a source, so the totals may be incomplete.</p>}
        {errors.length > 0 && (
          <p className="text-sm text-muted-foreground">Some sources did not load: {errors.join(' ')} Totals below use only the rows that loaded.</p>
        )}

        <section className="space-y-2">
          <h3 className="font-display text-base font-semibold text-foreground">{categoryLabel(category)} recorded costs</h3>
          <MoneyList rows={rollup.byCurrency} empty="No currency-qualified recorded costs in this view." />
          <p className="text-xs text-muted-foreground">
            {rollup.eligible} eligible · {rollup.missingPrice} missing a price · {rollup.missingCurrency} priced without a currency · {rollup.missingServiceDate} without a service date · {rollup.cancelledExcluded} cancelled excluded · {rollup.archivedExcluded} archived excluded
          </p>
          {category === 'all' && (
            <p className="text-xs text-muted-foreground">
              All {metrics.reconciliationOk ? 'matches' : 'does not match'} the sum of Flights, Properties, Activities, Dining, Transport, and Unclassified.
            </p>
          )}
        </section>

        <section className="space-y-2">
          <h3 className="font-display text-base font-semibold text-foreground">Verified paid spend</h3>
          {metrics.cashflow.length === 0 ? (
            <p className="text-sm text-muted-foreground">Unavailable. A settled payment needs a completed or refunded status, an amount, and a currency. Reported paid amounts are not counted here.</p>
          ) : (
            <ul className="space-y-1 text-sm text-foreground">
              {metrics.cashflow.map((row) => (
                <li key={row.currency}>
                  {row.currency}: paid {formatRecordedMoney(row.gross, row.currency)}, refunds {formatRecordedMoney(row.refunds, row.currency)}, net {row.net == null ? 'unavailable' : formatRecordedMoney(row.net, row.currency)}
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-muted-foreground">{metrics.cashflowNote}</p>
          <RecordedCostChart series={metrics.settledChart} caption="Verified paid, by settlement date" />
        </section>

        <section className="space-y-2">
          <h3 className="font-display text-base font-semibold text-foreground">Reported by you</h3>
          <MoneyList rows={metrics.reportedByCurrency} empty="No traveler-reported paid amount with a currency." />
          {metrics.reportedMissingAmount > 0 && (
            <p className="text-xs text-muted-foreground">{metrics.reportedMissingAmount} reported or partial payments have no usable amount. They are not shown as zero.</p>
          )}
        </section>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <section className="space-y-2">
            <h3 className="font-display text-base font-semibold text-foreground">Activities</h3>
            <Cohort title="Scheduled" eligible={metrics.activity.scheduled.eligible} averages={metrics.activity.scheduled.averages} unpriced={metrics.activity.scheduled.pricedWithoutCurrency} />
            <Cohort title="Completed" eligible={metrics.activity.completed.eligible} averages={metrics.activity.completed.averages} unpriced={metrics.activity.completed.pricedWithoutCurrency} />
            <p className="text-xs text-muted-foreground">{metrics.activity.undated} activities have no service date, so they are in neither average.</p>
          </section>
          <section className="space-y-2">
            <h3 className="font-display text-base font-semibold text-foreground">Flights and properties</h3>
            <p className="text-sm text-foreground">{metrics.flights.bookings} flight bookings</p>
            <p className="text-xs text-muted-foreground">
              {metrics.flights.segmentsKnown == null
                ? 'Segment counts are unavailable. Fares are not split into segments.'
                : `${metrics.flights.segmentsKnown} segments on bookings that record a count.${metrics.flights.bookingsMissingSegments ? ` ${metrics.flights.bookingsMissingSegments} bookings have no segment count.` : ''} Fares stay at booking level.`}
            </p>
            <MoneyList rows={metrics.flights.fares} empty="No flight fare with a currency." />
            <p className="text-sm text-foreground">{metrics.hotels.stays} property stays</p>
            <p className="text-xs text-muted-foreground">
              {metrics.hotels.roomNights == null
                ? 'Room-nights are unavailable. Rooms are not stored as a count on the rows this view can read, and a stay is not assumed to be one room.'
                : `${metrics.hotels.roomNights} room-nights (rooms × nights, checkout not counted).${metrics.hotels.staysMissingRooms ? ` ${metrics.hotels.staysMissingRooms} stays have no room count.` : ''}`}
            </p>
            <MoneyList rows={metrics.hotels.averageStayPrice.map((row) => ({ currency: row.currency, amount: row.average, count: row.priced }))} empty="Average stay price is unavailable." />
            <p className="text-xs text-muted-foreground">Nightly rate is unavailable. A stored stay price is not divided into nights.</p>
          </section>
        </div>

        <section className="space-y-2">
          <h3 className="font-display text-base font-semibold text-foreground">Your share and the booking total</h3>
          <p className="text-xs text-muted-foreground">{metrics.personalShareNote}</p>
          <p className="text-sm text-foreground">Booking totals</p>
          <MoneyList rows={metrics.groupTotals} empty="No booking total with a currency." />
          <p className="text-sm text-foreground">Your explicit share</p>
          <MoneyList rows={metrics.personalShare} empty="Your share is unavailable. There is no explicit percent or amount split for you in this view." />
          <p className="text-xs text-muted-foreground">
            {metrics.unusedEqualSplits} equal or automatic splits were not used. {metrics.refundedSharesExcluded} refunded shares were left out. {metrics.personalMissingCurrency} explicit shares have no currency. {metrics.reimbursementsExcluded} reimbursement rows were left out so they are not added twice.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="font-display text-base font-semibold text-foreground">By weekday</h3>
          {metrics.weekdayCounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Unavailable until a service date is stored. Saved dates are not filled in as zero.</p>
          ) : (
            <ul className="flex flex-wrap gap-2 text-sm text-foreground">
              {metrics.weekdayCounts.map((row) => (
                <li key={row.weekday} className="rounded-full bg-muted px-3 py-1">{row.weekday} {row.count}</li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-2 text-xs text-muted-foreground">
          <h3 className="font-display text-base font-semibold text-foreground">Not shown on purpose</h3>
          <ul className="list-disc space-y-1 pl-4">
            <li>Year-over-year change.</li>
            <li>A single total across currencies. No conversion rate is stored.</li>
            <li>Profile flight frequency as flights taken.</li>
            <li>{PROVENANCE_GAP}</li>
            <li>Provider booking currency defaults to USD when the column is empty, so a USD provider total may be that default. It is still labeled recorded cost, not paid spend.</li>
            <li>Traveler-reported bookings store a timestamp and no destination timezone, so they are omitted from the service-date chart.</li>
          </ul>
        </section>
      </DialogContent>
    </Dialog>
  );
};

function FilterPill({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: string | number }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={pressed}
      onClick={onClick}
      className={`h-9 rounded-full px-3 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${pressed ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}
    >
      {children}
    </button>
  );
}

function MoneyList({ rows, empty }: { rows: Array<{ currency: string; amount: number; count: number }>; empty: string }) {
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">{empty}</p>;
  return (
    <ul className="space-y-1 text-sm text-foreground">
      {rows.map((row) => (
        <li key={row.currency}>{formatRecordedMoney(row.amount, row.currency)} · {row.count} priced</li>
      ))}
    </ul>
  );
}

function Cohort({
  title,
  eligible,
  averages,
  unpriced,
}: {
  title: string;
  eligible: number;
  averages: MetricsResult['activity']['scheduled']['averages'];
  unpriced: number;
}) {
  return (
    <div>
      <p className="text-sm text-foreground">{title}: {eligible}</p>
      {eligible === 0 ? (
        <p className="text-xs text-muted-foreground">None in this view.</p>
      ) : averages.length === 0 ? (
        <p className="text-xs text-muted-foreground">Average unavailable. {unpriced} have a price with no currency, of {eligible}.</p>
      ) : averages.map((row) => (
        <p key={row.currency} className="text-xs text-muted-foreground">
          {formatRecordedMoney(row.average, row.currency)} average · {row.priced} priced of {row.total}
        </p>
      ))}
    </div>
  );
}
