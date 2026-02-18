import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save } from "lucide-react";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const CURRENCIES = [
  { value: "USD", label: "USD – US Dollar" },
  { value: "EUR", label: "EUR – Euro" },
  { value: "GBP", label: "GBP – British Pound" },
  { value: "CAD", label: "CAD – Canadian Dollar" },
  { value: "AUD", label: "AUD – Australian Dollar" },
  { value: "JPY", label: "JPY – Japanese Yen" },
];

export const PreferencesSection = () => {
  const { userProfile, updateUserProfile } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const [dateFormat, setDateFormat] = useState(userProfile?.date_format || "MM/DD/YY");
  const [currency, setCurrency] = useState((userProfile as any)?.currency || "USD");

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await updateUserProfile({ date_format: dateFormat, currency } as any);
      if (error) throw error;
      toast({ title: "Preferences saved!" });
    } catch (err: any) {
      toast({ title: "Error saving preferences", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl">
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Appearance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Theme</Label>
            <ThemeToggle />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Regional</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Date Format</Label>
            <div className="flex gap-2">
              {["MM/DD/YY", "DD/MM/YY"].map((fmt) => (
                <Button
                  key={fmt}
                  variant={dateFormat === fmt ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDateFormat(fmt)}
                  className={dateFormat === fmt ? "gold-gradient text-primary-foreground" : ""}
                >
                  {fmt}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleSave} disabled={saving} className="gold-gradient text-primary-foreground font-semibold">
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Preferences
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
