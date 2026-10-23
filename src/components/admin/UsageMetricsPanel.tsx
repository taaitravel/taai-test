import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface MetricsUser {
  user_id: string;
  email: string | null;
  tier: string;
  signup_source: string | null;
  last_active_at: string | null;
  trips: number;
  ai_credits_used: number;
  ai_messages: number;
  searches: number;
  near_limit: boolean;
}

interface Metrics {
  users_by_tier: Record<string, number>;
  active_users_30d: number;
  trips_total: number;
  users: MetricsUser[];
  power_users: MetricsUser[];
}

export const UsageMetricsPanel = () => {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase.functions.invoke('admin-metrics', { body: {} }).then(({ data, error: invokeError }) => {
      if (cancelled) return;
      if (invokeError || !data) {
        setError('Usage metrics load after the admin-metrics function is deployed.');
        return;
      }
      setMetrics(data as Metrics);
    });
    return () => { cancelled = true; };
  }, []);

  if (error) return <Card><CardContent className="py-6 text-sm text-muted-foreground">{error}</CardContent></Card>;
  if (!metrics) return <Card><CardContent className="py-6 text-sm text-muted-foreground">Loading usage…</CardContent></Card>;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <Card><CardHeader><CardTitle className="text-sm">Active in 30 days</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{metrics.active_users_30d}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Trips</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{metrics.trips_total}</CardContent></Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Users by plan</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            {Object.entries(metrics.users_by_tier).map(([tier, count]) => (
              <p key={tier}>{tier}: {count}</p>
            ))}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Near a limit</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {metrics.power_users.length === 0 && <p className="text-sm text-muted-foreground">No one is close to a trip or credit limit.</p>}
          {metrics.power_users.map((user) => (
            <div key={user.user_id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span>{user.email}</span>
              <span>{user.trips} trips · {user.ai_credits_used} credits · {user.tier}</span>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Usage</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-muted-foreground">
                <th className="py-2">Email</th><th>Plan</th><th>Source</th><th>Trips</th><th>Credits</th><th>Searches</th><th>Last active</th>
              </tr>
            </thead>
            <tbody>
              {metrics.users.slice(0, 50).map((user) => (
                <tr key={user.user_id} className="border-t border-border">
                  <td className="py-2">{user.email}</td>
                  <td>{user.tier}{user.near_limit && <Badge className="ml-2" variant="outline">Near limit</Badge>}</td>
                  <td>{user.signup_source || '—'}</td>
                  <td>{user.trips}</td>
                  <td>{user.ai_credits_used}</td>
                  <td>{user.searches}</td>
                  <td>{user.last_active_at ? new Date(user.last_active_at).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
};
