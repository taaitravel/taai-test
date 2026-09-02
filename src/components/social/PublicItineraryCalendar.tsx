import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { PublicItineraryDay } from '@/lib/social/types';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const DOT_COLOR: Record<string, string> = {
  stay: 'bg-primary',
  dining: 'bg-rental',
  activity: 'bg-foreground/60',
  transit: 'bg-muted-foreground',
};

const parse = (iso: string) => new Date(`${iso}T00:00:00Z`);

/** Read-only month grid for a public itinerary — event dots by item type. */
export const PublicItineraryCalendar = ({ days }: { days: PublicItineraryDay[] }) => {
  const { cells, monthLabel } = useMemo(() => {
    const first = parse(days[0].date);
    const year = first.getUTCFullYear();
    const month = first.getUTCMonth();
    const monthStart = new Date(Date.UTC(year, month, 1));
    const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    // Monday-first offset
    const offset = (monthStart.getUTCDay() + 6) % 7;

    const byDate = new Map(days.map(d => [d.date, d]));
    const list: Array<{ key: string; dayNumber?: number; day?: PublicItineraryDay }> = [];

    for (let i = 0; i < offset; i++) list.push({ key: `pad-${i}` });
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      list.push({ key: iso, dayNumber: d, day: byDate.get(iso) });
    }

    return {
      cells: list,
      monthLabel: monthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }),
    };
  }, [days]);

  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">{monthLabel}</p>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-primary inline-block" />Stay</span>
          <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-rental inline-block" />Dining</span>
          <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-foreground/60 inline-block" />Activity</span>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map(w => (
          <p key={w} className="font-mono-label">{w}</p>
        ))}
        {cells.map(cell => (
          <div
            key={cell.key}
            className={cn(
              'min-h-[54px] rounded-lg border p-1 text-left',
              cell.day ? 'border-primary/30 bg-primary/5' : 'border-transparent'
            )}
          >
            {cell.dayNumber && (
              <p className={cn('text-[11px]', cell.day ? 'text-foreground font-semibold' : 'text-muted-foreground/60')}>
                {cell.dayNumber}
              </p>
            )}
            {cell.day && (
              <>
                <p className="text-[10px] text-muted-foreground truncate">{cell.day.city}</p>
                <div className="flex gap-0.5 mt-1 flex-wrap">
                  {cell.day.places.slice(0, 5).map((p, i) => (
                    <span
                      key={`${cell.key}-${i}`}
                      aria-hidden
                      className={cn('h-1.5 w-1.5 rounded-full', DOT_COLOR[p.kind] ?? 'bg-muted-foreground')}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PublicItineraryCalendar;
