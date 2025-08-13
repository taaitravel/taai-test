import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ItineraryData } from "@/types/itinerary";
interface DailyScheduleSectionProps {
  startDate: string;
  duration: number;
  destinations: string[];
  flights?: ItineraryData['flights'];
  hotels?: ItineraryData['hotels'];
  activities?: ItineraryData['activities'];
  reservations?: ItineraryData['reservations'];
  onViewItem?: (type: 'flights' | 'hotels' | 'activities' | 'reservations', index: number) => void;
}

export const DailyScheduleSection = ({
  startDate,
  duration,
  destinations,
  flights = [],
  hotels = [],
  activities = [],
  reservations = [],
  onViewItem,
}: DailyScheduleSectionProps) => {
  // Helpers for date handling (no assumptions beyond stored values)
  const toStartOfDay = (d: Date) => {
    const nd = new Date(d);
    nd.setHours(0, 0, 0, 0);
    return nd;
  };
  const toEndOfDay = (d: Date) => {
    const nd = new Date(d);
    nd.setHours(23, 59, 59, 999);
    return nd;
  };
  const safeDate = (val?: string) => {
    if (!val) return null;
    const dt = new Date(val);
    return isNaN(dt.getTime()) ? null : dt;
  };
  const fromDateTime = (dateStr?: string, timeStr?: string) => {
    if (!dateStr) return null;
    const dt = timeStr ? new Date(`${dateStr}T${timeStr}`) : new Date(dateStr);
    return isNaN(dt.getTime()) ? null : dt;
  };

type EventItem = {
  type: 'flight' | 'hotel-checkin' | 'hotel-checkout' | 'activity' | 'reservation';
  group: 'flights' | 'hotels' | 'activities' | 'reservations';
  index: number; // index within its group array
  title: string;
  subtitle?: string;
  datetime: Date | null;
};

  const buildEventsForDay = (day: Date): EventItem[] => {
    const start = toStartOfDay(day);
    const end = toEndOfDay(day);
    const inDay = (dt: Date | null) => !!dt && dt >= start && dt <= end;

const flightEvents: EventItem[] = (flights || []).map((f: any, idx: number) => {
  const dt = safeDate(f?.departure);
  const title = `Flight ${f?.flight_number || ''} ${f?.from || ''} → ${f?.to || ''}`.trim();
  const subtitle = f?.airline ? `${f.airline}` : undefined;
  return { type: 'flight' as const, group: 'flights', index: idx, title, subtitle, datetime: dt };
}).filter(e => inDay(e.datetime));

const hotelCheckin: EventItem[] = (hotels || []).map((h: any, idx: number) => {
  const dt = safeDate(h?.check_in);
  const title = `Hotel check-in: ${h?.name || ''}`.trim();
  const subtitle = h?.city ? `${h.city}` : undefined;
  return { type: 'hotel-checkin' as const, group: 'hotels', index: idx, title, subtitle, datetime: dt };
}).filter(e => inDay(e.datetime));

const hotelCheckout: EventItem[] = (hotels || []).map((h: any, idx: number) => {
  const dt = safeDate(h?.check_out);
  const title = `Hotel check-out: ${h?.name || ''}`.trim();
  const subtitle = h?.city ? `${h.city}` : undefined;
  return { type: 'hotel-checkout' as const, group: 'hotels', index: idx, title, subtitle, datetime: dt };
}).filter(e => inDay(e.datetime));

const activityEvents: EventItem[] = (activities || []).map((a: any, idx: number) => {
  const dt = safeDate(a?.date);
  const title = a?.name || 'Activity';
  const subtitle = a?.city ? `${a.city}` : undefined;
  return { type: 'activity' as const, group: 'activities', index: idx, title, subtitle, datetime: dt };
}).filter(e => inDay(e.datetime));

const reservationEvents: EventItem[] = (reservations || []).map((r: any, idx: number) => {
  const dt = fromDateTime(r?.date, r?.time);
  const title = `${r?.type || 'Reservation'}: ${r?.name || ''}`.trim();
  const subtitle = r?.city ? `${r.city}` : undefined;
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

  return (
    <div className="lg:col-span-2">
      <Card className="bg-[#171821]/80 border-white/30 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-white">Daily Schedule</CardTitle>
          <CardDescription className="text-white/70">
            Your day-by-day travel plan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: duration }, (_, index) => {
              const currentDate = new Date(startDate);
              currentDate.setDate(currentDate.getDate() + index);
              const destination = destinations[index % destinations.length];
              
              return (
                <div key={index} className="border-l-2 border-white/30 pl-4 pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-white">
                      Day {index + 1} - {currentDate.toLocaleDateString()}
                    </h4>
                    <Badge className="bg-white/20 text-white border-white/30">
                      {destination}
                    </Badge>
                  </div>
{(() => {
                    const events = buildEventsForDay(currentDate);
                    if (!events.length) return null;
                    return (
                      <div className="space-y-2">
                        {events.map((e, i) => (
                          <div key={i} className="rounded-md border border-white/20 p-3 bg-white/5">
<div className="flex items-center justify-between">
  <div className="flex items-center gap-2">
    <Badge className="bg-white/20 text-white border-white/30 capitalize">{e.type.replace('-', ' ')}</Badge>
    <span className="text-white font-medium">{e.title}</span>
  </div>
  <div className="flex items-center gap-2">
    {e.datetime && (
      <span className="text-xs text-white/70">
        {e.datetime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>
    )}
    {onViewItem && (
      <button
        aria-label="View details"
        onClick={() => onViewItem(e.group, e.index)}
        className="w-6 h-6 rounded-full border border-white/30 text-white/70 hover:bg-white/10 flex items-center justify-center"
      >
        •
      </button>
    )}
  </div>
</div>
{e.subtitle && <div className="text-xs text-white/70 mt-1">{e.subtitle}</div>}
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};