import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface FollowRow {
  id: string;
  follower_id: string;
  following_id: string;
  status: "pending" | "accepted";
  created_at: string;
  profile?: {
    userid: string;
    first_name: string | null;
    last_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
}

export const useFollows = () => {
  const { user } = useAuth();
  const [following, setFollowing] = useState<FollowRow[]>([]);
  const [followers, setFollowers] = useState<FollowRow[]>([]);
  const [pendingIncoming, setPendingIncoming] = useState<FollowRow[]>([]);
  const [pendingOutgoing, setPendingOutgoing] = useState<FollowRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("user_follows" as any)
      .select("*")
      .or(`follower_id.eq.${user.id},following_id.eq.${user.id}`);
    const rows = (data ?? []) as any as FollowRow[];
    const otherIds = Array.from(
      new Set(rows.map((r) => (r.follower_id === user.id ? r.following_id : r.follower_id)))
    );
    let profiles: Record<string, FollowRow["profile"]> = {};
    if (otherIds.length) {
      const { data: ps } = await supabase
        .from("users")
        .select("userid, first_name, last_name, username, avatar_url")
        .in("userid", otherIds);
      (ps ?? []).forEach((p: any) => (profiles[p.userid] = p));
    }
    const decorated = rows.map((r) => ({
      ...r,
      profile: profiles[r.follower_id === user.id ? r.following_id : r.follower_id],
    }));
    setFollowing(decorated.filter((r) => r.follower_id === user.id && r.status === "accepted"));
    setFollowers(decorated.filter((r) => r.following_id === user.id && r.status === "accepted"));
    setPendingIncoming(decorated.filter((r) => r.following_id === user.id && r.status === "pending"));
    setPendingOutgoing(decorated.filter((r) => r.follower_id === user.id && r.status === "pending"));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const requestFollow = async (targetUserId: string) => {
    if (!user) return;
    await supabase
      .from("user_follows" as any)
      .insert({ follower_id: user.id, following_id: targetUserId, status: "pending" });
    await refresh();
  };

  const accept = async (followId: string) => {
    await supabase.from("user_follows" as any).update({ status: "accepted" }).eq("id", followId);
    await refresh();
  };

  const remove = async (followId: string) => {
    await supabase.from("user_follows" as any).delete().eq("id", followId);
    await refresh();
  };

  return {
    following,
    followers,
    pendingIncoming,
    pendingOutgoing,
    loading,
    requestFollow,
    accept,
    remove,
    refresh,
  };
};