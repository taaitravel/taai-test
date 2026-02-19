import { Moon, Sun } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useThemeContext } from "@/contexts/ThemeContext";

export const ThemeToggle = () => {
  const { theme, setTheme, isLoading } = useThemeContext();
  
  if (isLoading) {
    return (
      <div className="flex items-center gap-3">
        <Sun className="h-4 w-4 text-foreground/40" />
        <Switch disabled checked={true} />
        <Moon className="h-4 w-4 text-foreground/40" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Sun className={`h-4 w-4 transition-colors ${theme === 'light' ? 'text-primary' : 'text-muted-foreground'}`} />
      <Switch
        checked={theme === 'dark'}
        onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
        className="data-[state=checked]:bg-primary"
      />
      <Moon className={`h-4 w-4 transition-colors ${theme === 'dark' ? 'text-primary' : 'text-muted-foreground'}`} />
    </div>
  );
};
