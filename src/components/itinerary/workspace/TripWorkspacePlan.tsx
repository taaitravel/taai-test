import type { ReactNode } from 'react';

interface TripWorkspacePlanProps {
  children: ReactNode;
}

export const TripWorkspacePlan = ({ children }: TripWorkspacePlanProps) => {
  return (
    <section id="trip-workspace-plan" role="tabpanel" aria-label="Plan" className="space-y-6">
      <div className="rounded-2xl border border-border bg-card/80 p-5 backdrop-blur-md">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Plan</p>
        <h2 className="mt-2 text-2xl font-bold text-foreground">Your flexible trip plan</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Your plan can change as the group makes decisions. Existing items are planning details unless taai has deterministic booking evidence elsewhere.
        </p>
      </div>
      {children}
    </section>
  );
};
