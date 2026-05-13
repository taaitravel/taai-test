import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Check, X, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useItineraryAttendees } from "@/hooks/useItineraryAttendees";
import { useCartItemSplits, ShareMethod, SplitDraftRow } from "@/hooks/useCartItemSplits";

interface SplitCostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cartItemId: string | null;
  itineraryId: number | null;
  itemName: string;
  itemPrice: number;
  onSaved?: () => void;
}

interface DraftRow {
  key: string;
  attendee_user_id: string | null;
  attendee_label: string | null;
  display_name: string;
  selected: boolean;
  share_method: ShareMethod;
  share_value: string; // raw input
}

const round2 = (n: number) => Math.round(n * 100) / 100;
const formatPrice = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const SplitCostDialog: React.FC<SplitCostDialogProps> = ({
  open,
  onOpenChange,
  cartItemId,
  itineraryId,
  itemName,
  itemPrice,
  onSaved,
}) => {
  const { user } = useAuth();
  const { attendees } = useItineraryAttendees(itineraryId);
  const { splits, saveSplits } = useCartItemSplits(cartItemId);

  const [globalMethod, setGlobalMethod] = useState<ShareMethod>("equal");
  const [paidBy, setPaidBy] = useState<string>("");
  const [rows, setRows] = useState<DraftRow[]>([]);
  const [saving, setSaving] = useState(false);

  // Seed rows when dialog opens or attendees change.
  useEffect(() => {
    if (!open) return;
    const seeded: DraftRow[] = attendees.map((a) => {
      const existing = splits.find((s) => s.attendee_user_id === a.user_id);
      const profileName = a.profile
        ? [a.profile.first_name, a.profile.last_name].filter(Boolean).join(" ") ||
          a.profile.username ||
          "Attendee"
        : "Attendee";
      const isMe = a.user_id === user?.id;
      return {
        key: a.user_id,
        attendee_user_id: a.user_id,
        attendee_label: null,
        display_name: isMe ? `${profileName} (you)` : profileName,
        selected: existing != null || attendees.length <= 1,
        share_method: (existing?.share_method ?? "equal") as ShareMethod,
        share_value: existing?.share_value != null ? String(existing.share_value) : "",
      };
    });
    // If splits had a paid_by, preselect; else default to current user.
    const seedPaidBy = splits[0]?.paid_by_user_id || user?.id || "";
    setPaidBy(seedPaidBy);
    // If existing splits use a single method, reflect in global method radio.
    if (splits.length > 0) {
      const methods = new Set(splits.map((s) => s.share_method));
      setGlobalMethod(methods.size === 1 ? (splits[0].share_method as ShareMethod) : "equal");
      // Mark selection based on which attendees have splits.
      const split_ids = new Set(splits.map((s) => s.attendee_user_id).filter(Boolean));
      seeded.forEach((r) => {
        r.selected = !!r.attendee_user_id && split_ids.has(r.attendee_user_id);
      });
    } else {
      // default: include everyone equal
      seeded.forEach((r) => {
        r.selected = true;
      });
    }
    setRows(seeded);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, attendees.length, splits.length]);

  const onChangeGlobalMethod = (m: ShareMethod) => {
    setGlobalMethod(m);
    setRows((rs) => rs.map((r) => ({ ...r, share_method: m, share_value: "" })));
  };

  const updateRow = (key: string, patch: Partial<DraftRow>) => {
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  };

  const selectedRows = useMemo(() => rows.filter((r) => r.selected), [rows]);

  // Live computation per-row (mirrors recompute_cart_item_splits SQL).
  const computed = useMemo(() => {
    const map = new Map<string, number>();
    let lockedSum = 0;
    let equalCount = 0;
    selectedRows.forEach((r) => {
      if (r.share_method === "percent") {
        const v = parseFloat(r.share_value || "0");
        const amt = round2(itemPrice * (v / 100));
        map.set(r.key, amt);
        lockedSum += amt;
      } else if (r.share_method === "amount") {
        const v = parseFloat(r.share_value || "0");
        const amt = round2(v);
        map.set(r.key, amt);
        lockedSum += amt;
      } else {
        equalCount += 1;
      }
    });
    if (equalCount > 0) {
      const remainder = Math.max(itemPrice - lockedSum, 0);
      const each = round2(remainder / equalCount);
      selectedRows.forEach((r) => {
        if (r.share_method === "equal") map.set(r.key, each);
      });
    }
    const total = round2(
      Array.from(map.values()).reduce((s, n) => s + n, 0)
    );
    const valid = Math.abs(total - itemPrice) < 0.02 || itemPrice === 0;
    return { perRow: map, total, valid };
  }, [selectedRows, itemPrice]);

  const onSave = async () => {
    if (!cartItemId || !itineraryId) return;
    if (!computed.valid) return;
    setSaving(true);
    const drafts: SplitDraftRow[] = selectedRows.map((r) => ({
      attendee_user_id: r.attendee_user_id,
      attendee_label: r.attendee_label,
      share_method: r.share_method,
      share_value:
        r.share_method === "equal"
          ? null
          : Number.isFinite(parseFloat(r.share_value))
            ? parseFloat(r.share_value)
            : 0,
    }));
    const ok = await saveSplits({
      itineraryId,
      paidByUserId: paidBy || null,
      rows: drafts,
    });
    setSaving(false);
    if (ok) {
      onSaved?.();
      onOpenChange(false);
    }
  };

  const onClearSplit = async () => {
    if (!cartItemId || !itineraryId) return;
    setSaving(true);
    const ok = await saveSplits({
      itineraryId,
      paidByUserId: paidBy || null,
      rows: [],
    });
    setSaving(false);
    if (ok) {
      onSaved?.();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-hidden flex flex-col" aria-describedby="split-desc">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Split: {itemName}
          </DialogTitle>
          <DialogDescription id="split-desc">
            {formatPrice(itemPrice)} · choose how this cost is divided
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-5 px-1">
          <div>
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Method
            </Label>
            <RadioGroup
              value={globalMethod}
              onValueChange={(v) => onChangeGlobalMethod(v as ShareMethod)}
              className="flex gap-4 mt-2"
            >
              {(["equal", "percent", "amount"] as ShareMethod[]).map((m) => (
                <div key={m} className="flex items-center gap-2">
                  <RadioGroupItem id={`m-${m}`} value={m} />
                  <Label htmlFor={`m-${m}`} className="capitalize cursor-pointer">
                    {m}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            {rows.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No trip attendees yet. Invite people to the trip first.
              </p>
            )}
            {rows.map((r) => {
              const amt = computed.perRow.get(r.key) ?? 0;
              return (
                <div
                  key={r.key}
                  className="flex items-center gap-3 rounded-md border border-border bg-background/40 p-2"
                >
                  <Checkbox
                    checked={r.selected}
                    onCheckedChange={(c) => updateRow(r.key, { selected: !!c })}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{r.display_name}</div>
                  </div>
                  {r.selected && globalMethod !== "equal" && (
                    <Input
                      type="number"
                      inputMode="decimal"
                      placeholder={globalMethod === "percent" ? "%" : "$"}
                      value={r.share_value}
                      onChange={(e) => updateRow(r.key, { share_value: e.target.value })}
                      className="w-24 h-8 text-right tabular-nums"
                    />
                  )}
                  {r.selected && (
                    <span className="w-24 text-right text-sm tabular-nums text-foreground">
                      {formatPrice(amt)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div>
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Paid by
            </Label>
            <Select value={paidBy} onValueChange={setPaidBy}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select payer" />
              </SelectTrigger>
              <SelectContent>
                {attendees
                  .filter((a) => !!a.user_id)
                  .map((a) => {
                    const name = a.profile
                      ? [a.profile.first_name, a.profile.last_name].filter(Boolean).join(" ") ||
                        a.profile.username ||
                        "Attendee"
                      : "Attendee";
                    const isMe = a.user_id === user?.id;
                    return (
                      <SelectItem key={a.user_id} value={a.user_id}>
                        {name}
                        {isMe ? " (you)" : ""}
                      </SelectItem>
                    );
                  })}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              In this phase the payer is the person running checkout. Others will owe their share back.
            </p>
          </div>

          <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
            <div className="text-sm">
              <span className="text-muted-foreground">Sum: </span>
              <span className="font-semibold tabular-nums">{formatPrice(computed.total)}</span>
              <span className="text-muted-foreground"> / {formatPrice(itemPrice)}</span>
            </div>
            {computed.valid ? (
              <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white gap-1">
                <Check className="h-3 w-3" /> OK
              </Badge>
            ) : (
              <Badge variant="destructive" className="gap-1">
                <X className="h-3 w-3" /> Off by {formatPrice(round2(itemPrice - computed.total))}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex flex-row gap-2 pt-3 border-t">
          {splits.length > 0 && (
            <Button variant="ghost" onClick={onClearSplit} disabled={saving}>
              Clear split
            </Button>
          )}
          <div className="flex-1" />
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={saving || !computed.valid || selectedRows.length === 0}>
            Save split
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};