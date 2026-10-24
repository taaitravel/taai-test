import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { corporateTiers, individualTiers } from '@/components/subscription/TierDefinitions';
import { useSubscription } from '@/hooks/useSubscription';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

const COPY = {
  PLAN_LIMIT_ITINERARIES: {
    title: 'Trip limit reached',
    body: 'The free Traveler plan includes 3 trips. Upgrade to keep planning more.',
  },
  PLAN_LIMIT_SHARING: {
    title: 'Sharing limit reached',
    body: 'This plan limits how many people can share a trip. Upgrade to invite more.',
  },
  PLAN_LIMIT_AI: {
    title: 'Planning credits used',
    body: 'This month\'s Miles and Bob search credits are used up. Upgrade for a higher monthly allowance, or wait until next month.',
  },
} as const;

export type PlanLimitCode = keyof typeof COPY;

interface UpgradeModalProps {
  open: boolean;
  code?: PlanLimitCode | null;
  onOpenChange: (open: boolean) => void;
}

export const UpgradeModal = ({ open, code, onOpenChange }: UpgradeModalProps) => {
  const navigate = useNavigate();
  const { createCheckout } = useSubscription();
  const [busy, setBusy] = useState<string | null>(null);
  const copy = code ? COPY[code] : {
    title: 'Choose a planning plan',
    body: 'Plans are a software subscription for trip planning. taai does not sell or take payment for travel.',
  };
  const paid = [...individualTiers, ...corporateTiers].filter((tier) => tier.isPaid);

  const subscribe = async (tierId: string) => {
    setBusy(tierId);
    try {
      const url = await createCheckout(tierId, 'monthly');
      if (url) window.location.href = url;
    } finally {
      setBusy(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-card text-card-foreground border-border">
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.body}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-3">
          {paid.map((tier) => (
            <div key={tier.id} className="rounded-xl border border-border bg-background/60 p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="font-semibold">{tier.name}</p>
                {tier.isPopular && <Badge className="gold-gradient text-primary-foreground">Popular</Badge>}
              </div>
              <p className="text-2xl font-bold">{tier.priceText.monthly}</p>
              <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                {tier.features.slice(0, 4).map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <Button
                className="mt-4 w-full gold-gradient text-primary-foreground"
                disabled={busy === tier.id}
                onClick={() => subscribe(tier.id)}
              >
                {busy === tier.id ? 'Opening checkout…' : 'Upgrade'}
              </Button>
            </div>
          ))}
        </div>
        <Button variant="ghost" onClick={() => { onOpenChange(false); navigate('/subscription'); }}>
          Compare all plans
        </Button>
      </DialogContent>
    </Dialog>
  );
};
