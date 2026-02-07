
# Light & Dark Mode Implementation Plan

## Overview
This plan adds a complete theming system to TAAI Travel, allowing users to toggle between the current dark mode and a new elegant light mode. The theme preference will be saved to the user's profile in Supabase and persist across sessions.

---

## Architecture Summary

The implementation uses:
- **next-themes** (already installed) for theme management
- **CSS Variables** for theme colors (already partially in place)
- **Supabase `users` table** to persist the user's theme preference
- **A theme toggle** in the UserProfileDropdown and ProfileSetup page

---

## Part 1: Database Changes

### 1.1 Add Theme Preference Column
Create a new migration to add a `theme_preference` column to the `users` table.

```sql
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS theme_preference TEXT DEFAULT 'dark' 
CHECK (theme_preference IN ('light', 'dark', 'system'));
```

---

## Part 2: CSS Theme Variables

### 2.1 Update `src/index.css`

The current CSS has `:root` and `.dark` with nearly identical values. We need to:
1. Make `:root` the **light theme** (default when no class is applied)
2. Keep `.dark` as the **dark theme** (current design)

**Light Mode Color Scheme** (maintaining brand identity):
- Background: Clean off-white (#f8f7f5)
- Card backgrounds: White with subtle warm tint
- Text: Dark charcoal (#1a1a2e)
- Primary: Same rose/coral gradient (brand colors preserved)
- Borders: Soft warm gray
- Muted elements: Light warm gray

```css
:root {
  --background: 40 20% 97%;        /* #f8f7f5 - warm off-white */
  --foreground: 240 16% 11%;       /* #171821 - dark text */

  --card: 0 0% 100%;               /* pure white cards */
  --card-foreground: 240 16% 15%;  /* dark text */

  --popover: 0 0% 100%;
  --popover-foreground: 240 16% 15%;

  --primary: 351 85% 65%;          /* slightly deeper for contrast */
  --primary-foreground: 0 0% 100%; /* white text on primary */

  --secondary: 40 30% 92%;         /* warm light gray */
  --secondary-foreground: 240 16% 15%;

  --muted: 40 20% 94%;
  --muted-foreground: 240 10% 40%;

  --accent: 40 30% 90%;
  --accent-foreground: 240 16% 15%;

  --destructive: 0 84% 60%;
  --destructive-foreground: 0 0% 100%;

  --border: 40 20% 88%;
  --input: 40 20% 92%;
  --ring: 351 85% 65%;

  /* Sidebar */
  --sidebar-background: 0 0% 100%;
  --sidebar-foreground: 240 16% 15%;
  --sidebar-primary: 351 85% 65%;
  --sidebar-primary-foreground: 0 0% 100%;
  --sidebar-accent: 40 30% 94%;
  --sidebar-accent-foreground: 240 16% 15%;
  --sidebar-border: 40 20% 88%;
  --sidebar-ring: 351 85% 65%;

  /* Map markers */
  --marker-activity: 36 100% 50%;
  --marker-hotel: 348 100% 60%;
  --marker-reservation: 240 16% 15%;
  --marker-outline: 0 0% 100%;
}

.dark {
  /* Keep current dark theme values */
  --background: 240 16% 11%;
  /* ... existing values ... */
}
```

### 2.2 Update Hardcoded Colors

Create theme-aware CSS classes to replace hardcoded `bg-[#171821]` etc.:

```css
/* Theme-aware background classes */
.bg-theme-primary {
  @apply bg-background;
}

.bg-theme-card {
  @apply bg-card;
}

/* Light mode specific overrides */
:root .luxury-gradient {
  background: linear-gradient(135deg, #f8f7f5 0%, #efe8dc 50%, #f8f7f5 100%);
}

:root .gold-gradient {
  background: linear-gradient(135deg, hsl(351, 85%, 65%) 0%, hsl(15, 80%, 60%) 50%, hsl(25, 75%, 55%) 100%);
}

/* Trip card styles for light mode */
:root .trip-card-upcoming {
  background: white;
  box-shadow: 0 0 0 2px hsl(351, 85%, 65%), 0 4px 12px rgba(0, 0, 0, 0.1);
}

:root .trip-card-past {
  background: linear-gradient(135deg, hsl(351, 85%, 70%) 0%, hsl(15, 80%, 65%) 50%, hsl(25, 75%, 60%) 100%);
}

/* Mapbox overrides for light mode */
:root .mapboxgl-popup-content {
  background: white !important;
  border: 1px solid rgba(0, 0, 0, 0.1) !important;
}

:root .mapboxgl-popup-tip {
  border-top-color: white !important;
  border-bottom-color: white !important;
}

:root .mapboxgl-popup-close-button {
  color: #171821 !important;
}
```

---

## Part 3: Theme Provider Setup

### 3.1 Create Theme Context
**New file: `src/contexts/ThemeContext.tsx`**

This context will:
- Wrap `next-themes` ThemeProvider
- Sync theme with Supabase user preferences
- Provide a simple `toggleTheme` function

```typescript
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { createContext, useContext, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface ThemeContextType {
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }) {
  // Load user preference from Supabase on mount
  // Save to Supabase when changed
  // Return wrapped NextThemesProvider
}

export const useThemeContext = () => useContext(ThemeContext);
```

### 3.2 Update `src/App.tsx`

Wrap the app with the ThemeProvider:

```typescript
import { ThemeProvider } from "@/contexts/ThemeContext";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark" storageKey="taai-theme">
      <TooltipProvider>
        {/* ... rest of app ... */}
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);
```

### 3.3 Update `index.html`

Add dark class by default to prevent flash:

```html
<html lang="en" class="dark">
```

---

## Part 4: Theme Toggle UI

### 4.1 Create Theme Toggle Component
**New file: `src/components/shared/ThemeToggle.tsx`**

A beautiful animated toggle with sun/moon icons:

```typescript
import { Moon, Sun } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "next-themes";

export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  
  return (
    <div className="flex items-center gap-2">
      <Sun className="h-4 w-4 text-foreground/60" />
      <Switch
        checked={theme === 'dark'}
        onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
      />
      <Moon className="h-4 w-4 text-foreground/60" />
    </div>
  );
};
```

### 4.2 Add to UserProfileDropdown

Add the theme toggle to the profile dropdown menu:

```typescript
// In UserProfileDropdown.tsx
import { ThemeToggle } from "./ThemeToggle";

// Add inside DropdownMenuContent, after the user info section:
<DropdownMenuSeparator />
<div className="px-3 py-2">
  <p className="text-sm text-muted-foreground mb-2">Appearance</p>
  <ThemeToggle />
</div>
```

### 4.3 Add to ProfileSetup Page

Add a theme preference section in the profile setup flow.

---

## Part 5: Update Components for Theme Support

### 5.1 Files Requiring Updates

The following files use hardcoded dark colors and need updating to use theme variables:

| File | Current | Change To |
|------|---------|-----------|
| `src/pages/Index.tsx` | `bg-[#171821]` | `bg-background` |
| `src/pages/Login.tsx` | `bg-[#171821]` | `bg-background` |
| `src/pages/Signup.tsx` | `bg-[#171821]` | `bg-background` |
| `src/pages/Dashboard.tsx` | (via DashboardLayout) | `bg-background` |
| `src/components/shared/MobileNavigation.tsx` | `bg-[#171821]/95` | `bg-background/95` |
| `src/components/shared/UserProfileDropdown.tsx` | `bg-[#171821]/95` | `bg-background/95` |
| All Card components | `bg-[#171821]/80` | `bg-card/80` |

**Pattern to apply across ~35 files:**

```typescript
// Before:
className="bg-[#171821]"

// After:
className="bg-background"

// Before:
className="text-white"

// After:
className="text-foreground"

// Before:
className="border-white/20"

// After:
className="border-border"
```

---

## Part 6: AuthContext Updates

### 6.1 Add Theme to UserProfile Interface

```typescript
interface UserProfile {
  // ... existing fields ...
  theme_preference: 'light' | 'dark' | 'system' | null;
}
```

### 6.2 Add Theme Update Function

```typescript
const updateThemePreference = async (theme: 'light' | 'dark' | 'system') => {
  if (!user) return { error: { message: 'No user logged in' } };
  
  const { error } = await supabase
    .from('users')
    .update({ theme_preference: theme })
    .eq('userid', user.id);
    
  return { error };
};
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/contexts/ThemeContext.tsx` | Theme provider and sync logic |
| `src/components/shared/ThemeToggle.tsx` | Toggle switch component |
| `supabase/migrations/[timestamp]_add_theme_preference.sql` | Database column |

## Files to Modify

| File | Changes |
|------|---------|
| `src/index.css` | Light theme variables, theme-aware utility classes |
| `src/App.tsx` | Wrap with ThemeProvider |
| `index.html` | Add default dark class |
| `src/contexts/AuthContext.tsx` | Add theme_preference to interface |
| `src/components/shared/UserProfileDropdown.tsx` | Add ThemeToggle |
| `src/pages/ProfileSetup.tsx` | Add theme preference section |
| ~35 component files | Replace hardcoded colors with theme variables |

---

## Visual Design: Light Mode

The light mode maintains the TAAI brand identity:
- **Primary accent**: Same rose/coral gradient (#feb2b2 to #ffce87)
- **Background**: Warm off-white (#f8f7f5) - not stark white
- **Cards**: Pure white with subtle shadows
- **Text**: Dark charcoal for excellent contrast
- **Borders**: Soft warm gray
- **Gold elements**: Slightly deeper for visibility on light backgrounds

This creates an elegant, minimalist light theme while preserving the luxury travel brand aesthetic.

---

## Implementation Order

1. Database migration (add column)
2. CSS variables and light theme styles
3. ThemeContext and ThemeToggle components
4. Update App.tsx with provider
5. Update UserProfileDropdown with toggle
6. Batch update components to use theme variables
7. Test all pages in both modes
8. Add to ProfileSetup page

