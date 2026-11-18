import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { localDateOnlyFromDate } from '@/lib/date-time';
import { buildTravelStory, formatStoryMoney } from '@/lib/dashboard/travel-story';
import type { TravelAnalyticsState } from '@/hooks/useTravelAnalytics';

interface TravelMetricsProps {
  analytics: TravelAnalyticsState;
  profileCountries?: number | null;
  href?: string;
}

/** Home teaser. The full story lives on /travel-metrics. */
export const TravelMetrics = ({ analytics, profileCountries = null, href = '/travel-metrics' }: TravelMetricsProps) => {
  const today = localDateOnlyFromDate();
  const story = useMemo(
    () => buildTravelStory(analytics.input, {
      today,
      time: { kind: 'all' },
      profileCountries,
      profileName: null,
    }),
    [analytics.input, today, profileCountries],
  );
  const spend = story.hero.spend
    ? formatStoryMoney(story.hero.spend.amount, story.hero.spend.currency)
    : null;

  return (
    <section className="bright-card overflow-hidden p-4 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono-label mb-1">Overview</p>
          <h2 className="font-display text-xl font-semibold text-foreground sm:text-2xl">Travel metrics</h2>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            {story.hero.itineraries > 0
              ? `${story.headline.join(' ')} Planned amounts, one currency at a time.`
              : 'Plan a trip and the shape of the year shows up here.'}
          </p>
        </div>
        <Button asChild size="sm" className="bright-btn-grad h-9 shrink-0 rounded-full px-4 font-medium">
          <Link to={href}>View metrics</Link>
        </Button>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Teaser label="Planned" value={analytics.loading ? '…' : spend ?? '—'} />
        <Teaser label="Trips ahead" value={analytics.loading ? '…' : String(story.hero.itineraries)} />
        <Teaser label="Nights" value={analytics.loading ? '…' : story.hero.nights != null ? String(story.hero.nights) : '—'} />
        <Teaser label="Miles" value={analytics.loading ? '…' : story.hero.miles != null ? story.hero.miles.toLocaleString('en-US') : '—'} />
      </div>
      <p className="mt-4 text-xs text-muted-foreground">Planned and recorded amounts only. A missing price is left blank.</p>
    </section>
  );
};

function Teaser({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-muted/50 px-3 py-3">
      <p className="font-mono-label">{label}</p>
      <p className="mt-1 font-display text-xl font-semibold tracking-tight text-foreground">{value}</p>
    </div>
  );
}
