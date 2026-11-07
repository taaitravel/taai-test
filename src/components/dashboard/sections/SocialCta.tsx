import { Compass, BookOpen, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * Social entry points that already exist, plus an honest stories placeholder.
 * Discover is a working page of curated samples. Stories are not a live feed.
 */
export const SocialCta = () => {
  const navigate = useNavigate();

  return (
    <section aria-label="Start here" className="grid grid-cols-1 gap-3 md:grid-cols-3">
      <button
        type="button"
        onClick={() => navigate('/discover')}
        className="bright-card flex min-h-11 flex-col items-start gap-2 p-4 text-left transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="flex items-center gap-2 font-display text-base font-semibold text-foreground">
          <Compass className="h-4 w-4" aria-hidden />
          Discover
        </span>
        <span className="text-sm text-muted-foreground">
          Open curated sample trips you can read and clone. These are not live posts from other travelers.
        </span>
      </button>

      <div
        role="group"
        aria-label="Stories, not available"
        className="bright-card flex min-h-11 flex-col items-start gap-2 border-dashed p-4 text-left"
      >
        <span className="flex items-center gap-2 font-display text-base font-semibold text-foreground">
          <Users className="h-4 w-4" aria-hidden />
          Stories
        </span>
        <span className="text-sm text-muted-foreground">
          Stories are not available yet. There is no feed here, and nothing on this card is a post.
        </span>
        <button type="button" disabled className="h-9 rounded-full border border-border px-3 text-xs text-muted-foreground">
          Unavailable
        </button>
      </div>

      <button
        type="button"
        onClick={() => navigate('/my-itineraries')}
        className="bright-card flex min-h-11 flex-col items-start gap-2 p-4 text-left transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="flex items-center gap-2 font-display text-base font-semibold text-foreground">
          <BookOpen className="h-4 w-4" aria-hidden />
          Your itineraries
        </span>
        <span className="text-sm text-muted-foreground">
          Open the trips you created and edit them. This does not start a booking checkout.
        </span>
      </button>
    </section>
  );
};
