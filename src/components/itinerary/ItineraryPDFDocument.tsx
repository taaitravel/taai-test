import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { ItineraryData } from '@/types/itinerary';
import { format } from 'date-fns';

// Type colors for left borders and badges
const TYPE_COLORS = {
  flight: '#3b82f6',
  hotel: '#8b5cf6',
  activity: '#f59e0b',
  reservation: '#22c55e',
};

// Define styles for the PDF
const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
  },
  header: {
    backgroundColor: '#1a1c2e',
    padding: 24,
    marginBottom: 24,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerDates: {
    fontSize: 12,
    color: '#ffce87',
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a1c2e',
    marginBottom: 12,
    paddingBottom: 6,
    borderBottomWidth: 2,
    borderBottomColor: '#ffce87',
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  overviewItem: {
    width: '50%',
    marginBottom: 8,
  },
  overviewLabel: {
    fontSize: 9,
    color: '#666666',
    marginBottom: 2,
  },
  overviewValue: {
    fontSize: 11,
    color: '#1a1c2e',
    fontWeight: 'bold',
  },
  destinationsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  destinationBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 6,
    marginBottom: 4,
  },
  destinationText: {
    fontSize: 10,
    color: '#1a1c2e',
  },
  // Budget chart styles
  budgetSection: {
    marginBottom: 20,
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 6,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  budgetStat: {
    alignItems: 'center',
  },
  budgetStatLabel: {
    fontSize: 8,
    color: '#666666',
    marginBottom: 2,
  },
  budgetStatValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1a1c2e',
  },
  budgetBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  budgetBarLabel: {
    fontSize: 9,
    color: '#1a1c2e',
    width: 80,
  },
  budgetBarContainer: {
    flex: 1,
    height: 12,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginRight: 8,
    overflow: 'hidden',
  },
  budgetBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  budgetBarAmount: {
    fontSize: 8,
    color: '#666666',
    width: 70,
    textAlign: 'right',
  },
  // Timeline styles
  dateHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1a1c2e',
    backgroundColor: '#f3f4f6',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
    marginBottom: 8,
    marginTop: 12,
  },
  itemCard: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  itemCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1a1c2e',
    flex: 1,
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  typeBadgeText: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  itemDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  itemDetail: {
    fontSize: 9,
    color: '#666666',
    marginRight: 12,
    marginBottom: 2,
  },
  itemPrice: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#22c55e',
    marginTop: 4,
  },
  flightRoute: {
    fontSize: 11,
    color: '#1a1c2e',
    marginBottom: 4,
  },
  attendeeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  attendeeName: {
    fontSize: 11,
    color: '#1a1c2e',
    flex: 1,
  },
  attendeeEmail: {
    fontSize: 9,
    color: '#666666',
  },
  attendeeStatus: {
    fontSize: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 12,
  },
  footerText: {
    fontSize: 9,
    color: '#9ca3af',
  },
  emptyState: {
    fontSize: 10,
    color: '#9ca3af',
    fontStyle: 'italic',
    padding: 8,
  },
});

interface ItineraryPDFDocumentProps {
  data: ItineraryData;
}

// Helper functions
const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return 'Not set';
  try {
    return format(new Date(dateStr), 'MMM d, yyyy');
  } catch {
    return String(dateStr);
  }
};

const formatShortDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return 'Not set';
  try {
    return format(new Date(dateStr), 'EEEE, MMMM d, yyyy');
  } catch {
    return String(dateStr);
  }
};

const formatCurrency = (amount: number | undefined | null): string => {
  if (amount === undefined || amount === null || isNaN(amount)) return '$0';
  return `$${Number(amount).toLocaleString()}`;
};

const getItemDate = (item: any, type: string): Date => {
  try {
    switch (type) {
      case 'flight':
        return new Date(item.departure || item.date || '2099-12-31');
      case 'hotel':
        return new Date(item.check_in || item.date || '2099-12-31');
      case 'activity':
        return new Date(item.date || '2099-12-31');
      case 'reservation':
        return new Date(item.date || '2099-12-31');
      default:
        return new Date('2099-12-31');
    }
  } catch {
    return new Date('2099-12-31');
  }
};

const getDateKey = (date: Date): string => {
  try {
    return format(date, 'yyyy-MM-dd');
  } catch {
    return 'unknown';
  }
};

interface TimelineItem {
  type: 'flight' | 'hotel' | 'activity' | 'reservation';
  sortDate: Date;
  data: any;
}

// Budget Chart Component
const BudgetChart = ({ data }: { data: ItineraryData }) => {
  const flights = data.flights || [];
  const hotels = data.hotels || [];
  const activities = data.activities || [];
  const reservations = data.reservations || [];

  // Calculate spending by category
  const flightSpending = flights.reduce((sum, f) => sum + (f.cost || 0), 0);
  const hotelSpending = hotels.reduce((sum, h) => sum + (h.cost || h.price || 0), 0);
  const activitySpending = activities.reduce((sum, a) => sum + (a.cost || a.price || 0), 0);
  const diningSpending = reservations.reduce((sum, r) => sum + ((r as any).cost || 0), 0);

  const totalSpending = flightSpending + hotelSpending + activitySpending + diningSpending;
  const budget = data.budget || totalSpending || 1;
  const remaining = Math.max(0, budget - totalSpending);

  const categories = [
    { label: 'Flights', amount: flightSpending, color: TYPE_COLORS.flight },
    { label: 'Hotels', amount: hotelSpending, color: TYPE_COLORS.hotel },
    { label: 'Activities', amount: activitySpending, color: TYPE_COLORS.activity },
    { label: 'Dining', amount: diningSpending, color: TYPE_COLORS.reservation },
  ];

  return (
    <View style={styles.budgetSection}>
      <Text style={[styles.sectionHeader, { marginBottom: 8, borderBottomWidth: 0 }]}>
        BUDGET BREAKDOWN
      </Text>
      
      {/* Budget summary */}
      <View style={styles.budgetHeader}>
        <View style={styles.budgetStat}>
          <Text style={styles.budgetStatLabel}>Total Budget</Text>
          <Text style={styles.budgetStatValue}>{formatCurrency(budget)}</Text>
        </View>
        <View style={styles.budgetStat}>
          <Text style={styles.budgetStatLabel}>Total Spent</Text>
          <Text style={[styles.budgetStatValue, { color: '#22c55e' }]}>{formatCurrency(totalSpending)}</Text>
        </View>
        <View style={styles.budgetStat}>
          <Text style={styles.budgetStatLabel}>Remaining</Text>
          <Text style={[styles.budgetStatValue, { color: remaining > 0 ? '#22c55e' : '#ef4444' }]}>
            {formatCurrency(remaining)}
          </Text>
        </View>
      </View>

      {/* Category bars */}
      {categories.map((cat, idx) => {
        const percentage = budget > 0 ? Math.min((cat.amount / budget) * 100, 100) : 0;
        return (
          <View key={idx} style={styles.budgetBarRow}>
            <Text style={styles.budgetBarLabel}>{cat.label}</Text>
            <View style={styles.budgetBarContainer}>
              <View
                style={[
                  styles.budgetBarFill,
                  { width: `${percentage}%`, backgroundColor: cat.color },
                ]}
              />
            </View>
            <Text style={styles.budgetBarAmount}>
              {formatCurrency(cat.amount)} ({Math.round(percentage)}%)
            </Text>
          </View>
        );
      })}
    </View>
  );
};

// Item Card Components
const FlightCard = ({ flight }: { flight: any }) => (
  <View style={[styles.itemCard, { borderLeftColor: TYPE_COLORS.flight }]}>
    <View style={styles.itemCardHeader}>
      <Text style={styles.itemTitle}>
        {flight.airline || 'Flight'} {flight.flight_number || ''}
      </Text>
      <View style={[styles.typeBadge, { backgroundColor: TYPE_COLORS.flight }]}>
        <Text style={styles.typeBadgeText}>FLIGHT</Text>
      </View>
    </View>
    <Text style={styles.flightRoute}>
      {flight.from || 'Origin'} to {flight.to || 'Destination'}
    </Text>
    <View style={styles.itemDetails}>
      <Text style={styles.itemDetail}>Departure: {flight.departure || 'Not set'}</Text>
      <Text style={styles.itemDetail}>Arrival: {flight.arrival || 'Not set'}</Text>
    </View>
    {(flight.cost > 0) && <Text style={styles.itemPrice}>{formatCurrency(flight.cost)}</Text>}
  </View>
);

const HotelCard = ({ hotel }: { hotel: any }) => (
  <View style={[styles.itemCard, { borderLeftColor: TYPE_COLORS.hotel }]}>
    <View style={styles.itemCardHeader}>
      <Text style={styles.itemTitle}>{hotel.name || 'Hotel'}</Text>
      <View style={[styles.typeBadge, { backgroundColor: TYPE_COLORS.hotel }]}>
        <Text style={styles.typeBadgeText}>HOTEL</Text>
      </View>
    </View>
    <View style={styles.itemDetails}>
      <Text style={styles.itemDetail}>Location: {hotel.city || hotel.location || 'Not set'}</Text>
      <Text style={styles.itemDetail}>Check-in: {formatDate(hotel.check_in)}</Text>
      <Text style={styles.itemDetail}>Check-out: {formatDate(hotel.check_out)}</Text>
      {hotel.nights > 0 && <Text style={styles.itemDetail}>{hotel.nights} nights</Text>}
      {hotel.rating > 0 && <Text style={styles.itemDetail}>Rating: {hotel.rating}/10</Text>}
    </View>
    {(hotel.cost > 0 || hotel.price > 0) && (
      <Text style={styles.itemPrice}>{formatCurrency(hotel.cost || hotel.price)}</Text>
    )}
  </View>
);

const ActivityCard = ({ activity }: { activity: any }) => (
  <View style={[styles.itemCard, { borderLeftColor: TYPE_COLORS.activity }]}>
    <View style={styles.itemCardHeader}>
      <Text style={styles.itemTitle}>{activity.name || 'Activity'}</Text>
      <View style={[styles.typeBadge, { backgroundColor: TYPE_COLORS.activity }]}>
        <Text style={styles.typeBadgeText}>ACTIVITY</Text>
      </View>
    </View>
    <View style={styles.itemDetails}>
      <Text style={styles.itemDetail}>Location: {activity.city || activity.location || 'Not set'}</Text>
      <Text style={styles.itemDetail}>Date: {formatDate(activity.date)}</Text>
      {activity.duration && <Text style={styles.itemDetail}>Duration: {activity.duration}</Text>}
      {activity.rating > 0 && <Text style={styles.itemDetail}>Rating: {activity.rating}/5</Text>}
    </View>
    {(activity.cost > 0 || activity.price > 0) && (
      <Text style={styles.itemPrice}>{formatCurrency(activity.cost || activity.price)}</Text>
    )}
  </View>
);

const ReservationCard = ({ reservation }: { reservation: any }) => (
  <View style={[styles.itemCard, { borderLeftColor: TYPE_COLORS.reservation }]}>
    <View style={styles.itemCardHeader}>
      <Text style={styles.itemTitle}>{reservation.name || 'Restaurant'}</Text>
      <View style={[styles.typeBadge, { backgroundColor: TYPE_COLORS.reservation }]}>
        <Text style={styles.typeBadgeText}>DINING</Text>
      </View>
    </View>
    <View style={styles.itemDetails}>
      <Text style={styles.itemDetail}>Location: {reservation.city || reservation.location || 'Not set'}</Text>
      <Text style={styles.itemDetail}>Date: {formatDate(reservation.date)}</Text>
      {reservation.time && <Text style={styles.itemDetail}>Time: {reservation.time}</Text>}
      {reservation.party_size > 0 && <Text style={styles.itemDetail}>Party of {reservation.party_size}</Text>}
      {reservation.cuisine && <Text style={styles.itemDetail}>Cuisine: {reservation.cuisine}</Text>}
    </View>
  </View>
);

export const ItineraryPDFDocument = ({ data }: ItineraryPDFDocumentProps) => {
  const destinations = data.itin_locations || [];
  const flights = data.flights || [];
  const hotels = data.hotels || [];
  const activities = data.activities || [];
  const reservations = data.reservations || [];
  const attendees = data.attendees || [];

  // Create timeline items and sort chronologically
  const timelineItems: TimelineItem[] = [
    ...flights.map((f) => ({ type: 'flight' as const, sortDate: getItemDate(f, 'flight'), data: f })),
    ...hotels.map((h) => ({ type: 'hotel' as const, sortDate: getItemDate(h, 'hotel'), data: h })),
    ...activities.map((a) => ({ type: 'activity' as const, sortDate: getItemDate(a, 'activity'), data: a })),
    ...reservations.map((r) => ({ type: 'reservation' as const, sortDate: getItemDate(r, 'reservation'), data: r })),
  ].sort((a, b) => a.sortDate.getTime() - b.sortDate.getTime());

  // Group items by date
  const groupedByDate: Record<string, TimelineItem[]> = {};
  timelineItems.forEach((item) => {
    const key = getDateKey(item.sortDate);
    if (!groupedByDate[key]) {
      groupedByDate[key] = [];
    }
    groupedByDate[key].push(item);
  });

  const sortedDateKeys = Object.keys(groupedByDate).sort();

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {data.itin_name || 'Untitled Itinerary'}
          </Text>
          <Text style={styles.headerDates}>
            {formatDate(data.itin_date_start)} - {formatDate(data.itin_date_end)}
          </Text>
        </View>

        {/* Trip Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>TRIP OVERVIEW</Text>
          <View style={styles.overviewGrid}>
            <View style={styles.overviewItem}>
              <Text style={styles.overviewLabel}>Travelers</Text>
              <Text style={styles.overviewValue}>{attendees.length || 1} people</Text>
            </View>
            <View style={styles.overviewItem}>
              <Text style={styles.overviewLabel}>Destinations</Text>
              <Text style={styles.overviewValue}>{destinations.length} cities</Text>
            </View>
          </View>
          
          {destinations.length > 0 && (
            <View style={styles.destinationsList}>
              {destinations.map((dest, idx) => (
                <View key={idx} style={styles.destinationBadge}>
                  <Text style={styles.destinationText}>{dest}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Budget Chart */}
        <BudgetChart data={data} />

        {/* Day-by-Day Itinerary */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>DAY-BY-DAY ITINERARY</Text>
          
          {timelineItems.length === 0 ? (
            <Text style={styles.emptyState}>No items added to this itinerary yet</Text>
          ) : (
            sortedDateKeys.map((dateKey) => (
              <View key={dateKey}>
                <Text style={styles.dateHeader}>
                  {formatShortDate(dateKey)}
                </Text>
                {groupedByDate[dateKey].map((item, idx) => {
                  switch (item.type) {
                    case 'flight':
                      return <FlightCard key={`f-${idx}`} flight={item.data} />;
                    case 'hotel':
                      return <HotelCard key={`h-${idx}`} hotel={item.data} />;
                    case 'activity':
                      return <ActivityCard key={`a-${idx}`} activity={item.data} />;
                    case 'reservation':
                      return <ReservationCard key={`r-${idx}`} reservation={item.data} />;
                    default:
                      return null;
                  }
                })}
              </View>
            ))
          )}
        </View>

        {/* Travelers */}
        {attendees.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>TRAVELERS</Text>
            {attendees.map((attendee, idx) => (
              <View key={idx} style={styles.attendeeItem}>
                <Text style={styles.attendeeName}>{attendee.name || 'Guest'}</Text>
                <Text style={styles.attendeeEmail}>{attendee.email || ''}</Text>
                <View
                  style={[
                    styles.attendeeStatus,
                    {
                      backgroundColor:
                        attendee.status === 'confirmed'
                          ? '#dcfce7'
                          : attendee.status === 'pending'
                          ? '#fef9c3'
                          : '#f3f4f6',
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 8,
                      color:
                        attendee.status === 'confirmed'
                          ? '#166534'
                          : attendee.status === 'pending'
                          ? '#854d0e'
                          : '#6b7280',
                    }}
                  >
                    {attendee.status || 'pending'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Generated by TAAI Travel | {format(new Date(), 'MMMM d, yyyy')}
          </Text>
        </View>
      </Page>
    </Document>
  );
};
