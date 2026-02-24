import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronRight, CheckCircle2, Circle, ExternalLink, Plane, Bed, MapPin, Utensils } from "lucide-react";
import { ItineraryData } from "@/types/itinerary";
import { getHoliday, formatDateByPreference, getAbbreviatedWeekday } from "@/lib/holidays";
import { useAuth } from "@/contexts/AuthContext";
import { useEventCompletions } from "@/hooks/useEventCompletions";

interface DailyScheduleSectionProps {
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

type EventItem = {
  type: 'flight' | 'hotel-checkin' | 'hotel-checkout' | 'activity' | 'reservation';
  group: string;
  index: number;
  title: string;
  subtitle?: string;
  datetime: Date | null;
};

export const DailyScheduleSection = ({
  startDate,
  duration,
  destinations,
  itineraryId,
  flights = [],
  hotels = [],
  activities = [],
  reservations = [],
  onViewItem,
}: DailyScheduleSectionProps) => {
  const { userProfile } = useAuth();
  const dateFormat = (userProfile as any)?.date_format || 'MM/DD/YY';
  const [openDays, setOpenDays] = useState<Record<number, boolean>>({});
  const { isCompleted, toggleCompletion, getCompletedCount } = useEventCompletions(itineraryId);

  const toStartOfDay = (d: Date) => { const nd = new Date(d); nd.setHours(0, 0, 0, 0); return nd; };
  const toEndOfDay = (d: Date) => { const nd = new Date(d); nd.setHours(23, 59, 59, 999); return nd; };
  const safeDate = (val?: string) => { if (!val) return null; const dt = new Date(val); return isNaN(dt.getTime()) ? null : dt; };
  const fromDateTime = (dateStr?: string, timeStr?: string) => {
    if (!dateStr) return null;
    const dt = timeStr ? new Date(`${dateStr}T${timeStr}`) : new Date(dateStr);
    return isNaN(dt.getTime()) ? null : dt;
  };

  const buildEventsForDay = (day: Date): EventItem[] => {
    const start = toStartOfDay(day);
    const end = toEndOfDay(day);
    const inDay = (dt: Date | null) => !!dt && dt >= start && dt <= end;

    const flightEvents: EventItem[] = (flights || []).map((f: any, idx: number) => {
      const dt = safeDate(f?.departure);
      const title = `✈ ${f?.flight_number || ''} ${f?.from || ''} → ${f?.to || ''}`.trim();
      const subtitle = f?.airline || undefined;
      return { type: 'flight' as const, group: 'flights', index: idx, title, subtitle, datetime: dt };
    }).filter(e => inDay(e.datetime));

    const hotelCheckin: EventItem[] = (hotels || []).map((h: any, idx: number) => {
      const dt = safeDate(h?.check_in);
      const title = `🏨 Check-in: ${h?.name || ''}`.trim();
      const subtitle = h?.city || undefined;
      return { type: 'hotel-checkin' as const, group: 'hotels', index: idx, title, subtitle, datetime: dt };
    }).filter(e => inDay(e.datetime));

    const hotelCheckout: EventItem[] = (hotels || []).map((h: any, idx: number) => {
      const dt = safeDate(h?.check_out);
      const title = `🏨 Check-out: ${h?.name || ''}`.trim();
      const subtitle = h?.city || undefined;
      return { type: 'hotel-checkout' as const, group: 'hotels', index: idx, title, subtitle, datetime: dt };
    }).filter(e => inDay(e.datetime));

    const activityEvents: EventItem[] = (activities || []).map((a: any, idx: number) => {
      const dt = safeDate(a?.date);
      const title = `🎯 ${a?.name || 'Activity'}`;
      const subtitle = a?.city || undefined;
      return { type: 'activity' as const, group: 'activities', index: idx, title, subtitle, datetime: dt };
    }).filter(e => inDay(e.datetime));

    const reservationEvents: EventItem[] = (reservations || []).map((r: any, idx: number) => {
      const dt = fromDateTime(r?.date, r?.time);
      const title = `🍽 ${r?.type || 'Reservation'}: ${r?.name || ''}`.trim();
      const subtitle = r?.city || undefined;
      return { type: 'reservation' as const, group: 'reservations', index: idx, title, subtitle, datetime: dt };
    }).filter(e => inDay(e.datetime));

    const all = [...flightEvents, ...hotelCheckin, ...hotelCheckout, ...activityEvents, ...reservationEvents];
    all.sort((a, b) => {
      const at = a.datetime ? a.datetime.getTime() : Number.POSITIVE_INFINITY;
      const bt = b.datetime ? b.datetime.getTime() : Number.POSITIVE_INFINITY;
      if (at !== bt) return at - bt;
      return a.title.localeCompare(b.title);
    });
    return all;
  };

  const toggleDay = (index: number) => {
    setOpenDays(prev => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div className="lg:col-span-2">
      <Card className="bg-card/80 border-border backdrop-blur-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-foreground">Daily Schedule</CardTitle>
          <CardDescription className="text-muted-foreground">
            Your day-by-day travel plan
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <ScrollArea className="h-[1100px] [&>div>div]:!block [&_[data-radix-scroll-area-scrollbar]]:hidden">
            <div className="divide-y divide-border">
              {Array.from({ length: duration }, (_, index) => {
                const currentDate = new Date(startDate);
                currentDate.setDate(currentDate.getDate() + index);
                const dayNumber = currentDate.getDate();
                const weekday = getAbbreviatedWeekday(currentDate);
                const formattedDate = formatDateByPreference(currentDate, dateFormat);
                const holiday = getHoliday(currentDate);
                const events = buildEventsForDay(currentDate);
                // Derive destination from booked events for this day
                const eventCities: string[] = [];
                events.forEach(e => {
                  if (e.type === 'flight') {
                    const flight = (flights || [])[e.index] as any;
                    if (flight?.to) eventCities.push(flight.to);
                    else if (flight?.from) eventCities.push(flight.from);
                  } else if (e.type === 'hotel-checkin' || e.type === 'hotel-checkout') {
                    const hotel = (hotels || [])[e.index] as any;
                    if (hotel?.city) eventCities.push(hotel.city);
                  } else if (e.type === 'activity') {
                    const activity = (activities || [])[e.index] as any;
                    if (activity?.city) eventCities.push(activity.city);
                  } else if (e.type === 'reservation') {
                    const reservation = (reservations || [])[e.index] as any;
                    if (reservation?.city) eventCities.push(reservation.city);
                  }
                });
                const uniqueCities = [...new Set(eventCities.filter(Boolean))];
                const destination = uniqueCities.length > 0
                  ? uniqueCities.join(', ')
                  : destinations[index % destinations.length];
                const hasEvents = events.length > 0;
                const isOpen = !!openDays[index];
                const dateStr = currentDate.toISOString().split('T')[0];

                // Completion progress
                const completedCount = hasEvents
                  ? getCompletedCount(events.map(e => ({ type: e.type, index: e.index })))
                  : 0;

                return (
                  <Collapsible
                    key={index}
                    open={isOpen}
                    onOpenChange={() => hasEvents && toggleDay(index)}
                  >
                    <CollapsibleTrigger
                      className={`w-full flex items-center gap-2 py-2 px-1 text-left transition-colors ${
                        hasEvents ? 'hover:bg-muted/50 cursor-pointer' : 'cursor-default'
                      }`}
                      disabled={!hasEvents}
                    >
                      <span className="flex-shrink-0 w-7 h-7 rounded-full border border-border flex items-center justify-center text-xs font-medium text-foreground">
                        {dayNumber}
                      </span>
                      <span className="text-xs text-muted-foreground w-5 flex-shrink-0 font-medium">
                        {weekday}
                      </span>
                      <span className="text-xs text-foreground font-medium min-w-[60px]">
                        {formattedDate}
                      </span>
                      {holiday && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-primary/10 text-primary border-primary/20">
                          {holiday}
                        </Badge>
                      )}
                      {hasEvents && (
                        <span className="text-[10px] text-muted-foreground">
                          {completedCount}/{events.length}
                        </span>
                      )}
                      <span className="flex-1" />
                      {hasEvents && (
                        <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 border-border flex items-center gap-0.5 flex-shrink-0">
                          {events.map((e, i) => {
                            const iconMap: Record<string, { Icon: typeof Plane; color: string }> = {
                              flight: { Icon: Plane, color: 'text-blue-500' },
                              'hotel-checkin': { Icon: Bed, color: 'text-purple-500' },
                              'hotel-checkout': { Icon: Bed, color: 'text-purple-400' },
                              activity: { Icon: MapPin, color: 'text-green-500' },
                              reservation: { Icon: Utensils, color: 'text-orange-500' },
                            };
                            const entry = iconMap[e.type];
                            if (!entry) return null;
                            return <entry.Icon key={i} className={`h-3 w-3 ${entry.color}`} />;
                          })}
                        </Badge>
                      )}
                      {hasEvents && (
                        <ChevronRight className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 flex-shrink-0 ${
                          isOpen ? 'rotate-90' : ''
                        }`} />
                      )}
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <div className="pl-10 pr-2 pb-2 space-y-1.5">
                        {events.map((e, i) => {
                          const completed = isCompleted(e.type, e.index);
                          return (
                            <div
                              key={i}
                              className={`flex items-center gap-2 rounded border px-2.5 py-1.5 text-sm transition-colors ${
                                completed
                                  ? 'border-primary/30 bg-primary/5'
                                  : 'border-border bg-muted/30'
                              }`}
                            >
                              <button
                                aria-label={completed ? 'Mark incomplete' : 'Mark complete'}
                                onClick={(ev) => {
                                  ev.stopPropagation();
                                  toggleCompletion(e.type, e.index, dateStr);
                                }}
                                className="flex-shrink-0 transition-colors"
                              >
                                {completed ? (
                                  <CheckCircle2 className="h-5 w-5 text-primary" />
                                ) : (
                                  <Circle className="h-5 w-5 text-muted-foreground hover:text-primary" />
                                )}
                              </button>
                              {onViewItem && (
                                <button
                                  aria-label="View details"
                                  onClick={(ev) => {
                                    ev.stopPropagation();
                                    onViewItem(e.group as any, e.index);
                                  }}
                                  className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full border border-border hover:border-primary hover:bg-primary/10 transition-colors"
                                >
                                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                                </button>
                              )}
                              {e.datetime && (
                                <span className="flex-shrink-0 text-[10px] text-muted-foreground">
                                  {e.datetime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                              <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
                                <span className={`text-foreground truncate text-xs sm:text-sm ${completed ? 'line-through opacity-60' : ''}`}>
                                  {e.title}
                                </span>
                                {e.subtitle && (
                                  <span className="text-[10px] text-muted-foreground truncate">
                                    {e.subtitle}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
