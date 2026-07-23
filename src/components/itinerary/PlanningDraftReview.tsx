import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, AlertCircle, MapPin, Calendar } from 'lucide-react';
import { formatMoney } from '@/lib/utils';
import type { PlanningDraftItem } from '@/types/planning-draft';

interface PlanningDraftReviewProps {
  items: PlanningDraftItem[];
  onRemove: (draftId: string) => void;
}

const KIND_LABEL: Record<PlanningDraftItem['kind'], string> = {
  flight: 'Flight',
  hotel: 'Stay',
  activity: 'Activity',
  restaurant: 'Restaurant',
  note: 'Note',
};

export const PlanningDraftReview: React.FC<PlanningDraftReviewProps> = ({ items, onRemove }) => {
  if (items.length === 0) {
    return (
      <section aria-label="Planning draft" className="mt-4 rounded-lg border border-border bg-card/50 p-4 text-sm text-muted-foreground">
        Nothing in your draft yet. Add results from Bob to plan them locally.
      </section>
    );
  }

  return (
    <section aria-label="Planning draft" className="mt-4 space-y-3">
      <header className="flex items-baseline justify-between">
        <h2 className="text-base font-semibold text-foreground">Draft ({items.length})</h2>
        <span className="text-xs text-muted-foreground">Not saved · planning only</span>
      </header>

      <ul className="space-y-2">
        {items.map((item) => {
          const hasPrice = item.price !== null && !!item.currency;
          return (
            <li
              key={item.draftId}
              className="rounded-lg border border-border bg-card p-3 flex gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
                    {KIND_LABEL[item.kind]}
                  </Badge>
                  {item.provider && (
                    <span className="text-xs text-muted-foreground truncate">{item.provider}</span>
                  )}
                </div>
                <p className="text-sm font-medium text-foreground truncate">{item.title}</p>

                {(item.locationLabel || item.serviceDateStart) && (
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {item.locationLabel && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {item.locationLabel}
                      </span>
                    )}
                    {item.serviceDateStart && (
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {item.serviceDateStart}
                        {item.serviceDateEnd ? ` → ${item.serviceDateEnd}` : ''}
                      </span>
                    )}
                  </div>
                )}

                <p className="mt-1 text-sm font-semibold text-foreground">
                  {hasPrice ? formatMoney(item.price, item.currency!) : 'Price not confirmed'}
                </p>

                {item.validationIssues.length > 0 && (
                  <ul className="mt-1 space-y-0.5">
                    {item.validationIssues.map((issue, i) => (
                      <li key={i} className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400">
                        <AlertCircle className="h-3 w-3" />
                        {issue}
                      </li>
                    ))}
                  </ul>
                )}

                <p className="mt-2 text-[11px] text-muted-foreground">
                  {item.availabilityStatus === 'planning_only'
                    ? 'Planning only · provider availability not confirmed'
                    : 'Provider availability not confirmed'}
                </p>
              </div>

              <Button
                variant="ghost"
                size="icon"
                aria-label={`Remove ${item.title} from draft`}
                onClick={() => onRemove(item.draftId)}
                className="h-8 w-8 shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </li>
          );
        })}
      </ul>

      <p className="text-[11px] text-muted-foreground">
        Trip details are required before this draft can be saved.
      </p>
    </section>
  );
};