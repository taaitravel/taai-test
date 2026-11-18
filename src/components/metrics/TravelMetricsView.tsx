import { useState, type ReactNode } from 'react';
import { ChevronLeft, Download, Plane, Route, Share2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { LOGO_WORDMARK_URL } from '@/lib/constants';
import {
  formatStoryMoney,
  type BandRow,
  type FlightRecord,
  type StoryDelta,
  type TimeFilter,
  type TravelStory,
  type TripCardModel,
} from '@/lib/dashboard/travel-story';
import { CompareList, CumulativeChart, Donut, MonthBars, WeekdayChart } from './MetricCharts';

type Tab = 'overview' | 'spending' | 'trips' | 'passport';

interface TravelMetricsViewProps {
  story: TravelStory;
  onTime: (time: TimeFilter) => void;
  backHref?: string;
  backLabel?: string;
  initialTab?: Tab;
  loading?: boolean;
  notice?: string | null;
}

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'spending', label: 'Spending' },
  { id: 'trips', label: 'Trips' },
  { id: 'passport', label: 'Passport' },
];

export function TravelMetricsView({
  story,
  onTime,
  backHref = '/home',
  backLabel = 'Home',
  initialTab = 'overview',
  loading = false,
  notice = null,
}: TravelMetricsViewProps) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const currency = story.currency ?? 'USD';

  const share = async () => {
    try {
      await navigator.clipboard.writeText(story.shareText);
      toast.success('Copied a summary of this view');
    } catch {
      toast.error('Could not copy the summary');
    }
  };

  return (
    <div className="chrome-inset min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-[var(--line-2)] bg-[color:var(--cream)]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1180px] items-center gap-3.5 px-5 py-3 sm:px-7">
          <Link to={backHref} className="inline-flex items-center gap-1.5 text-[13.5px] text-[var(--ink-2)]">
            <ChevronLeft className="h-4 w-4" />
            {backLabel}
          </Link>
          <span className="font-display text-[15px] font-semibold tracking-[-0.025em]">Travel metrics</span>
          <span className="flex-1" />
          <IconButton label="Download" onClick={() => window.print()}>
            <Download className="h-4 w-4" />
          </IconButton>
          <IconButton label="Share" onClick={() => void share()}>
            <Share2 className="h-4 w-4" />
          </IconButton>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-2.5 px-5 pt-4 sm:px-7">
        <div className="flex gap-[3px] rounded-full bg-[var(--cream-2)] p-[3px]" role="group" aria-label="Time range">
          <YearButton pressed={story.time.kind === 'all'} onClick={() => onTime({ kind: 'all' })}>All time</YearButton>
          {story.years.map((year) => (
            <YearButton
              key={year}
              pressed={story.time.kind === 'year' && story.time.year === year}
              onClick={() => onTime({ kind: 'year', year })}
            >
              {year}
            </YearButton>
          ))}
        </div>
        <span className="font-mono text-[9px] uppercase tracking-[0.13em] text-[var(--ink-3)] sm:ml-auto">{story.scopeLabel}</span>
      </div>

      <nav className="mx-auto flex max-w-[1180px] gap-6 overflow-x-auto border-b border-[var(--line-2)] px-5 pt-3.5 sm:px-7" role="tablist" aria-label="Travel metrics">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`metrics-tab-${item.id}`}
            aria-selected={tab === item.id}
            aria-controls={`metrics-panel-${item.id}`}
            className={`relative whitespace-nowrap pb-3 text-sm font-medium ${tab === item.id ? 'text-foreground' : 'text-[var(--ink-3)]'}`}
            onClick={() => setTab(item.id)}
          >
            {item.label}
            {tab === item.id && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-sm" style={{ background: 'var(--grad-deep)' }} />}
          </button>
        ))}
      </nav>

      <main className="mx-auto max-w-[1180px] px-5 py-5 sm:px-7">
        {loading && <p className="mb-4 text-sm text-[var(--ink-2)]">Loading your trips…</p>}
        {notice && <p className="mb-4 text-sm text-[var(--ink-2)]">{notice}</p>}

        {tab === 'overview' && (
          <section role="tabpanel" id="metrics-panel-overview" aria-labelledby="metrics-tab-overview">
            <Hero story={story} onShare={() => void share()} />
            <div className="mb-3.5 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
              <Tile hot kicker="Biggest trip" value={story.biggest ? formatStoryMoney(story.biggest.amount.amount, story.biggest.amount.currency) : '—'} detail={story.biggest?.detail ?? 'No priced trip in this view'} />
              <Tile
                kicker="Avg per traveler"
                value={story.averagePerTraveler ? formatStoryMoney(story.averagePerTraveler.amount.amount, story.averagePerTraveler.amount.currency) : '—'}
                detail={story.averagePerTraveler ? <Delta delta={story.averagePerTraveler.delta} /> : 'Needs a party size on every trip'}
              />
              <Tile kicker="Longest trip" value={story.longest ? String(story.longest.nights) : '—'} unit={story.longest ? 'nights' : undefined} detail={story.longest?.detail ?? 'Dates are missing'} />
              <Tile kicker="Flights planned" value={String(story.flights.count)} detail={story.flights.detail} />
            </div>
            <div className="mb-3.5 grid gap-3.5 lg:grid-cols-[1.15fr_0.85fr]">
              <Card title="Where the money goes" sub="Every planned line in this view.">
                {story.categories.length && story.hero.spend ? (
                  <Donut
                    slices={story.categories}
                    currency={story.hero.spend.currency}
                    center={formatStoryMoney(story.hero.spend.amount, story.hero.spend.currency)}
                    caption="Total planned"
                  />
                ) : <Empty>No single-currency total in this view.</Empty>}
              </Card>
              <Card title="What that adds up to" sub="The view, in units you can feel.">
                {story.feels.length ? <CompareList items={story.feels} /> : <Empty>Nothing planned to add up.</Empty>}
              </Card>
            </div>
            <Card title="Spend across the year" sub="Cumulative, by service date. The dashed line is the same months a year earlier, when that year has priced lines.">
              <CumulativeChart months={story.months} currency={currency} />
              {(story.legendCurrent || story.legendPrior) && (
                <div className="mt-3 flex flex-wrap gap-4 font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--ink-3)]">
                  {story.legendCurrent && <span><i className="mr-1.5 inline-block h-[3px] w-3.5 rounded-sm align-middle" style={{ background: 'linear-gradient(90deg,#F2536E,#E2913C)' }} />{story.legendCurrent}</span>}
                  {story.legendPrior && <span><i className="mr-1.5 inline-block h-[3px] w-3.5 rounded-sm bg-[rgba(23,19,16,0.26)] align-middle" />{story.legendPrior}</span>}
                </div>
              )}
            </Card>
          </section>
        )}

        {tab === 'spending' && (
          <section role="tabpanel" id="metrics-panel-spending" aria-labelledby="metrics-tab-spending">
            <div className="mb-3.5 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
              <Tile
                hot
                kicker="Total planned"
                value={story.spendingTotal ? formatStoryMoney(story.spendingTotal.amount.amount, story.spendingTotal.amount.currency) : '—'}
                detail={story.spendingTotal ? <Delta delta={story.spendingTotal.delta} withAmount /> : 'No priced lines in this view'}
              />
              <Tile
                kicker="Avg trip value"
                value={story.averageTrip ? formatStoryMoney(story.averageTrip.average, story.averageTrip.currency) : '—'}
                detail={story.averageTrip ? `Median ${formatStoryMoney(story.averageTrip.median, story.averageTrip.currency)}` : 'No priced trips'}
              />
              <Tile
                kicker="Per night"
                value={story.perNightDetail ? formatStoryMoney(story.perNightDetail.perNight, story.perNightDetail.currency) : '—'}
                detail={story.perNightDetail?.perTravelerNight != null ? `${formatStoryMoney(story.perNightDetail.perTravelerNight, story.perNightDetail.currency)} per traveler-night` : 'Needs dates and a total'}
              />
              <Tile
                kicker="Lifetime planned"
                value={story.lifetime.amounts.length === 1 ? formatStoryMoney(story.lifetime.amounts[0].amount, story.lifetime.amounts[0].currency) : story.lifetime.amounts.length ? 'Mixed' : '—'}
                detail={story.lifetime.amounts.length > 1
                  ? story.lifetime.amounts.map((row) => formatStoryMoney(row.amount, row.currency)).join(' · ')
                  : `${story.lifetime.past} past · ${story.lifetime.planned} planned`}
              />
            </div>
            <Card title="Month by month" sub="When the money lands, by service date rather than when the plan was written." className="mb-3.5">
              <MonthBars months={story.months} currency={currency} />
            </Card>
            <div className="mb-3.5 grid gap-3.5 lg:grid-cols-2">
              <Card title="Trip value distribution" sub="Thresholds come from the trips in this view.">
                {story.bands.length ? <Bands bands={story.bands} count={story.bandTripCount} currency={currency} /> : <Empty>No priced trips to group.</Empty>}
              </Card>
              <Card title="Five biggest lines" sub="Single planned lines, ranked.">
                {story.topLines.length ? story.topLines.map((line) => (
                  <div key={line.rank} className="flex items-center gap-3 border-b border-[var(--line-2)] py-2.5 last:border-b-0">
                    <span className="w-5 font-mono text-[10px] text-[var(--ink-3)]">{String(line.rank).padStart(2, '0')}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium">{line.title}</span>
                      <span className="block text-[11px] text-[var(--ink-3)]">{line.trip}</span>
                    </span>
                    <span className="font-mono text-xs">{formatStoryMoney(line.amount, currency)}</span>
                  </div>
                )) : <Empty>No priced lines.</Empty>}
              </Card>
            </div>
            <Card title="Category by trip" sub="The same categories, trip by trip.">
              {story.categoryByTrip.length ? story.categoryByTrip.map((trip) => (
                <div key={trip.id} className="flex flex-col gap-2 border-b border-[var(--line-2)] py-2.5 last:border-b-0 sm:flex-row sm:items-center sm:gap-3.5">
                  <span className="min-w-0 sm:w-[190px]">
                    <span className="block truncate text-[13px] font-medium">{trip.name}</span>
                    <span className="block text-[11px] text-[var(--ink-3)]">{trip.when}</span>
                  </span>
                  <span className="flex h-2 w-full overflow-hidden rounded bg-[var(--cream-2)] sm:w-auto sm:flex-1">
                    {trip.segments.map((segment) => <i key={segment.color} style={{ background: segment.color, flexGrow: segment.amount }} />)}
                  </span>
                  <span className="font-mono text-xs">{formatStoryMoney(trip.total, currency)}</span>
                </div>
              )) : <Empty>No priced trips.</Empty>}
            </Card>
          </section>
        )}

        {tab === 'trips' && (
          <section role="tabpanel" id="metrics-panel-trips" aria-labelledby="metrics-tab-trips">
            {story.trips.length ? story.trips.map((trip) => <TripCard key={trip.id} trip={trip} />) : <Empty>No trips in this view.</Empty>}
            {story.earlierTrips.length > 0 && (
              <>
                <h3 className="mb-2.5 mt-6 font-display text-[15px] font-semibold tracking-[-0.025em]">Earlier trips</h3>
                {story.earlierTrips.map((trip) => <TripCard key={trip.id} trip={trip} />)}
              </>
            )}
          </section>
        )}

        {tab === 'passport' && (
          <section role="tabpanel" id="metrics-panel-passport" aria-labelledby="metrics-tab-passport">
            <div className="mb-3.5 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
              <Tile hot kicker="Miles in the air" value={story.passport.miles != null ? story.passport.miles.toLocaleString('en-US') : '—'} detail={story.passport.milesDetail} />
              <Tile
                kicker="Countries"
                value={String(story.passport.countries)}
                detail={story.passport.profileCountries != null ? `${story.passport.profileCountries} on your profile` : 'From the places on these trips'}
              />
              <Tile kicker="Nights away" value={story.passport.nights != null ? String(story.passport.nights) : '—'} detail={story.passport.nightsDetail ?? 'Needs a start and end date'} />
              <Tile kicker="Longest hop" value={story.passport.longest ? story.passport.longest.miles.toLocaleString('en-US') : '—'} unit={story.passport.longest ? 'mi' : undefined} detail={story.passport.longest?.route ?? 'Needs airports on the flight'} />
            </div>
            <Card title="How far that is" sub={story.passport.miles != null ? `${story.passport.miles.toLocaleString('en-US')} great-circle miles, measured against a few fixed distances.` : 'Distance is shown when every flight has two known airports.'} className="mb-3.5">
              {story.passport.far.length ? <CompareList items={story.passport.far} /> : <Empty>No distance to compare.</Empty>}
            </Card>
            <div className="grid gap-3.5 lg:grid-cols-[1.15fr_0.85fr]">
              <Card title="Flight records" sub="The extremes of this view. Distance is great-circle, not a flown route.">
                {story.passport.records.length ? story.passport.records.map((record) => <Record key={record.title} record={record} />) : <Empty>No flight records in this view.</Empty>}
              </Card>
              <Card title="Departure days" sub="Which day of the week the flights in this view leave on.">
                <WeekdayChart days={story.passport.weekdays} />
              </Card>
            </div>
          </section>
        )}
      </main>

      <footer className="mx-auto flex max-w-[1180px] items-start gap-2 px-5 pb-16 text-[11.5px] text-[var(--ink-3)] sm:px-7">
        <img src={LOGO_WORDMARK_URL} alt="taai" className="mt-0.5 h-3.5 opacity-70" />
        <p>{story.footnote}</p>
      </footer>
    </div>
  );
}

function Hero({ story, onShare }: { story: TravelStory; onShare: () => void }) {
  const nightsLine = story.headline[story.headline.length - 1];
  const lead = story.headline.slice(0, -1);
  return (
    <div className="relative mb-3.5 overflow-hidden rounded-[22px] bg-[#171822] px-5 py-6 text-white shadow-[0_50px_100px_-50px_rgba(23,24,34,0.55)] sm:px-7">
      <span className="pointer-events-none absolute -right-16 -top-32 h-[300px] w-[300px] rounded-full opacity-50 blur-[54px]" style={{ background: 'var(--grad)' }} />
      <span className="pointer-events-none absolute -bottom-28 -left-14 h-[200px] w-[200px] rounded-full opacity-30 blur-[54px]" style={{ background: 'var(--grad)' }} />
      <div className="relative">
        <div className="mb-6 flex items-start gap-3.5">
          <div>
            <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/55">{story.eyebrow}</div>
            <h2 className="mt-2 font-display text-[clamp(26px,3.4vw,38px)] font-light leading-[1.02] tracking-[-0.04em]">
              {lead.map((line) => <span key={line} className="block">{line}</span>)}
              <b className="block bg-clip-text font-semibold text-transparent" style={{ backgroundImage: 'var(--grad)' }}>{nightsLine}</b>
            </h2>
          </div>
          <button type="button" aria-label="Share your year" onClick={onShare} className="touch-target ml-auto grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/15 bg-white/10">
            <Share2 className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <HeroStat kicker="Planned spend" value={story.hero.spend ? formatStoryMoney(story.hero.spend.amount, story.hero.spend.currency) : '—'} detail={story.hero.otherCurrencies.length ? `${story.hero.otherCurrencies.map((row) => formatStoryMoney(row.amount, row.currency)).join(', ')} kept separate` : `Across ${story.hero.itineraries} ${story.hero.itineraries === 1 ? 'itinerary' : 'itineraries'}`} />
          <HeroStat kicker="Nights away" value={story.hero.nights != null ? story.hero.nights.toLocaleString('en-US') : '—'} detail={story.hero.travelerNights != null ? `${story.hero.travelerNights.toLocaleString('en-US')} traveler-nights` : 'Some trips have no dates'} />
          <HeroStat kicker="Miles in the air" value={story.hero.miles != null ? story.hero.miles.toLocaleString('en-US') : '—'} detail={story.hero.milesCaption ?? 'No flights with both airports'} />
          <HeroStat kicker="Cost per night" value={story.hero.costPerNight != null && story.hero.spend ? formatStoryMoney(story.hero.costPerNight, story.hero.spend.currency) : '—'} detail="All-in, per trip night" />
        </div>
        <p className="mt-6 truncate border-t border-white/10 pt-3.5 font-mono text-[9.5px] tracking-[0.07em] text-white/30">{story.mrz}</p>
      </div>
    </div>
  );
}

function HeroStat({ kicker, value, detail }: { kicker: string; value: string; detail: string }) {
  return (
    <div>
      <div className="mb-1 font-mono text-[9px] uppercase tracking-[0.16em] text-white/50">{kicker}</div>
      <div className="font-display text-[clamp(20px,2.6vw,30px)] font-semibold leading-none tracking-[-0.035em]">{value}</div>
      <div className="mt-1.5 text-[11.5px] text-white/50">{detail}</div>
    </div>
  );
}

function Tile({ hot, kicker, value, unit, detail }: { hot?: boolean; kicker: string; value: string; unit?: string; detail: ReactNode }) {
  return (
    <div className={`rounded-2xl border p-4 shadow-s ${hot ? 'border-[rgba(242,83,110,0.2)] bg-[linear-gradient(105deg,rgba(255,132,156,0.14),rgba(255,206,135,0.14))]' : 'border-[var(--line-2)] bg-card'}`}>
      <div className="font-mono-label">{kicker}</div>
      <div className={`mt-1.5 font-display text-[25px] font-semibold leading-none tracking-[-0.035em] ${hot ? 'bright-grad-text' : ''}`}>
        {value}{unit && <em className="ml-1 text-[0.5em] font-normal not-italic text-[var(--ink-3)]">{unit}</em>}
      </div>
      <div className="mt-1.5 text-[11.5px] text-[var(--ink-2)]">{detail}</div>
    </div>
  );
}

function Delta({ delta, withAmount = false }: { delta: StoryDelta | null; withAmount?: boolean }) {
  if (!delta) return <span>No earlier year to compare</span>;
  const up = delta.percent >= 0;
  return (
    <span className={`inline-flex items-center gap-1 font-mono text-[9.5px] tracking-[0.06em] ${up ? 'text-[#1F8A5B]' : 'text-[#C4573C]'}`}>
      {up ? '↑' : '↓'} {Math.abs(delta.percent)}%
      {withAmount && <span className="text-[var(--ink-2)]"> vs {formatStoryMoney(delta.priorAmount, delta.currency)} last year</span>}
      {!withAmount && <span> vs last year</span>}
    </span>
  );
}

function Card({ title, sub, children, className = '' }: { title: string; sub: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-[18px] border border-[var(--line-2)] bg-card p-5 shadow-s ${className}`}>
      <h3 className="font-display text-[15px] font-semibold tracking-[-0.025em]">{title}</h3>
      <p className="mb-4 mt-1 text-[12.5px] text-[var(--ink-2)]">{sub}</p>
      {children}
    </section>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="py-6 text-center text-sm text-[var(--ink-2)]">{children}</p>;
}

function YearButton({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`touch-target rounded-full px-3.5 py-1.5 text-[12.5px] font-medium ${pressed ? 'text-white shadow-[0_8px_18px_-10px_rgba(242,83,110,0.9)]' : 'text-[var(--ink-3)]'}`}
      style={pressed ? { background: 'var(--grad-deep)' } : undefined}
    >
      {children}
    </button>
  );
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-label={label} onClick={onClick} className="touch-target grid h-9 w-9 place-items-center rounded-full border border-[var(--line)] bg-card text-[var(--ink-2)] shadow-s">
      {children}
    </button>
  );
}

function TripCard({ trip }: { trip: TripCardModel }) {
  return (
    <article className="mb-2.5 grid grid-cols-[auto_1fr] gap-3 rounded-[15px] border border-[var(--line-2)] bg-card p-4 shadow-s sm:grid-cols-[auto_1fr_auto] sm:gap-4">
      <div className="min-w-[52px] text-center">
        <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-[var(--ink-3)]">{trip.month}</div>
        <div className="font-display text-[21px] font-semibold leading-tight tracking-[-0.03em]">{trip.day}</div>
        <div className="font-mono text-[9px] text-[var(--ink-3)]">{trip.year}</div>
      </div>
      <div className="min-w-0">
        <div className="font-display text-[15px] font-semibold tracking-[-0.025em]">{trip.name}</div>
        <div className="mb-2 mt-0.5 truncate text-xs text-[var(--ink-2)]">{trip.route}</div>
        <div className="flex h-1.5 overflow-hidden rounded bg-[var(--cream-2)]">
          {trip.segments.map((segment) => <i key={segment.color} className="h-full" style={{ background: segment.color, flexGrow: segment.amount }} />)}
        </div>
      </div>
      <div className="col-start-2 text-left sm:col-start-auto sm:text-right">
        <div className="font-display text-[17px] font-semibold tracking-[-0.03em]">{trip.total != null && trip.currency ? formatStoryMoney(trip.total, trip.currency) : '—'}</div>
        {trip.perTraveler != null && trip.currency && <div className="mt-0.5 font-mono text-[10px] text-[var(--ink-3)]">{formatStoryMoney(trip.perTraveler, trip.currency)} each</div>}
        <div className="mt-1.5 flex gap-1 sm:justify-end">
          {trip.miles != null && <Chip>{trip.miles.toLocaleString('en-US')} mi</Chip>}
          {trip.code && <Chip>{trip.code}</Chip>}
        </div>
      </div>
      {trip.note && <p className="col-span-full border-t border-dashed border-[var(--line)] pt-2 text-[12.5px] text-[var(--ink-2)]">{trip.note}</p>}
    </article>
  );
}

function Chip({ children }: { children: ReactNode }) {
  return <span className="rounded-full bg-[var(--cream-2)] px-1.5 py-0.5 font-mono text-[8.5px] uppercase tracking-[0.1em] text-[var(--ink-2)]">{children}</span>;
}

function Bands({ bands, count, currency }: { bands: BandRow[]; count: number; currency: string }) {
  const total = bands.reduce((sum, band) => sum + band.trips, 0) || 1;
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  return (
    <div className="grid items-center gap-4 sm:grid-cols-[170px_1fr]">
      <div className="relative mx-auto grid w-[170px] place-items-center">
        <svg viewBox="0 0 160 160" className="w-full -rotate-90" role="img" aria-label="Trip value bands">
          {bands.map((band) => {
            const length = (circumference * band.trips) / total;
            const circle = (
              <circle key={band.label} cx="80" cy="80" r={radius} fill="none" stroke={band.color} strokeWidth="21" strokeDasharray={`${length} ${circumference - length}`} strokeDashoffset={-offset} />
            );
            offset += length;
            return circle;
          })}
        </svg>
        <div className="pointer-events-none absolute text-center">
          <div className="bright-grad-text font-display text-[26px] font-semibold leading-none">{count}</div>
          <div className="font-mono-label mt-1">Trips</div>
        </div>
      </div>
      <table className="w-full text-[13px]">
        <thead>
          <tr className="font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--ink-3)]">
            <th className="pb-2 text-left font-normal">Band</th>
            <th className="pb-2 text-right font-normal">Trips</th>
            <th className="pb-2 text-right font-normal">Value</th>
          </tr>
        </thead>
        <tbody>
          {bands.map((band) => (
            <tr key={band.label} className="border-t border-[var(--line-2)]">
              <td className="py-2.5"><span className="inline-flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-[3px]" style={{ background: band.color }} />{band.label}</span></td>
              <td className="py-2.5 text-right font-mono text-[11.5px]">{band.trips}</td>
              <td className="py-2.5 text-right font-mono text-[11.5px]">{formatStoryMoney(band.amount, currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Record({ record }: { record: FlightRecord }) {
  return (
    <div className="flex items-center gap-3 border-b border-[var(--line-2)] py-3 last:border-b-0">
      <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[11px] text-white" style={{ background: 'var(--grad-deep)' }}>
        {record.icon === 'plane' ? <Plane className="h-4 w-4" /> : <Route className="h-4 w-4" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-sm font-semibold tracking-[-0.02em]">{record.route}</span>
        <span className="mt-0.5 block text-[11.5px] text-[var(--ink-2)]">{record.subtitle}</span>
      </span>
      <span className="whitespace-nowrap font-display text-[15px] font-semibold tracking-[-0.025em]">
        {record.value}<em className="ml-0.5 text-[0.68em] font-normal not-italic text-[var(--ink-3)]">{record.unit}</em>
      </span>
    </div>
  );
}
