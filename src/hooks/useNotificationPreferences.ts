import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface NotificationPreferences {
  chat_messages: boolean;
  chat_mentions: boolean;
  trip_reminders: boolean;
  trip_reminder_lead_hours: 2 | 4 | 12 | 24;
  trip_updates: boolean;
  traveller_requests: boolean;
  traveller_accepts: boolean;
  newsletter: boolean;
  deals: boolean;
}

const DEFAULTS: NotificationPreferences = {
  chat_messages: true,
  chat_mentions: true,
  trip_reminders: true,
  trip_reminder_lead_hours: 4,
  trip_updates: true,
  traveller_requests: true,
  traveller_accepts: true,
  newsletter: true,
  deals: true,
};

export const useNotificationPreferences = () => {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("notification_preferences" as any)
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) setPrefs({ ...DEFAULTS, ...(data as any) });
      setLoading(false);
    })();
  }, [user]);

  const update = async (patch: Partial<NotificationPreferences>) => {
    if (!user) return;
    setSaving(true);
    const next = { ...prefs, ...patch };
    setPrefs(next);
    const { error } = await supabase
      .from("notification_preferences" as any)
      .upsert({ user_id: user.id, ...next }, { onConflict: "user_id" });
    setSaving(false);
    if (error) console.error("update prefs", error);
  };

  return { prefs, loading, saving, update };
};