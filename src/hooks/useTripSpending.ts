import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SpendingEntry {
  amount: number;
  pct: number;
}

export const useTripSpending = (itineraryId: number | null) => {
  const [totals, setTotals] = useState<Map<string, SpendingEntry>>(new Map());
  const [tripTotal, setTripTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!itineraryId) {
      setTotals(new Map());
      setTripTotal(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("cart_item_splits")
      .select("attendee_user_id, computed_amount, computed_taxes_and_fees")
      .eq("itinerary_id", itineraryId);
    if (error) {
      console.error("[useTripSpending]", error);
      setLoading(false);
      return;
    }
    const map = new Map<string, number>();
    let sum = 0;
    (data || []).forEach((r: any) => {
      const uid = r.attendee_user_id || "__guest__";
      const v = Number(r.computed_amount || 0) + Number(r.computed_taxes_and_fees || 0);
      map.set(uid, (map.get(uid) || 0) + v);
      sum += v;
    });
    const out = new Map<string, SpendingEntry>();
    map.forEach((amount, uid) => {
      out.set(uid, { amount, pct: sum > 0 ? (amount / sum) * 100 : 0 });
    });
    setTotals(out);
    setTripTotal(sum);
    setLoading(false);
  }, [itineraryId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { totals, tripTotal, loading, refresh: fetch };
};