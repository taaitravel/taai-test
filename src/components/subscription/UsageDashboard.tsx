import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Map, Share2, Zap, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

interface UsageDashboardProps {
  userId: string;
  subscriptionData: {
    credits_remaining: number;
    max_itineraries: number;
    max_shared_friends: number;
  };
}

interface UsageMetrics {
  memberSince: string | null;
  itineraryCount: number;
  pdfExportCount: number;
  searchCount: number;
}

const UsageDashboard: React.FC<UsageDashboardProps> = ({ userId, subscriptionData }) => {
  const [metrics, setMetrics] = useState<UsageMetrics>({
    memberSince: null,
    itineraryCount: 0,
    pdfExportCount: 0,
    searchCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      const [itinRes, pdfRes, searchRes, userRes] = await Promise.all([
        supabase.from('itinerary').select('id', { count: 'exact', head: true }).eq('userid', userId),
        supabase.from('usage_tracking').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('usage_type', 'pdf_export'),
        supabase.from('search_history').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('users').select('created_at').eq('userid', userId).maybeSingle(),
      ]);

      setMetrics({
        memberSince: userRes.data?.created_at ?? null,
        itineraryCount: itinRes.count ?? 0,
        pdfExportCount: pdfRes.count ?? 0,
        searchCount: searchRes.count ?? 0,
      });
      setLoading(false);
    };

    fetchMetrics();
  }, [userId]);

  const creditCost = metrics.searchCount * 0.25;
  const maxItin = subscriptionData.max_itineraries;
  const maxSharing = subscriptionData.max_shared_friends;
  const maxCredits = subscriptionData.credits_remaining;

  const itinDelta = maxItin === -1 ? null : maxItin - metrics.itineraryCount;
  const sharingDelta = maxSharing === -1 ? null : maxSharing - metrics.pdfExportCount;
  const creditDelta = maxCredits - creditCost;

  const isOverAny = (itinDelta !== null && itinDelta < 0) || (sharingDelta !== null && sharingDelta < 0) || creditDelta < 0;

  const renderRow = (
    icon: React.ReactNode,
    label: string,
    used: number | string,
    allowed: number | string,
    delta: number | null,
    suffix?: string
  ) => (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-b-0">
      <div className="flex items-center gap-3">
        <div className="text-muted-foreground">{icon}</div>
        <span className="text-sm font-medium text-foreground">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">
          {used} / {allowed}{suffix ?? ''}
        </span>
        {delta !== null && (
          <Badge
            variant="secondary"
            className={`text-xs font-semibold ${
              delta < 0
                ? 'bg-destructive/20 text-destructive border-destructive/30'
                : 'bg-green-500/20 text-green-400 border-green-500/30'
            }`}
          >
            {delta > 0 ? `+${delta}` : delta}
          </Badge>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <Card className="p-6 bg-card border-border animate-pulse">
        <div className="h-40" />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-6 bg-card border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-foreground">Your Current Usage</h3>
          {metrics.memberSince && (
            <span className="text-xs text-muted-foreground">
              Member since {format(new Date(metrics.memberSince), 'MMMM yyyy')}
            </span>
          )}
        </div>

        {renderRow(
          <Map className="h-4 w-4" />,
          'Itineraries',
          metrics.itineraryCount,
          maxItin === -1 ? '∞' : maxItin,
          itinDelta
        )}
        {renderRow(
          <Share2 className="h-4 w-4" />,
          'Sharing (PDF Exports)',
          metrics.pdfExportCount,
          maxSharing === -1 ? '∞' : maxSharing,
          sharingDelta
        )}
        {renderRow(
          <Zap className="h-4 w-4" />,
          'Credit Utilization',
          creditCost.toFixed(2),
          maxCredits,
          Math.round(creditDelta * 100) / 100,
          ' credits'
        )}
      </Card>

      {isOverAny && (
        <Card className="p-4 bg-destructive/10 border-destructive/30 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">
            You have exceeded your plan limits. Itineraries over your limit will be removed at the end of each billing cycle.
          </p>
        </Card>
      )}
    </div>
  );
};

export default UsageDashboard;
