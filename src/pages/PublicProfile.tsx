import { useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBrightTheme } from '@/hooks/useBrightTheme';
import { PublicNavigation } from '@/components/shared/PublicNavigation';
import { PublicFooter } from '@/components/shared/PublicFooter';
import { getMockProfile } from '@/lib/social/mock-discover';
import {
  MINERVA_SOCIAL_EVENT_IDS,
  buildSocialEvent,
  emitSocialEvent,
} from '@/lib/taai/minerva/social-events';

/**
 * Public profile — slug, display name, short bio and PUBLIC itineraries only.
 * Never exposes email, phone, address, bookings or private preferences.
 */
const PublicProfile = () => {
  useBrightTheme();
  const { slug = '' } = useParams();
  const profile = useMemo(() => getMockProfile(slug), [slug]);

  useEffect(() => {
    if (!profile) return;
    document.title = `${profile.displayName} | taai travel`;
    emitSocialEvent(
      buildSocialEvent(MINERVA_SOCIAL_EVENT_IDS.publicProfileViewed, 'public_profile', {
        profileSlug: profile.slug,
      })
    );
  }, [profile]);

  return (
    <div className="min-h-screen bg-background">
      <PublicNavigation />

      <main className="mx-auto w-full max-w-4xl px-4 pt-24 pb-24 space-y-6">
        <Link
          to="/discover"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground min-h-[44px]"
          aria-label="Back to Discover"
        >
          <ArrowLeft className="h-4 w-4" /> Discover
        </Link>

        {!profile ? (
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-semibold text-foreground">Profile not available</h1>
            <p className="text-sm text-muted-foreground">
              This traveler is not discoverable.
            </p>
            <Button asChild className="rounded-full">
              <Link to="/discover">Back to Discover</Link>
            </Button>
          </div>
        ) : (
          <>
            <header className="rounded-3xl border border-border bg-card p-5 space-y-2 shadow-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-primary">Public profile</p>
              <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">
                {profile.displayName}
              </h1>
              <p className="text-sm text-muted-foreground">{profile.shortBio}</p>
              <p className="text-[11px] text-muted-foreground">@{profile.slug}</p>
            </header>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">Public itineraries</h2>
              <div className="flex flex-wrap gap-3">
                {profile.itineraries.map(card => (
                  <PublicItineraryCard key={card.id} card={card} />
                ))}
              </div>
            </section>

          </>
        )}
      </main>

      <PublicFooter />
    </div>
  );
};

export default PublicProfile;
