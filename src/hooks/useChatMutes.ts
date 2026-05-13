import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface MutedChat {
  itinerary_id: number;
  itin_name: string | null;
}

export const useChatMutes = () => {
  const { user } = useAuth();
  const [muted, setMuted] = useState<MutedChat[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("chat_mutes" as any)
      .select("itinerary_id")
      .eq("user_id", user.id);
    const ids = (data ?? []).map((r: any) => r.itinerary_id);
    if (ids.length === 0) {
      setMuted([]);
      setLoading(false);
      return;
    }
    const { data: itins } = await supabase
      .from("itinerary")
      .select("id, itin_name")
      .in("id", ids);
    setMuted((itins ?? []).map((i: any) => ({ itinerary_id: i.id, itin_name: i.itin_name })));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const mute = async (itineraryId: number) => {
    if (!user) return;
    await supabase.from("chat_mutes" as any).insert({ user_id: user.id, itinerary_id: itineraryId });
    await refresh();
  };

  const unmute = async (itineraryId: number) => {
    if (!user) return;
    await supabase
      .from("chat_mutes" as any)
      .delete()
      .eq("user_id", user.id)
      .eq("itinerary_id", itineraryId);
    await refresh();
  };

  const isMuted = (itineraryId: number) => muted.some((m) => m.itinerary_id === itineraryId);

  return { muted, loading, mute, unmute, isMuted, refresh };
};