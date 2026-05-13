import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Users, Shield, Edit, UserMinus, Check, MoreHorizontal, Wallet } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useItineraryAttendees } from "@/hooks/useItineraryAttendees";
import { useTripBalances } from "@/hooks/useTripBalances";
import { useTripSpending } from "@/hooks/useTripSpending";
import { InviteAttendeesDialog } from "./InviteAttendeesDialog";

interface Props {
  itineraryId: number;
}

const fmt = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const TripPeopleAndBalances: React.FC<Props> = ({ itineraryId }) => {
  const { user } = useAuth();
  const { attendees, loading: aLoading, isOwner, removeAttendee } = useItineraryAttendees(itineraryId);
  const { balances, loading: bLoading, markSettledOffPlatform } = useTripBalances(itineraryId);
  const { totals, tripTotal } = useTripSpending(itineraryId);
  const [busy, setBusy] = useState<string | null>(null);

  // Net open amount between viewer and a given user (positive = they owe you)
  const netVsMe = useMemo(() => {
    const map = new Map<string, { amount: number; ids: string[] }>();
    if (!user?.id) return map;
    balances
      .filter((b) => b.status === "open")
      .forEach((b) => {
        let other: string | null = null;
        let signed = 0;
        if (b.creditor_user_id === user.id) {
          other = b.debtor_user_id;
          signed = b.amount;
        } else if (b.debtor_user_id === user.id) {
          other = b.creditor_user_id;
          signed = -b.amount;
        }
        if (!other) return;
        const cur = map.get(other) || { amount: 0, ids: [] };
        cur.amount += signed;
        cur.ids.push(b.id);
        map.set(other, cur);
      });
    return map;
  }, [balances, user?.id]);

  const settledHistory = balances.filter((b) => b.status !== "open").slice(0, 12);

  if (aLoading) return null;

  return (
    <Card className="bg-card/80 border-border backdrop-blur-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-foreground flex items-center gap-2">
            <Users className="h-5 w-5" />
            <span>Trip people &amp; balances ({attendees.length})</span>
          </CardTitle>
          {isOwner && <InviteAttendeesDialog itineraryId={itineraryId} />}
        </div>
        {tripTotal > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            Trip total split so far: <span className="font-semibold text-foreground">{fmt(tripTotal)}</span>
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {attendees.map((a) => {
          const isMe = a.user_id === user?.id;
          const profile = a.profile;
          const userName = profile?.first_name
            ? `${profile.first_name} ${profile.last_name || ""}`.trim()
            : profile?.username || "Unknown";
          const initials = userName
            .split(" ")
            .map((n) => n[0])
            .filter(Boolean)
            .join("")
            .toUpperCase()
            .slice(0, 2);

          const spend = totals.get(a.user_id) || { amount: 0, pct: 0 };
          const net = netVsMe.get(a.user_id);
          const isAttendeeOwner = a.role === "owner";

          return (
            <div
              key={a.id}
              className="flex flex-col md:flex-row md:items-center gap-3 p-3 bg-muted/60 rounded-lg border border-border hover:bg-accent transition-colors"
            >
              {/* Identity */}
              <div className="flex items-center gap-3 min-w-0 md:w-64">
                <Avatar className="h-10 w-10 shrink-0">
                  {profile?.avatar_url && <AvatarImage src={profile.avatar_url} />}
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                    {initials || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-medium text-foreground text-sm truncate">
                    {userName} {isMe && <span className="text-muted-foreground">(you)</span>}
                  </p>
                  {profile?.username && (
                    <p className="text-xs text-muted-foreground truncate">@{profile.username}</p>
                  )}
                </div>
              </div>

              {/* Role */}
              <div className="md:w-32">
                <Badge
                  className={`gap-1 text-xs px-2 py-0.5 ${
                    isAttendeeOwner
                      ? "bg-yellow-500/20 text-yellow-500 border-yellow-500/30"
                      : "bg-blue-500/20 text-blue-500 border-blue-500/30"
                  }`}
                >
                  {isAttendeeOwner ? <Shield className="h-3 w-3" /> : <Edit className="h-3 w-3" />}
                  {isAttendeeOwner ? "Owner" : "Collaborator"}
                </Badge>
              </div>

              {/* Spending */}
              <div className="md:flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-semibold tabular-nums text-foreground">
                    {fmt(spend.amount)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {spend.pct.toFixed(0)}% of trip
                  </span>
                </div>
              </div>

              {/* Balance vs me */}
              <div className="flex items-center gap-2 md:w-72 justify-start md:justify-end">
                {!isMe && net && Math.abs(net.amount) > 0.005 ? (
                  <>
                    <span className="text-xs text-muted-foreground">
                      {net.amount > 0 ? "Owes you" : "You owe"}
                    </span>
                    <span
                      className={`text-sm font-semibold tabular-nums ${
                        net.amount > 0 ? "text-emerald-500" : "text-rose-500"
                      }`}
                    >
                      {fmt(Math.abs(net.amount))}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      disabled={busy !== null || bLoading}
                      onClick={async () => {
                        setBusy(a.user_id);
                        for (const id of net.ids) await markSettledOffPlatform(id);
                        setBusy(null);
                      }}
                    >
                      <Check className="h-3 w-3 mr-1" /> Settle
                    </Button>
                  </>
                ) : !isMe ? (
                  <span className="text-xs text-muted-foreground">Settled</span>
                ) : null}

                {!isAttendeeOwner && isOwner && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-card border-border">
                      <DropdownMenuItem
                        onClick={() => removeAttendee(a.id)}
                        className="text-destructive cursor-pointer"
                      >
                        <UserMinus className="h-4 w-4 mr-2" />
                        Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          );
        })}

        {settledHistory.length > 0 && (
          <details className="pt-3 border-t border-border">
            <summary className="cursor-pointer text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-2">
              <Wallet className="h-3 w-3" /> Settlement history
            </summary>
            <ul className="space-y-1 mt-2">
              {settledHistory.map((b) => {
                const debtor = attendees.find((x) => x.user_id === b.debtor_user_id);
                const creditor = attendees.find((x) => x.user_id === b.creditor_user_id);
                const nm = (att: any, uid: string) =>
                  uid === user?.id
                    ? "You"
                    : att?.profile?.first_name ||
                      att?.profile?.username ||
                      "Attendee";
                return (
                  <li key={b.id} className="text-xs text-muted-foreground flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">
                      {b.status === "settled_in_app"
                        ? "Paid in-app"
                        : b.status === "settled_off_platform"
                          ? "Off-platform"
                          : "Refunded"}
                    </Badge>
                    {nm(debtor, b.debtor_user_id)} → {nm(creditor, b.creditor_user_id)} ·{" "}
                    {fmt(b.amount)}
                  </li>
                );
              })}
            </ul>
          </details>
        )}
      </CardContent>
    </Card>
  );
};