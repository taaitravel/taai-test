import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  MapPin, 
  Calendar,
  BarChart3,
  PieChart,
  RefreshCw
} from 'lucide-react';
import { BusinessMetrics } from '@/types/enhanced-itinerary';

interface BusinessMetricsDashboardProps {
  className?: string;
}

export const BusinessMetricsDashboard: React.FC<BusinessMetricsDashboardProps> = ({ className }) => {
  const [metrics, setMetrics] = useState<BusinessMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'quarter'>('month');

  // Mock business metrics data
  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      
      // Simulate API call with mock data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockMetrics: BusinessMetrics = {
        total_bookings: 247,
        total_revenue: 156750,
        total_commissions: 15675,
        conversion_rate: 23.5,
        avg_booking_value: 635,
        popular_destinations: [
          { city: "Miami", count: 45, revenue: 28500 },
          { city: "New York", count: 38, revenue: 24200 },
          { city: "Los Angeles", count: 32, revenue: 19800 },
          { city: "London", count: 28, revenue: 22400 },
          { city: "Paris", count: 25, revenue: 18900 }
        ],
        booking_trends: [
          { date: "2024-01-01", count: 12, revenue: 7800 },
          { date: "2024-01-02", count: 15, revenue: 9200 },
          { date: "2024-01-03", count: 18, revenue: 11400 },
          { date: "2024-01-04", count: 22, revenue: 14100 },
          { date: "2024-01-05", count: 25, revenue: 15800 }
        ]
      };
      
      setMetrics(mockMetrics);
      setLoading(false);
    };

    fetchMetrics();
  }, [timeframe]);

  const refreshData = () => {
    setMetrics(null);
    setLoading(true);
    // Trigger refresh
    setTimeout(() => {
      setLoading(false);
      window.location.reload();
    }, 500);
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Business Analytics</h2>
          <div className="animate-spin">
            <RefreshCw className="h-5 w-5 text-white/60" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="trip-card-past">
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-white/20 rounded w-3/4"></div>
                  <div className="h-8 bg-white/20 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Business Analytics</h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {(['week', 'month', 'quarter'] as const).map((period) => (
              <Button
                key={period}
                variant={timeframe === period ? "default" : "ghost"}
                size="sm"
                onClick={() => setTimeframe(period)}
                className="text-xs"
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </Button>
            ))}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={refreshData}
            className="text-white/80 hover:text-white"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="trip-card-past">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/80">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              ${metrics.total_revenue.toLocaleString()}
            </div>
            <p className="text-xs text-white/60">
              +12.5% from last {timeframe}
            </p>
          </CardContent>
        </Card>

        <Card className="trip-card-past">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/80">Commissions Earned</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              ${metrics.total_commissions.toLocaleString()}
            </div>
            <p className="text-xs text-white/60">
              {((metrics.total_commissions / metrics.total_revenue) * 100).toFixed(1)}% commission rate
            </p>
          </CardContent>
        </Card>

        <Card className="trip-card-past">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/80">Total Bookings</CardTitle>
            <Users className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {metrics.total_bookings}
            </div>
            <p className="text-xs text-white/60">
              {metrics.conversion_rate}% conversion rate
            </p>
          </CardContent>
        </Card>

        <Card className="trip-card-past">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/80">Avg Booking Value</CardTitle>
            <BarChart3 className="h-4 w-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              ${metrics.avg_booking_value}
            </div>
            <p className="text-xs text-white/60">
              +8.3% from last {timeframe}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Popular Destinations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="trip-card-past">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Popular Destinations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.popular_destinations.map((destination, index) => (
                <div key={destination.city} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center text-xs">
                      {index + 1}
                    </Badge>
                    <div>
                      <p className="font-medium text-white">{destination.city}</p>
                      <p className="text-sm text-white/60">{destination.count} bookings</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-white">${destination.revenue.toLocaleString()}</p>
                    <p className="text-sm text-white/60">revenue</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="trip-card-past">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Recent Booking Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.booking_trends.slice(-5).map((trend, index) => (
                <div key={trend.date} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">
                      {new Date(trend.date).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-white/60">{trend.count} bookings</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-white">${trend.revenue.toLocaleString()}</p>
                    <p className="text-sm text-white/60">revenue</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Summary */}
      <Card className="trip-card-past">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Performance Summary - {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">
                {metrics.conversion_rate}%
              </div>
              <p className="text-sm text-white/60">Conversion Rate</p>
              <p className="text-xs text-white/40 mt-1">Searches to bookings</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">
                ${(metrics.total_revenue / metrics.total_bookings).toFixed(0)}
              </div>
              <p className="text-sm text-white/60">Revenue per Booking</p>
              <p className="text-xs text-white/40 mt-1">Average transaction</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">
                {((metrics.total_commissions / metrics.total_revenue) * 100).toFixed(1)}%
              </div>
              <p className="text-sm text-white/60">Commission Rate</p>
              <p className="text-xs text-white/40 mt-1">Average margin</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};