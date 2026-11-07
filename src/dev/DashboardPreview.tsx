import { useEffect } from 'react';
import { HeroSection } from '@/components/dashboard/HeroSection';
import { SocialCta } from '@/components/dashboard/sections/SocialCta';
import { TravelHub } from '@/components/dashboard/sections/TravelHub';
import { TravelMetrics } from '@/components/dashboard/sections/TravelMetrics';
import { TripsSection } from '@/components/dashboard/TripsSection';
import type { TravelAnalyticsState } from '@/hooks/useTravelAnalytics';

const trips = [
  {
    id: 1,
    itin_id: 'sample-iberia',
    itin_name: 'Sample Iberia week',
    itin_date_start: '2026-11-01',
    itin_date_end: '2026-11-15',
    itin_locations: ['Madrid, Spain'],
    budget: 4200,
    spending: 3743.14,
  },
  {
    id: 2,
    itin_id: 'sample-lisbon',
    itin_name: 'Sample Lisbon',
    itin_date_start: '2026-05-02',
    itin_date_end: '2026-05-06',
    itin_locations: ['Lisbon, Portugal'],
    budget: 900,
    spending: 640,
  },
];

const analytics: TravelAnalyticsState = {
  loading: false,
  errors: [],
  truncated: false,
  viewerId: 'preview-user',
  viewerTimeZone: 'Europe/Madrid',
  input: {
    trips: trips.map((trip) => ({
      id: String(trip.id),
      name: trip.itin_name,
      start: trip.itin_date_start,
      end: trip.itin_date_end,
      budget: trip.budget,
      spending: trip.spending,
    })),
    reimbursementCount: 1,
    shares: [],
    reportedPayments: [{
      id: 'reported:1',
      occurrenceId: 'external:1',
      category: 'flights',
      amount: 80,
      currency: 'EUR',
      status: 'reported_paid',
      evidence: 'unverified',
    }],
    settlements: [],
    occurrences: [
      {
        id: 'provider:flight',
        tripId: '1',
        source: 'provider',
        category: 'flights',
        amount: 240,
        currency: 'EUR',
        serviceDate: '2026-05-02',
        serviceEnd: '2026-05-02',
        status: 'confirmed',
        rooms: null,
        segments: null,
        linkedToId: null,
      },
      {
        id: 'provider:stay',
        tripId: '1',
        source: 'provider',
        category: 'properties',
        amount: 480,
        currency: 'EUR',
        serviceDate: '2026-11-01',
        serviceEnd: '2026-11-04',
        status: 'confirmed',
        rooms: 1,
        segments: null,
        linkedToId: null,
      },
      {
        id: 'cart:walk',
        tripId: '1',
        source: 'cart',
        category: 'activities',
        amount: 36,
        currency: null,
        serviceDate: '2026-11-03',
        serviceEnd: null,
        status: 'saved',
        rooms: null,
        segments: null,
        linkedToId: null,
      },
    ],
  },
};

/**
 * Dev-only layout check. The figures are sample inputs for the components,
 * not a signed-in account and not a verified baseline.
 */
const DashboardPreview = () => {
  useEffect(() => {
    const theme = new URLSearchParams(window.location.search).get('theme');
    if (theme === 'dark' || theme === 'light') {
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(theme);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <p className="px-4 pt-4 text-xs text-muted-foreground">Sample layout for review. These figures are not an account and are not verified spend.</p>
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-6">
        <SocialCta />
        <TravelHub counts={{ active: 1, upcoming: 0, completed: 1 }} />
        <HeroSection
          activeItineraries={trips}
          fullUserStats={{ countriesVisited: 2, travelerLevel: 'Wanderer' }}
        />
        <TravelMetrics
          userStats={{
            totalTrips: 2,
            countriesVisited: 2,
            citiesVisited: 2,
            profileFlightFrequency: 0,
            travelerLevel: 'Wanderer',
          }}
          visitedCountries={['Spain', 'Japan']}
          phaseCounts={{ active: 1, upcoming: 0, planning: 0, completed: 1 }}
          analytics={analytics}
          startOpen={new URLSearchParams(window.location.search).get('metrics') === '1'}
        />
        <TripsSection activeItineraries={trips} loading={false} />
      </div>
    </div>
  );
};

export default DashboardPreview;
