import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type ShareMethod = "equal" | "percent" | "amount";
export type SplitPaymentStatus = "pending" | "covered" | "paid" | "refunded";

export interface CartItemSplit {
  id: string;
  cart_item_id: string;
  itinerary_id: number;
  attendee_user_id: string | null;
  attendee_label: string | null;
  share_method: ShareMethod;
  share_value: number | null;
  computed_amount: number;
  computed_taxes_and_fees: number;
  paid_by_user_id: string | null;
  payment_status: SplitPaymentStatus;
  auto_added: boolean;
  created_at: string;
  updated_at: string;
}

export interface SplitDraftRow {
  attendee_user_id: string | null;
  attendee_label: string | null;
  share_method: ShareMethod;
  share_value: number | null;
}

export const useCartItemSplits = (cartItemId: string | null) => {
  const { toast } = useToast();
  const [splits, setSplits] = useState<CartItemSplit[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSplits = useCallback(async () => {
    if (!cartItemId) {
      setSplits([]);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("cart_item_splits")
      .select("*")
      .eq("cart_item_id", cartItemId)
      .order("created_at", { ascending: true });
    if (error) {
      console.error("[useCartItemSplits] fetch error", error);
    }
    setSplits((data as CartItemSplit[]) || []);
    setLoading(false);
  }, [cartItemId]);

  useEffect(() => {
    fetchSplits();
  }, [fetchSplits]);

  const saveSplits = useCallback(
    async (params: {
      itineraryId: number;
      paidByUserId: string | null;
      rows: SplitDraftRow[];
    }) => {
      if (!cartItemId) return false;
      try {
        // Replace strategy: wipe existing then insert. Validation trigger is
        // DEFERRABLE so the constraint check runs at commit time.
        const { error: delErr } = await supabase
          .from("cart_item_splits")
          .delete()
          .eq("cart_item_id", cartItemId);
        if (delErr) throw delErr;

        if (params.rows.length > 0) {
          const payload = params.rows.map((r) => ({
            cart_item_id: cartItemId,
            itinerary_id: params.itineraryId,
            attendee_user_id: r.attendee_user_id,
            attendee_label: r.attendee_label,
            share_method: r.share_method,
            share_value: r.share_value,
            paid_by_user_id: params.paidByUserId,
            payment_status: "pending" as SplitPaymentStatus,
          }));
          const { error: insErr } = await supabase
            .from("cart_item_splits")
            .insert(payload);
          if (insErr) throw insErr;

          // Normalize computed_amount via the SQL helper
          await supabase.rpc("recompute_cart_item_splits" as never, {
            _cart_item_id: cartItemId,
          } as never);
        }

        toast({ title: "Split saved", description: "Cost split updated." });
        await fetchSplits();
        return true;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Could not save split.";
        console.error("[useCartItemSplits] save error", err);
        toast({ title: "Couldn't save split", description: msg, variant: "destructive" });
        return false;
      }
    },
    [cartItemId, fetchSplits, toast]
  );

  const clearSplits = useCallback(async () => {
    if (!cartItemId) return;
    await supabase.from("cart_item_splits").delete().eq("cart_item_id", cartItemId);
    await fetchSplits();
  }, [cartItemId, fetchSplits]);

  return { splits, loading, saveSplits, clearSplits, refresh: fetchSplits };
};