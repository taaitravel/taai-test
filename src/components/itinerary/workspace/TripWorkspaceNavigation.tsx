import { Button } from '@/components/ui/button';
import {
  TRIP_WORKSPACE_SECTION_LABELS,
  TRIP_WORKSPACE_SECTIONS,
  type TripWorkspaceSection,
} from '@/lib/trip-workspace/sections';
import { cn } from '@/lib/utils';

interface TripWorkspaceNavigationProps {
  selectedSection: TripWorkspaceSection;
  onSectionChange: (section: TripWorkspaceSection) => void;
}

export const TripWorkspaceNavigation = ({
  selectedSection,
  onSectionChange,
}: TripWorkspaceNavigationProps) => {
  return (
    <nav aria-label="Trip workspace sections" className="sticky top-0 z-20 -mx-4 bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:static sm:mx-0 sm:px-0 sm:pt-0">
      <div className="overflow-x-auto pb-1 scrollbar-hide" role="tablist" aria-orientation="horizontal">
        <div className="flex min-w-max gap-2 rounded-full border border-border bg-card/80 p-1 sm:inline-flex">
          {TRIP_WORKSPACE_SECTIONS.map((section) => {
            const selected = section === selectedSection;
            return (
              <Button
                key={section}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={`trip-workspace-${section}`}
                variant={selected ? 'default' : 'ghost'}
                size="sm"
                className={cn(
                  'h-9 rounded-full px-4 text-sm whitespace-nowrap transition-all',
                  selected
                    ? 'gold-gradient text-background shadow-sm hover:opacity-90'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
                onClick={() => onSectionChange(section)}
              >
                {TRIP_WORKSPACE_SECTION_LABELS[section]}
              </Button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
