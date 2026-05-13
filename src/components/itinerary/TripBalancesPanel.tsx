import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, ArrowRight, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useItineraryAttendees } from "@/hooks/useItineraryAttendees";
import { useTripBalances } from "@/hooks/useTripBalances";

interface TripBalancesPanelProps {
  itineraryId: number;
}

const formatPrice = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const TripBalancesPanel: React.FC<TripBalancesPanelProps> = ({ itineraryId }) => {
  const { user } = useAuth();
  const { attendees } = useItineraryAttendees(itineraryId);
  const { balances, loading, markSettledOffPlatform } = useTripBalances(itineraryId);
  const [busyId, setBusyId] = useState<string | null>(null);

  const nameFor = (uid: string | null) => {
    if (!uid) return "Guest";
    const a = attendees.find((x) => x.user_id === uid);
    if (!a?.profile) return uid === user?.id ? "You" : "Attendee";
    const full =
      [a.profile.first_name, a.profile.last_name].filter(Boolean).join(" ") ||
      a.profile.username ||
      "Attendee";
    return uid === user?.id ? "You" : full;
  };

  // Net per pair (debtor → creditor) on open balances only.
  const netOpen = useMemo(() => {
    const map = new Map<string, { debtor: string; creditor: string; amount: number; ids: string[] }>();
    balances
      .filter((b) => b.status === "open")
      .forEach((b) => {
        const fwdKey = `${b.debtor_user_id}|${b.creditor_user_id}`;
        const revKey = `${b.creditor_user_id}|${b.debtor_user_id}`;
        if (map.has(revKey)) {
          const cur = map.get(revKey)!;
          cur.amount -= b.amount;
          cur.ids.push(b.id);
          if (cur.amount < 0) {
            // Flip direction
            map.set(fwdKey, {
              debtor: b.debtor_user_id,
              creditor: b.creditor_user_id,
              amount: -cur.amount,
              ids: cur.ids,
            });
            map.delete(revKey);
          } else if (cur.amount === 0) {
            map.delete(revKey);
          }
        } else if (map.has(fwdKey)) {
          const cur = map.get(fwdKey)!;
          cur.amount += b.amount;
          cur.ids.push(b.id);
        } else {
          map.set(fwdKey, {
            debtor: b.debtor_user_id,
            creditor: b.creditor_user_id,
            amount: b.amount,
            ids: [b.id],
          });
        }
      });
    return Array.from(map.values()).filter((v) => v.amount > 0.005);
  }, [balances]);

  const myOwes = netOpen.filter((p) => p.debtor === user?.id);
  const owedToMe = netOpen.filter((p) => p.creditor === user?.id);
  const others = netOpen.filter((p) => p.debtor !== user?.id && p.creditor !== user?.id);

  const settled = balances.filter((b) => b.status !== "open").slice(0, 8);

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Wallet className="h-5 w-5" />
          Trip balances
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : netOpen.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No open balances. When someone pays for the group, the share owed will appear here.
          </p>
        ) : (
          <div className="space-y-2">
            {[...owedToMe, ...myOwes, ...others].map((p) => {
              const involvesMe = p.debtor === user?.id || p.creditor === user?.id;
              const direction =
                p.creditor === user?.id
                  ? `${nameFor(p.debtor)} owes you`
                  : p.debtor === user?.id
                    ? `You owe ${nameFor(p.creditor)}`
                    : `${nameFor(p.debtor)} owes ${nameFor(p.creditor)}`;
              return (
                <div
                  key={`${p.debtor}-${p.creditor}`}
                  className="flex items-center justify-between gap-2 rounded-md border border-border bg-background p-3"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm truncate">{direction}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-semibold tabular-nums">
                      {formatPrice(p.amount)}
                    </span>
                    {involvesMe && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8"
                        disabled={busyId !== null}
                        onClick={async () => {
                          setBusyId(p.ids[0]);
                          // Settle the underlying ledger rows in this pair.
                          for (const id of p.ids) {
                            await markSettledOffPlatform(id);
                          }
                          setBusyId(null);
                        }}
                      >
                        <Check className="h-3 w-3 mr-1" /> Mark settled
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {settled.length > 0 && (
          <div className="pt-2 border-t border-border">
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
              History
            </p>
            <ul className="space-y-1">
              {settled.map((b) => (
                <li key={b.id} className="text-xs text-muted-foreground flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">
                    {b.status === "settled_in_app"
                      ? "Paid in-app"
                      : b.status === "settled_off_platform"
                        ? "Off-platform"
                        : "Refunded"}
                  </Badge>
                  {nameFor(b.debtor_user_id)} → {nameFor(b.creditor_user_id)} ·{" "}
                  {formatPrice(b.amount)}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};