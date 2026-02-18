import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ItineraryData } from "@/types/itinerary";
import { getHoliday } from "@/lib/holidays";

interface ItineraryCalendarViewProps {
  startDate: string;
  duration: number;
  destinations: string[];
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
};

export const ItineraryCalendarView = ({
  startDate,
  duration,
  flights = [],
  hotels = [],
  activities = [],
  reservations = [],
  onViewItem,
}: ItineraryCalendarViewProps) => {
  const tripStart = new Date(startDate);
  const tripEnd = new Date(startDate);
  tripEnd.setDate(tripEnd.getDate() + duration - 1);

  const [viewMonth, setViewMonth] = useState(tripStart.getMonth());
  const [viewYear, setViewYear] = useState(tripStart.getFullYear());

  // Build a map of date string -> events
  const safeDate = (val?: string) => { if (!val) return null; const dt = new Date(val); return isNaN(dt.getTime()) ? null : dt; };

  const eventMap = new Map<string, CalendarEvent[]>();
  const addEvent = (dateKey: string, event: CalendarEvent) => {
    if (!eventMap.has(dateKey)) eventMap.set(dateKey, []);
    eventMap.get(dateKey)!.push(event);
  };

  const toKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

  (flights || []).forEach((f: any, idx: number) => {
    const dt = safeDate(f?.departure);
    if (dt) addEvent(toKey(dt), { type: 'flight', group: 'flights', index: idx, title: `✈ ${f?.flight_number || ''} ${f?.from || ''} → ${f?.to || ''}`, color: 'bg-rose-400/80' });
  });

  (hotels || []).forEach((h: any, idx: number) => {
    const ci = safeDate(h?.check_in);
    if (ci) addEvent(toKey(ci), { type: 'hotel', group: 'hotels', index: idx, title: `🏨 ${h?.name || ''} (in)`, color: 'bg-orange-400/80' });
    const co = safeDate(h?.check_out);
    if (co) addEvent(toKey(co), { type: 'hotel', group: 'hotels', index: idx, title: `🏨 ${h?.name || ''} (out)`, color: 'bg-orange-300/80' });
  });

  (activities || []).forEach((a: any, idx: number) => {
    const dt = safeDate(a?.date);
    if (dt) addEvent(toKey(dt), { type: 'activity', group: 'activities', index: idx, title: `🎯 ${a?.name || 'Activity'}`, color: 'bg-amber-400/80' });
  });

  (reservations || []).forEach((r: any, idx: number) => {
    const dt = r?.date ? safeDate(r.date) : null;
    if (dt) addEvent(toKey(dt), { type: 'reservation', group: 'reservations', index: idx, title: `🍽 ${r?.name || 'Reservation'}`, color: 'bg-sky-400/80' });
  });

  // Calendar grid
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
  const startDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const monthName = firstDayOfMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  const isTripDay = (d: Date) => {
    const t = new Date(d); t.setHours(0, 0, 0, 0);
    const s = new Date(tripStart); s.setHours(0, 0, 0, 0);
    const e = new Date(tripEnd); e.setHours(0, 0, 0, 0);
    return t >= s && t <= e;
  };

  const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <div className="lg:col-span-2">
      <Card className="bg-card/80 border-border backdrop-blur-md">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-foreground">Calendar View</CardTitle>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={prevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium text-foreground min-w-[140px] text-center">{monthName}</span>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {weekdays.map(wd => (
              <div key={wd} className="text-center text-[10px] font-medium text-muted-foreground py-1">
                {wd}
              </div>
            ))}
          </div>

          {/* Calendar cells */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells before first day */}
            {Array.from({ length: startDayOfWeek }, (_, i) => (
              <div key={`empty-${i}`} className="h-16" />
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const cellDate = new Date(viewYear, viewMonth, day);
              const key = toKey(cellDate);
              const dayEvents = eventMap.get(key) || [];
              const holiday = getHoliday(cellDate);
              const inTrip = isTripDay(cellDate);

              return (
                <Popover key={day}>
                  <PopoverTrigger asChild>
                    <button
                      className={`h-16 rounded-md border text-left p-1 transition-colors relative ${
                        inTrip
                          ? 'border-primary/30 bg-primary/5 hover:bg-primary/10'
                          : 'border-transparent hover:bg-muted/50'
                      }`}
                    >
                      <span className={`text-[11px] font-medium ${inTrip ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {day}
                      </span>
                      {holiday && (
                        <div className="text-[8px] text-primary truncate leading-tight">{holiday}</div>
                      )}
                      <div className="flex flex-wrap gap-0.5 mt-0.5">
                        {dayEvents.slice(0, 3).map((ev, ei) => (
                          <div key={ei} className={`w-1.5 h-1.5 rounded-full ${ev.color}`} />
                        ))}
                        {dayEvents.length > 3 && (
                          <span className="text-[8px] text-muted-foreground">+{dayEvents.length - 3}</span>
                        )}
                      </div>
                    </button>
                  </PopoverTrigger>
                  {dayEvents.length > 0 && (
                    <PopoverContent className="w-64 p-2" side="bottom" align="start">
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-foreground mb-1">
                          {cellDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                        </div>
                        {dayEvents.map((ev, ei) => (
                          <button
                            key={ei}
                            onClick={() => onViewItem?.(ev.group as any, ev.index)}
                            className="w-full text-left text-xs px-2 py-1 rounded hover:bg-muted/50 text-foreground truncate"
                          >
                            {ev.title}
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  )}
                </Popover>
              );
            })}
          </div>

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
