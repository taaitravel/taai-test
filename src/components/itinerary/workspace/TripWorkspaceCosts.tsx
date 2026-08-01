import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TripWorkspaceCostsProps {
  budget: number;
  spending: number;
  cartTotal: number;
  travelersCount: number;
  budgetChart: ReactNode;
}

const formatMoney = (value: number) =>
  `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const TripWorkspaceCosts = ({
  budget,
  spending,
  cartTotal,
  travelersCount,
  budgetChart,
}: TripWorkspaceCostsProps) => {
  const safeTravelersCount = Math.max(travelersCount, 1);
  const perPersonEstimate = budget > 0 ? budget / safeTravelersCount : 0;

  return (
    <section id="trip-workspace-costs" role="tabpanel" aria-label="Costs" className="space-y-6">
      <Card className="bg-card/80 border-border backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-foreground">Cost snapshot</CardTitle>
          <p className="text-sm text-muted-foreground">
            These values reuse current trip budget, itinerary spending, and cart item totals. This slice does not claim booked, paid, remaining, or refundable totals unless existing deterministic sources already support them.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-border bg-muted/50 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Trip budget</p>
              <p className="mt-2 text-xl font-bold text-foreground">{formatMoney(budget)}</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/50 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Itinerary spending</p>
              <p className="mt-2 text-xl font-bold text-foreground">{formatMoney(spending)}</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/50 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Current cart subtotal</p>
              <p className="mt-2 text-xl font-bold text-foreground">{formatMoney(cartTotal)}</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/50 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Budget per traveler</p>
              <p className="mt-2 text-xl font-bold text-foreground">{formatMoney(perPersonEstimate)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      {budgetChart}
    </section>
  );
};
