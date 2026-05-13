import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNotificationPreferences } from "@/hooks/useNotificationPreferences";
import { useChatMutes } from "@/hooks/useChatMutes";
import { FollowsManagerDialog } from "./FollowsManagerDialog";
import { useFollows } from "@/hooks/useFollows";
import { Volume2, BellOff, Users } from "lucide-react";

const Toggle = ({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) => (
  <div className="flex items-start justify-between gap-4 py-2">
    <div className="min-w-0">
      <Label className="text-sm text-foreground">{label}</Label>
      {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
    </div>
    <Switch checked={checked} onCheckedChange={onChange} />
  </div>
);

export const NotificationPreferencesSection = () => {
  const { prefs, loading, update } = useNotificationPreferences();
  const { muted, unmute } = useChatMutes();
  const { pendingIncoming } = useFollows();
  const [followsOpen, setFollowsOpen] = useState(false);

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading preferences…</div>;
  }

  return (
    <div className="space-y-6 max-w-xl">
      {/* Text & Chat */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">💬 Text & Chat</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          <Toggle
            label="Messages from others"
            description="New messages in your trip chats."
            checked={prefs.chat_messages}
            onChange={(v) => update({ chat_messages: v })}
          />
          <Toggle
            label="@mentions"
            description="When someone tags you directly."
            checked={prefs.chat_mentions}
            onChange={(v) => update({ chat_mentions: v })}
          />
          <div className="pt-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1">
              <BellOff className="h-3 w-3" /> Muted chats
            </p>
            {muted.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nothing muted. Peace and quiet on demand.</p>
            ) : (
              <ul className="space-y-1">
                {muted.map((m) => (
                  <li
                    key={m.itinerary_id}
                    className="flex items-center justify-between text-sm py-1"
                  >
                    <span className="truncate">{m.itin_name || `Trip #${m.itinerary_id}`}</span>
                    <Button size="sm" variant="ghost" onClick={() => unmute(m.itinerary_id)}>
                      <Volume2 className="h-4 w-4 mr-1" /> Unmute
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Trips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">✈️ Trips</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          <Toggle
            label="Upcoming event reminders"
            description="Flights, check-ins, activities, dining — we'll nudge you politely."
            checked={prefs.trip_reminders}
            onChange={(v) => update({ trip_reminders: v })}
          />
          <div className="flex items-center justify-between py-3">
            <Label className="text-sm text-foreground">Remind me</Label>
            <Select
              value={String(prefs.trip_reminder_lead_hours)}
              onValueChange={(v) =>
                update({ trip_reminder_lead_hours: Number(v) as 2 | 4 | 12 | 24 })
              }
            >
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2 hours before</SelectItem>
                <SelectItem value="4">4 hours before</SelectItem>
                <SelectItem value="12">12 hours before</SelectItem>
                <SelectItem value="24">24 hours before</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Toggle
            label="Trip updates from collaborators"
            description="When co-travelers add or change items."
            checked={prefs.trip_updates}
            onChange={(v) => update({ trip_updates: v })}
          />
        </CardContent>
      </Card>

      {/* Travellers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">🤝 Travellers</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          <Toggle
            label="New follow requests"
            checked={prefs.traveller_requests}
            onChange={(v) => update({ traveller_requests: v })}
          />
          <Toggle
            label="When someone accepts you"
            checked={prefs.traveller_accepts}
            onChange={(v) => update({ traveller_accepts: v })}
          />
          <div className="pt-3">
            <Button variant="outline" className="w-full" onClick={() => setFollowsOpen(true)}>
              <Users className="h-4 w-4 mr-2" />
              Manage followers & following
              {pendingIncoming.length > 0 && (
                <span className="ml-2 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-xs px-2 py-0.5">
                  {pendingIncoming.length}
                </span>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Newsletter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">📰 TAAI Travel Newsletter</CardTitle>
        </CardHeader>
        <CardContent>
          <Toggle
            label="Receive the newsletter"
            description="Travel ideas, product news, occasional inspiration. No spam."
            checked={prefs.newsletter}
            onChange={(v) => update({ newsletter: v })}
          />
        </CardContent>
      </Card>

      {/* Deals */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">🏷️ TAAI Deals</CardTitle>
        </CardHeader>
        <CardContent>
          <Toggle
            label="Receive deals & offers"
            description="Hand-picked savings on flights, stays, and experiences."
            checked={prefs.deals}
            onChange={(v) => update({ deals: v })}
          />
        </CardContent>
      </Card>

      <FollowsManagerDialog open={followsOpen} onOpenChange={setFollowsOpen} />
    </div>
  );
};