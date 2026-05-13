import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type BalanceStatus =
  | "open"
  | "settled_in_app"
  | "settled_off_platform"
  | "refunded";

export interface AttendeeBalance {
  id: string;
  itinerary_id: number;
  debtor_user_id: string;
  creditor_user_id: string;
  amount: number;
  currency: string;
  status: BalanceStatus;
  source_split_id: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export const useTripBalances = (itineraryId: number | null) => {
  const { toast } = useToast();
  const [balances, setBalances] = useState<AttendeeBalance[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBalances = useCallback(async () => {
    if (!itineraryId) {
      setBalances([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("attendee_balances")
      .select("*")
      .eq("itinerary_id", itineraryId)
      .order("created_at", { ascending: false });
    if (error) console.error("[useTripBalances] fetch error", error);
    setBalances((data as AttendeeBalance[]) || []);
    setLoading(false);
  }, [itineraryId]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  const markSettledOffPlatform = useCallback(
    async (balanceId: string, note?: string) => {
      const { error } = await supabase
        .from("attendee_balances")
        .update({ status: "settled_off_platform", note: note ?? null })
        .eq("id", balanceId);
      if (error) {
        toast({
          title: "Couldn't update",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }
      toast({ title: "Marked settled", description: "Balance closed off-platform." });
      await fetchBalances();
      return true;
    },
    [fetchBalances, toast]
  );

  return { balances, loading, refresh: fetchBalances, markSettledOffPlatform };
};