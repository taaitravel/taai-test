import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { AvatarUpload } from "./AvatarUpload";

export const EditProfileSection = () => {
  const { user, userProfile, updateUserProfile } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    first_name: userProfile?.first_name || "",
    last_name: userProfile?.last_name || "",
    email: userProfile?.email || "",
    cell: userProfile?.cell?.toString() || "",
    bio: (userProfile as any)?.bio || "",
  });

  const [avatarUrl, setAvatarUrl] = useState<string | null>((userProfile as any)?.avatar_url || null);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates: any = {
        first_name: form.first_name,
        last_name: form.last_name,
        cell: form.cell ? parseInt(form.cell) : null,
        bio: form.bio,
      };

      // If email changed, we'd need re-verification — for now just update
      if (form.email !== userProfile?.email) {
        updates.email = form.email;
      }

      const { error } = await updateUserProfile(updates);
      if (error) throw error;

      toast({ title: "Profile updated successfully!" });
    } catch (err: any) {
      toast({ title: "Error saving profile", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl">
      <Card className="border-border bg-card dark:bg-white/5 dark:border-white/10">
        <CardHeader>
          <CardTitle className="text-foreground">Profile Photo</CardTitle>
        </CardHeader>
        <CardContent>
          <AvatarUpload
            currentUrl={avatarUrl}
            userId={user?.id || ""}
            onUpload={(url) => setAvatarUrl(url)}
          />
        </CardContent>
      </Card>

      <Card className="border-border bg-card dark:bg-white/5 dark:border-white/10">
        <CardHeader>
          <CardTitle className="text-foreground">Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                value={form.first_name}
                onChange={(e) => handleChange("first_name", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                value={form.last_name}
                onChange={(e) => handleChange("last_name", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Changing your email will require re-verification.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cell">Phone Number</Label>
            <Input
              id="cell"
              type="tel"
              value={form.cell}
              onChange={(e) => handleChange("cell", e.target.value)}
              placeholder="+1 (555) 000-0000"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">About You</Label>
            <Textarea
              id="bio"
              value={form.bio}
              onChange={(e) => handleChange("bio", e.target.value.slice(0, 200))}
              placeholder="Tell us a bit about yourself..."
              className="resize-none"
              rows={3}
            />
            <p className="text-xs text-muted-foreground text-right">
              {form.bio.length}/200
            </p>
          </div>

          <Button onClick={handleSave} disabled={saving} className="gold-gradient text-primary-foreground font-semibold">
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Changes
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
