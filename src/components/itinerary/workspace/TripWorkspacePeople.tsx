import type { ReactNode } from 'react';

interface TripWorkspacePeopleProps {
  children: ReactNode;
}

export const TripWorkspacePeople = ({ children }: TripWorkspacePeopleProps) => {
  return (
    <section id="trip-workspace-people" role="tabpanel" aria-label="People" className="space-y-6">
      <div className="rounded-2xl border border-border bg-card/80 p-5 backdrop-blur-md">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">People</p>
        <h2 className="mt-2 text-2xl font-bold text-foreground">Travelers, invites, and balances</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Current owner/member values are shown as the app stores them today. This slice does not normalize roles or widen permissions.
        </p>
      </div>
      {children}
    </section>
  );
};
