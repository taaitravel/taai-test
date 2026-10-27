import { ThemeProvider as NextThemesProvider } from "next-themes";
import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface ThemeContextType {
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  theme: string | undefined;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "taai-theme";

function readStoredTheme(): "light" | "dark" | "system" {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") return stored;
  return "system";
}

function applyTheme(newTheme: string) {
  const root = window.document.documentElement;
  root.classList.remove("light", "dark");

  const resolved =
    newTheme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : newTheme;

  root.classList.add(resolved);
  root.style.colorScheme = resolved === "dark" ? "dark" : "light";
}

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: string;
  storageKey?: string;
}

function ThemeProviderInner({ children }: { children: React.ReactNode }) {
  const { user, userProfile } = useAuth();
  const [theme, setThemeState] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  // Load theme from user profile on mount
  useEffect(() => {
    const loadTheme = async () => {
      if (user && userProfile) {
        const savedTheme = (userProfile as any).theme_preference;
        if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
          setThemeState(savedTheme);
          applyTheme(savedTheme);
        } else {
          const initialTheme = readStoredTheme();
          setThemeState(initialTheme);
          applyTheme(initialTheme);
        }
      } else {
        const initialTheme = readStoredTheme();
        setThemeState(initialTheme);
        applyTheme(initialTheme);
      }
      setIsLoading(false);
    };

    loadTheme();
  }, [user, userProfile]);

  useEffect(() => {
    if (theme !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [theme]);

  const setTheme = async (newTheme: 'light' | 'dark' | 'system') => {
    setThemeState(newTheme);
    applyTheme(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);

    // Save to database if user is logged in
    if (user) {
      try {
        await supabase
          .from('users')
          .update({ theme_preference: newTheme })
          .eq('userid', user.id);
      } catch (error) {
        console.error('Failed to save theme preference:', error);
      }
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ toggleTheme, setTheme, theme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function ThemeProvider({ children, defaultTheme = 'system', storageKey = THEME_STORAGE_KEY }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme={defaultTheme}
      storageKey={storageKey}
      enableSystem
      disableTransitionOnChange
    >
      <ThemeProviderInner>
        {children}
      </ThemeProviderInner>
    </NextThemesProvider>
  );
}

export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
}
