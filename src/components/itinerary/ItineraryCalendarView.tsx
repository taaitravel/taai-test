import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronLeft, ChevronRight, CheckCircle2, Circle, ExternalLink, Plus } from "lucide-react";
import { ItineraryData } from "@/types/itinerary";
import { getHoliday } from "@/lib/holidays";
import { useEventCompletions } from "@/hooks/useEventCompletions";
import { useNavigate } from "react-router-dom";

interface ItineraryCalendarViewProps {
  startDate: string;
  duration: number;
  destinations: string[];
  itineraryId?: number;
  flights?: ItineraryData['flights'];
  hotels?: ItineraryData['hotels'];
  activities?: ItineraryData['activities'];
  reservations?: ItineraryData['reservations'];
  onViewItem?: (type: 'flights' | 'hotels' | 'activities' | 'reservations', index: number) => void;
}

type CalendarEvent = {
  type: string;
  group: string;
  index: number;
  title: string;
  color: string;
  textColor: string;
  time?: string;
};

const colorMap: Record<string, { color: string; textColor: string }> = {
  flight: { color: 'bg-rose-400/80', textColor: 'text-rose-500' },
  hotel: { color: 'bg-orange-400/80', textColor: 'text-orange-500' },
  activity: { color: 'bg-amber-400/80', textColor: 'text-amber-500' },
  reservation: { color: 'bg-sky-400/80', textColor: 'text-sky-500' },
};

export const ItineraryCalendarView = ({
  startDate,
  duration,
  destinations,
  itineraryId,
  flights = [],
  hotels = [],
  activities = [],
  reservations = [],
  onViewItem,
}: ItineraryCalendarViewProps) => {
  const navigate = useNavigate();
  const tripStart = new Date(startDate);
  const tripEnd = new Date(startDate);
  tripEnd.setDate(tripEnd.getDate() + duration - 1);

  const { isCompleted, toggleCompletion } = useEventCompletions(itineraryId);

  // Determine all months the trip spans
  const tripMonths = useMemo(() => {
    const months: { month: number; year: number }[] = [];
    const cursor = new Date(tripStart.getFullYear(), tripStart.getMonth() - 1, 1);
    const endMonth = new Date(tripEnd.getFullYear(), tripEnd.getMonth() + 1, 1);
    while (cursor <= endMonth) {
      months.push({ month: cursor.getMonth(), year: cursor.getFullYear() });
      cursor.setMonth(cursor.getMonth() + 1);
    }
    return months;
  }, [startDate, duration]);

  // Build event map
  const safeDate = (val?: string) => { if (!val) return null; const dt = new Date(val); return isNaN(dt.getTime()) ? null : dt; };
  const toKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  const extractTime = (dt: Date | null) => dt ? dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined;

  const eventMap = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    const addEvent = (dateKey: string, event: CalendarEvent) => {
      if (!map.has(dateKey)) map.set(dateKey, []);
      map.get(dateKey)!.push(event);
    };

    (flights || []).forEach((f: any, idx: number) => {
      const dt = safeDate(f?.departure);
      if (dt) addEvent(toKey(dt), { type: 'flight', group: 'flights', index: idx, title: `✈ ${f?.flight_number || ''} ${f?.from || ''} → ${f?.to || ''}`, ...colorMap.flight, time: extractTime(dt) });
    });

    (hotels || []).forEach((h: any, idx: number) => {
      const ci = safeDate(h?.check_in);
      if (ci) addEvent(toKey(ci), { type: 'hotel', group: 'hotels', index: idx, title: `🏨 ${h?.name || ''} (in)`, ...colorMap.hotel, time: extractTime(ci) });
      const co = safeDate(h?.check_out);
      if (co) addEvent(toKey(co), { type: 'hotel', group: 'hotels', index: idx, title: `🏨 ${h?.name || ''} (out)`, ...colorMap.hotel, time: extractTime(co) });
    });

    (activities || []).forEach((a: any, idx: number) => {
      const dt = safeDate(a?.date);
      if (dt) addEvent(toKey(dt), { type: 'activity', group: 'activities', index: idx, title: `🎯 ${a?.name || 'Activity'}`, ...colorMap.activity, time: extractTime(dt) });
    });

    (reservations || []).forEach((r: any, idx: number) => {
      const dt = r?.date ? safeDate(r.date) : null;
      if (dt) addEvent(toKey(dt), { type: 'reservation', group: 'reservations', index: idx, title: `🍽 ${r?.name || 'Reservation'}`, ...colorMap.reservation, time: extractTime(dt) });
    });

    return map;
  }, [flights, hotels, activities, reservations]);

  const isTripDay = (d: Date) => {
    const t = new Date(d); t.setHours(0, 0, 0, 0);
    const s = new Date(tripStart); s.setHours(0, 0, 0, 0);
    const e = new Date(tripEnd); e.setHours(0, 0, 0, 0);
    return t >= s && t <= e;
  };

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="lg:col-span-2">
      <Card className="bg-card/80 border-border backdrop-blur-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-foreground">Calendar View</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ScrollArea className="h-[700px]">
            <div className="space-y-8 pr-2">
              {tripMonths.map(({ month, year }) => (
                <MonthGrid
                  key={`${year}-${month}`}
                  month={month}
                  year={year}
                  weekdays={weekdays}
                  eventMap={eventMap}
                  toKey={toKey}
                  isTripDay={isTripDay}
                  isCompleted={isCompleted}
                  toggleCompletion={toggleCompletion}
                  onViewItem={onViewItem}
                  onAddPlans={() => navigate('/search')}
                />
              ))}
            </div>
          </ScrollArea>

          {/* Legend */}
          <div className="flex items-center gap-3 mt-3 pt-2 border-t border-border">
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-400/80" /><span className="text-[10px] text-muted-foreground">Flights</span></div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-400/80" /><span className="text-[10px] text-muted-foreground">Hotels</span></div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-400/80" /><span className="text-[10px] text-muted-foreground">Activities</span></div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-sky-400/80" /><span className="text-[10px] text-muted-foreground">Dining</span></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// --- Month Grid Sub-component ---

interface MonthGridProps {
  month: number;
  year: number;
  weekdays: string[];
  eventMap: Map<string, CalendarEvent[]>;
  toKey: (d: Date) => string;
  isTripDay: (d: Date) => boolean;
  isCompleted: (eventType: string, eventIndex: number) => boolean;
  toggleCompletion: (eventType: string, eventIndex: number, eventDate?: string) => void;
  onViewItem?: (type: 'flights' | 'hotels' | 'activities' | 'reservations', index: number) => void;
  onAddPlans: () => void;
}

const MonthGrid = ({
  month, year, weekdays, eventMap, toKey, isTripDay,
  isCompleted, toggleCompletion, onViewItem, onAddPlans,
}: MonthGridProps) => {
  const firstDayOfMonth = new Date(year, month, 1);
  const startDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = firstDayOfMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground mb-2">{monthName}</h3>
      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {weekdays.map(wd => (
          <div key={wd} className="text-center text-[10px] font-medium text-muted-foreground py-1">{wd}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startDayOfWeek }, (_, i) => (
          <div key={`empty-${i}`} className="min-h-[100px]" />
        ))}

        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const cellDate = new Date(year, month, day);
          const key = toKey(cellDate);
          const dayEvents = eventMap.get(key) || [];
          const holiday = getHoliday(cellDate);
          const inTrip = isTripDay(cellDate);
          const dateStr = cellDate.toISOString().split('T')[0];

          return (
            <DayCell
              key={day}
              day={day}
              cellDate={cellDate}
              dateStr={dateStr}
              dayEvents={dayEvents}
              holiday={holiday}
              inTrip={inTrip}
              isCompleted={isCompleted}
              toggleCompletion={toggleCompletion}
              onViewItem={onViewItem}
              onAddPlans={onAddPlans}
            />
          );
        })}
      </div>
    </div>
  );
};

// --- Day Cell Sub-component ---

interface DayCellProps {
  day: number;
  cellDate: Date;
  dateStr: string;
  dayEvents: CalendarEvent[];
  holiday: string | null;
  inTrip: boolean;
  isCompleted: (eventType: string, eventIndex: number) => boolean;
  toggleCompletion: (eventType: string, eventIndex: number, eventDate?: string) => void;
  onViewItem?: (type: 'flights' | 'hotels' | 'activities' | 'reservations', index: number) => void;
  onAddPlans: () => void;
}

const DayCell = ({
  day, cellDate, dateStr, dayEvents, holiday, inTrip,
  isCompleted, toggleCompletion, onViewItem, onAddPlans,
}: DayCellProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={`min-h-[100px] rounded-md border text-left p-1.5 transition-colors relative flex flex-col ${
            inTrip
              ? 'border-primary/30 bg-primary/5 hover:bg-primary/10'
              : 'border-transparent hover:bg-muted/50'
          }`}
        >
          <span className={`text-xs font-medium ${inTrip ? 'text-foreground' : 'text-muted-foreground'}`}>
            {day}
          </span>
          {holiday && (
            <div className="text-[8px] text-primary truncate leading-tight">{holiday}</div>
          )}
          <div className="flex flex-col gap-0.5 mt-1 overflow-hidden flex-1">
            {dayEvents.slice(0, 3).map((ev, ei) => {
              const completed = isCompleted(ev.type, ev.index);
              return (
                <div key={ei} className={`flex items-center gap-1 ${completed ? 'opacity-50' : ''}`}>
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${ev.color}`} />
                  <span className={`text-[9px] truncate ${ev.textColor} ${completed ? 'line-through' : ''}`}>
                    {ev.title.replace(/^[✈🏨🎯🍽]\s*/, '')}
                  </span>
                </div>
              );
            })}
            {dayEvents.length > 3 && (
              <span className="text-[8px] text-muted-foreground">+{dayEvents.length - 3} more</span>
            )}
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" side="bottom" align="start">
        <div className="space-y-1.5">
          <div className="text-xs font-semibold text-foreground mb-2">
            {cellDate.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
          </div>

          {dayEvents.length > 0 ? (
            dayEvents.map((ev, ei) => {
              const completed = isCompleted(ev.type, ev.index);
              return (
                <div
                  key={ei}
                  className={`flex items-center gap-1.5 rounded border px-2 py-1.5 text-xs transition-colors ${
                    completed ? 'border-primary/30 bg-primary/5' : 'border-border bg-muted/30'
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${ev.color}`} />
                  <button
                    aria-label={completed ? 'Mark incomplete' : 'Mark complete'}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCompletion(ev.type, ev.index, dateStr);
                    }}
                    className="flex-shrink-0"
                  >
                    {completed ? (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground hover:text-primary" />
                    )}
                  </button>
                  {onViewItem && (
                    <button
                      aria-label="View details"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewItem(ev.group as any, ev.index);
                      }}
                      className="w-5 h-5 flex items-center justify-center rounded-full border border-border hover:border-primary hover:bg-primary/10 transition-colors flex-shrink-0"
                    >
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    </button>
                  )}
                  {ev.time && (
                    <span className="text-[10px] text-muted-foreground flex-shrink-0">{ev.time}</span>
                  )}
                  <span className={`truncate min-w-0 ${completed ? 'line-through opacity-60' : 'text-foreground'}`}>
                    {ev.title}
                  </span>
                </div>
              );
            })
          ) : inTrip ? (
            <div className="text-center py-3">
              <p className="text-xs text-muted-foreground mb-2">No plans for this day</p>
              <Button
                variant="outline"
                size="sm"
                onClick={onAddPlans}
                className="gap-1"
              >
                <Plus className="h-3 w-3" /> Add Plans
              </Button>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-2">Outside trip dates</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
