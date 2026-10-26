import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useThemeContext } from "@/contexts/ThemeContext";

export const ThemeToggle = () => {
  const { theme, setTheme, isLoading } = useThemeContext();
  const [systemDark, setSystemDark] = useState(() =>
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setSystemDark(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const resolvedDark = theme === "dark" || (theme === "system" && systemDark);

  if (isLoading) {
    return (
      <div className="flex items-center gap-3">
        <Sun className="h-4 w-4 text-foreground/40" />
        <Switch disabled checked={resolvedDark} />
        <Moon className="h-4 w-4 text-foreground/40" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Sun className={`h-4 w-4 transition-colors ${resolvedDark ? "text-foreground/40" : "text-primary"}`} />
      <Switch
        checked={resolvedDark}
        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
        aria-label={resolvedDark ? "Switch to light appearance" : "Switch to dark appearance"}
        className="data-[state=checked]:bg-primary"
      />
      <Moon className={`h-4 w-4 transition-colors ${resolvedDark ? "text-primary" : "text-foreground/40"}`} />
    </div>
  );
};
