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
          // Default to dark if no preference saved
          setThemeState('dark');
          applyTheme('dark');
        }
      } else {
        // For non-logged-in users, check localStorage or default to dark
        const stored = localStorage.getItem('taai-theme');
        const initialTheme = stored || 'dark';
        setThemeState(initialTheme);
        applyTheme(initialTheme);
      }
      setIsLoading(false);
    };

    loadTheme();
  }, [user, userProfile]);

  const applyTheme = (newTheme: string) => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    
    if (newTheme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(newTheme);
    }
  };

  const setTheme = async (newTheme: 'light' | 'dark' | 'system') => {
    setThemeState(newTheme);
    applyTheme(newTheme);
    localStorage.setItem('taai-theme', newTheme);

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

export function ThemeProvider({ children, defaultTheme = 'dark', storageKey = 'taai-theme' }: ThemeProviderProps) {
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
