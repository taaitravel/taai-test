import { useMemo, useState } from 'react';
import { demoMetricsInput } from '@/lib/dashboard/demo-itineraries';
import { buildTravelStory, type TimeFilter } from '@/lib/dashboard/travel-story';
import { TravelMetricsView } from '@/components/metrics/TravelMetricsView';

const TODAY = '2026-11-18';
const TABS = ['overview', 'spending', 'trips', 'passport'] as const;

/**
 * Dev-only render of the metrics page from the same itineraries the demo seed inserts.
 * It is not a signed-in session and it does not read production.
 */
const TravelMetricsPreview = () => {
  const params = new URLSearchParams(window.location.search);
  const requested = params.get('tab');
  const initialTab = TABS.find((tab) => tab === requested) ?? 'overview';
  const year = Number(params.get('year'));
  const [time, setTime] = useState<TimeFilter>(Number.isInteger(year) && year > 1900 ? { kind: 'year', year } : { kind: 'all' });
  const input = useMemo(() => demoMetricsInput(), []);
  const story = useMemo(() => buildTravelStory(input, {
    today: TODAY,
    time,
    profileCountries: null,
    profileName: 'Marco Brugo',
  }), [input, time]);

  return (
    <TravelMetricsView
      story={story}
      onTime={setTime}
      initialTab={initialTab}
      backHref="/internal/dashboard-preview"
      backLabel="Home"
    />
  );
};

export default TravelMetricsPreview;
