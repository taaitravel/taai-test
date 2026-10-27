import { useEffect, useState } from 'react';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useToast } from '@/hooks/use-toast';
import { ACCOUNT_CLOSURE_GRACE_DAYS, BILLING_RECORD_RETENTION_YEARS } from '../../../supabase/functions/_shared/account-policy';
import { ACCOUNT_NOTICE_KEY, accountClosureNotice } from '@/lib/auth/account-notice';

interface SharedTrip {
  id: number;
  name: string;
  successors: Array<{ userId: string; label: string }>;
}

const readError = async (error: unknown) => {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.clone().json();
      return body?.error || 'The request failed.';
    } catch {
      return 'The request failed.';
    }
  }
  return error instanceof Error ? error.message : 'The request failed.';
};

export const AccountSection = () => {
  const { user, signOut } = useAuth();
  const { subscriptionData, checkSubscription } = useSubscription();
  const { toast } = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<'close' | 'delete' | null>(null);
  const [sharedTrips, setSharedTrips] = useState<SharedTrip[]>([]);
  const [successors, setSuccessors] = useState<Record<number, string>>({});

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const load = async () => {
      const { data: trips } = await supabase
        .from('itinerary')
        .select('id, itin_name')
        .eq('userid', user.id);
      const rows = trips ?? [];
      if (rows.length === 0) {
        if (!cancelled) setSharedTrips([]);
        return;
      }
      const { data: members } = await supabase
        .from('itinerary_attendees')
        .select('itinerary_id, user_id, role, status')
        .in('itinerary_id', rows.map((trip) => trip.id))
        .eq('status', 'accepted');
      const shared = rows.filter((trip) =>
        (members ?? []).some((member) => member.itinerary_id === trip.id && member.user_id !== user.id && member.role !== 'owner'));
      const withNames = await Promise.all(shared.map(async (trip) => {
        const { data: profiles } = await supabase.rpc('get_itinerary_participant_profiles', {
          p_itinerary_id: trip.id,
        });
        const names = new Map<string, string>();
        for (const profile of profiles ?? []) {
          const label = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.username || 'Collaborator';
          names.set(profile.user_id, label);
        }
        const successors = (members ?? [])
          .filter((member) => member.itinerary_id === trip.id && member.user_id !== user.id && member.role !== 'owner')
          .map((member) => ({ userId: member.user_id, label: names.get(member.user_id) || 'Collaborator' }));
        return { id: trip.id, name: trip.itin_name || 'Untitled trip', successors };
      }));
      if (!cancelled) setSharedTrips(withNames);
    };
    load().catch(() => undefined);
    return () => { cancelled = true; };
  }, [user]);

  const invoke = async (name: string, body: Record<string, unknown> = {}) => {
    const { data, error } = await supabase.functions.invoke(name, { body });
    if (error) throw new Error(await readError(error));
    if (data?.error) throw new Error(String(data.error));
    return data;
  };

  const cancelAtPeriodEnd = async () => {
    setBusy('cancel');
    try {
      await invoke('cancel-subscription');
      await checkSubscription();
      toast({
        title: 'Cancellation scheduled',
        description: 'The software plan stays active until the period ends. Extra trips then become read-only.',
      });
    } catch (error) {
      toast({ title: 'Could not cancel', description: error instanceof Error ? error.message : 'Try again.', variant: 'destructive' });
    } finally {
      setBusy(null);
    }
  };

  const exportData = async () => {
    setBusy('export');
    try {
      const data = await invoke('export-account-data');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'taai-account-export.json';
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast({ title: 'Export failed', description: error instanceof Error ? error.message : 'Try again.', variant: 'destructive' });
    } finally {
      setBusy(null);
    }
  };

  const transfer = async (itineraryId: number) => {
    const successor = successors[itineraryId];
    if (!successor) return;
    setBusy(`transfer-${itineraryId}`);
    try {
      await invoke('transfer-itinerary-owner', { itinerary_id: itineraryId, successor_user_id: successor });
      setSharedTrips((current) => current.filter((trip) => trip.id !== itineraryId));
      toast({ title: 'Ownership transferred', description: 'The collaborator is now the owner of that trip.' });
    } catch (error) {
      toast({ title: 'Transfer failed', description: error instanceof Error ? error.message : 'Try again.', variant: 'destructive' });
    } finally {
      setBusy(null);
    }
  };

  const closeAccount = async (deleteNow: boolean) => {
    setBusy(deleteNow ? 'delete' : 'close');
    setConfirm(null);
    try {
      await invoke('close-account', { delete_now: deleteNow });
      sessionStorage.setItem(ACCOUNT_NOTICE_KEY, accountClosureNotice(deleteNow ? 'deleted' : 'closed'));
      await signOut();
    } catch (error) {
      toast({ title: 'Could not close the account', description: error instanceof Error ? error.message : 'Try again.', variant: 'destructive' });
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Software plan</CardTitle>
          <CardDescription>
            Cancel at the end of the current period. taai does not sell travel, so this does not cancel a flight, stay, or activity.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {subscriptionData?.cancel_at_period_end && (
            <p className="text-sm text-muted-foreground">
              This plan is set to end
              {subscriptionData.subscription_end ? ` on ${new Date(subscriptionData.subscription_end).toLocaleDateString()}` : ' when the current period ends'}.
              Trips beyond the three newest then become read-only.
            </p>
          )}
          <Button
            variant="outline"
            onClick={cancelAtPeriodEnd}
            disabled={busy !== null || !subscriptionData?.subscribed || subscriptionData.cancel_at_period_end}
          >
            {busy === 'cancel' ? 'Scheduling…' : 'Cancel at period end'}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Your data</CardTitle>
          <CardDescription>
            Download a copy of your profile, trip details, collaborator roles, software subscription, and Miles memory. Card numbers are not included.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={exportData} disabled={busy !== null}>
            {busy === 'export' ? 'Preparing…' : 'Download my data'}
          </Button>
        </CardContent>
      </Card>

      {sharedTrips.length > 0 && (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>Shared trips</CardTitle>
            <CardDescription>
              Give a shared trip to an accepted collaborator before you close the account. If you do not, the earliest accepted collaborator becomes the owner and a trip with no one else is deleted.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {sharedTrips.map((trip) => (
              <div key={trip.id} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <p className="min-w-0 flex-1 text-sm font-medium">{trip.name}</p>
                <Select value={successors[trip.id] ?? ''} onValueChange={(value) => setSuccessors((current) => ({ ...current, [trip.id]: value }))}>
                  <SelectTrigger className="sm:w-56">
                    <SelectValue placeholder="Choose a collaborator" />
                  </SelectTrigger>
                  <SelectContent>
                    {trip.successors.map((person) => (
                      <SelectItem key={person.userId} value={person.userId}>{person.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" disabled={!successors[trip.id] || busy !== null} onClick={() => transfer(trip.id)}>
                  {busy === `transfer-${trip.id}` ? 'Transferring…' : 'Transfer'}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Close account</CardTitle>
          <CardDescription>
            Closing cancels the software subscription immediately and signs you out. Sign in within {ACCOUNT_CLOSURE_GRACE_DAYS} days to reopen the account and export data. After that, files, Miles memory, and the login are deleted. Billing records stay, without your name, for {BILLING_RECORD_RETENTION_YEARS} years.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => setConfirm('close')} disabled={busy !== null}>
            Close account
          </Button>
          <Button variant="destructive" onClick={() => setConfirm('delete')} disabled={busy !== null}>
            Delete now
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={confirm !== null} onOpenChange={(open) => { if (!open) setConfirm(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm === 'delete' ? 'Delete this account now?' : 'Close this account?'}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirm === 'delete'
                ? `This cancels the software subscription, deletes files and Miles memory, and cannot be reopened. Shared trips move to the earliest accepted collaborator. Billing records stay unlinked for ${BILLING_RECORD_RETENTION_YEARS} years. taai does not sell travel.`
                : `You will be signed out. Sign in within ${ACCOUNT_CLOSURE_GRACE_DAYS} days to reopen the account. The software subscription is cancelled immediately. Shared trips stay with a collaborator.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep my account</AlertDialogCancel>
            <AlertDialogAction onClick={() => closeAccount(confirm === 'delete')}>
              {confirm === 'delete' ? 'Delete now' : 'Close account'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
