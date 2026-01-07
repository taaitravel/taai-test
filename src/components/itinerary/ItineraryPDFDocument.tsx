import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { ItineraryData } from '@/types/itinerary';
import { format } from 'date-fns';

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
    gap: 6,
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
  itemCard: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#ffce87',
  },
  itemTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1a1c2e',
    marginBottom: 4,
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
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 9,
    color: '#f59e0b',
    marginLeft: 4,
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

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return 'Not set';
  try {
    return format(new Date(dateStr), 'MMM d, yyyy');
  } catch {
    return dateStr;
  }
};

const formatCurrency = (amount: number | undefined | null) => {
  if (amount === undefined || amount === null) return '$0';
  return `$${amount.toLocaleString()}`;
};

export const ItineraryPDFDocument = ({ data }: ItineraryPDFDocumentProps) => {
  const destinations = data.itin_locations || [];
  const flights = data.flights || [];
  const hotels = data.hotels || [];
  const activities = data.activities || [];
  const reservations = data.reservations || [];
  const attendees = data.attendees || [];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            ✈️ {data.itin_name || 'Untitled Itinerary'}
          </Text>
          <Text style={styles.headerDates}>
            {formatDate(data.itin_date_start)} - {formatDate(data.itin_date_end)}
          </Text>
        </View>

        {/* Trip Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>📋 TRIP OVERVIEW</Text>
          <View style={styles.overviewGrid}>
            <View style={styles.overviewItem}>
              <Text style={styles.overviewLabel}>Total Budget</Text>
              <Text style={styles.overviewValue}>{formatCurrency(data.budget)}</Text>
            </View>
            <View style={styles.overviewItem}>
              <Text style={styles.overviewLabel}>Total Spending</Text>
              <Text style={styles.overviewValue}>{formatCurrency(data.spending)}</Text>
            </View>
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

        {/* Flights */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>✈️ FLIGHTS</Text>
          {flights.length === 0 ? (
            <Text style={styles.emptyState}>No flights added yet</Text>
          ) : (
            flights.map((flight, idx) => (
              <View key={idx} style={styles.itemCard}>
                <Text style={styles.itemTitle}>
                  {flight.airline} {flight.flight_number}
                </Text>
                <Text style={styles.flightRoute}>
                  {flight.from} → {flight.to}
                </Text>
                <View style={styles.itemDetails}>
                  <Text style={styles.itemDetail}>
                    Departure: {flight.departure}
                  </Text>
                  <Text style={styles.itemDetail}>
                    Arrival: {flight.arrival}
                  </Text>
                </View>
                <Text style={styles.itemPrice}>{formatCurrency(flight.cost)}</Text>
              </View>
            ))
          )}
        </View>

        {/* Hotels */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>🏨 ACCOMMODATIONS</Text>
          {hotels.length === 0 ? (
            <Text style={styles.emptyState}>No hotels added yet</Text>
          ) : (
            hotels.map((hotel, idx) => (
              <View key={idx} style={styles.itemCard}>
                <Text style={styles.itemTitle}>{hotel.name}</Text>
                <View style={styles.itemDetails}>
                  <Text style={styles.itemDetail}>📍 {hotel.city}</Text>
                  <Text style={styles.itemDetail}>
                    Check-in: {formatDate(hotel.check_in)}
                  </Text>
                  <Text style={styles.itemDetail}>
                    Check-out: {formatDate(hotel.check_out)}
                  </Text>
                  <Text style={styles.itemDetail}>{hotel.nights} nights</Text>
                  {hotel.rating && (
                    <Text style={styles.rating}>⭐ {hotel.rating}</Text>
                  )}
                </View>
                <Text style={styles.itemPrice}>{formatCurrency(hotel.cost || hotel.price)}</Text>
              </View>
            ))
          )}
        </View>

        {/* Activities */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>🎯 ACTIVITIES</Text>
          {activities.length === 0 ? (
            <Text style={styles.emptyState}>No activities added yet</Text>
          ) : (
            activities.map((activity, idx) => (
              <View key={idx} style={styles.itemCard}>
                <Text style={styles.itemTitle}>{activity.name}</Text>
                <View style={styles.itemDetails}>
                  <Text style={styles.itemDetail}>📍 {activity.city}</Text>
                  <Text style={styles.itemDetail}>📅 {formatDate(activity.date)}</Text>
                  <Text style={styles.itemDetail}>⏱️ {activity.duration}</Text>
                  {activity.rating && (
                    <Text style={styles.rating}>⭐ {activity.rating}</Text>
                  )}
                </View>
                <Text style={styles.itemPrice}>{formatCurrency(activity.cost || activity.price)}</Text>
              </View>
            ))
          )}
        </View>

        {/* Dining Reservations */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>🍽️ DINING RESERVATIONS</Text>
          {reservations.length === 0 ? (
            <Text style={styles.emptyState}>No reservations added yet</Text>
          ) : (
            reservations.map((reservation, idx) => (
              <View key={idx} style={styles.itemCard}>
                <Text style={styles.itemTitle}>{reservation.name}</Text>
                <View style={styles.itemDetails}>
                  <Text style={styles.itemDetail}>📍 {reservation.city}</Text>
                  <Text style={styles.itemDetail}>📅 {formatDate(reservation.date)}</Text>
                  <Text style={styles.itemDetail}>🕐 {reservation.time}</Text>
                  <Text style={styles.itemDetail}>👥 Party of {reservation.party_size}</Text>
                  {reservation.cuisine && (
                    <Text style={styles.itemDetail}>🍴 {reservation.cuisine}</Text>
                  )}
                </View>
              </View>
            ))
          )}
        </View>

        {/* Travelers */}
        {attendees.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>👥 TRAVELERS</Text>
            {attendees.map((attendee, idx) => (
              <View key={idx} style={styles.attendeeItem}>
                <Text style={styles.attendeeName}>{attendee.name}</Text>
                <Text style={styles.attendeeEmail}>{attendee.email}</Text>
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
                    {attendee.status}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Generated by TAAI Travel • {format(new Date(), 'MMMM d, yyyy')}
          </Text>
        </View>
      </Page>
    </Document>
  );
};
