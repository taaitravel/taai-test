import { useMemo, useState } from 'react';
import { useDashboard } from '@/hooks/useDashboard';
import { useTravelAnalytics } from '@/hooks/useTravelAnalytics';
import { localDateOnlyFromDate } from '@/lib/date-time';
import { buildTravelStory, type TimeFilter } from '@/lib/dashboard/travel-story';
import { TravelMetricsView } from '@/components/metrics/TravelMetricsView';

const TravelMetricsPage = () => {
  const { activeItineraries, loading, userProfile, visitedCountries } = useDashboard();
  const analytics = useTravelAnalytics(activeItineraries);
  const [time, setTime] = useState<TimeFilter>({ kind: 'all' });
  const today = localDateOnlyFromDate();
  const profileName = [userProfile?.first_name, userProfile?.last_name].filter(Boolean).join(' ') || null;
  const story = useMemo(() => buildTravelStory(analytics.input, {
    today,
    time,
    profileCountries: userProfile ? visitedCountries.length : null,
    profileName,
  }), [analytics.input, today, time, userProfile, visitedCountries.length, profileName]);
  const safeTime = time.kind === 'year' && !story.years.includes(time.year) ? { kind: 'all' as const } : time;
  const display = safeTime === time ? story : buildTravelStory(analytics.input, {
    today,
    time: safeTime,
    profileCountries: userProfile ? visitedCountries.length : null,
    profileName,
  });
  const notice = analytics.errors.length
    ? 'Some cost records could not be loaded, so this view may be incomplete.'
    : analytics.truncated
      ? 'This view includes the first 200 line items.'
      : null;

  return (
    <TravelMetricsView
      story={display}
      onTime={setTime}
      loading={loading || analytics.loading}
      notice={notice}
    />
  );
};

export default TravelMetricsPage;
