import React, { createContext, useContext, useMemo, useState } from 'react';

/**
 * Gate 8 Slice 2A — Global Mobile Chrome state.
 * Owns only cross-chrome coordination flags. In 2A the sole responsibility is
 * drawer visibility so the bottom nav can suppress itself when the drawer is
 * open. No route/action logic lives here.
 */
interface ChromeState {
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
}

const ChromeStateCtx = createContext<ChromeState | null>(null);

export const ChromeStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const value = useMemo(() => ({ drawerOpen, setDrawerOpen }), [drawerOpen]);
  return <ChromeStateCtx.Provider value={value}>{children}</ChromeStateCtx.Provider>;
};

export function useChromeState(): ChromeState {
  const ctx = useContext(ChromeStateCtx);
  if (!ctx) {
    // Inert fallback for consumers rendered outside the provider (tests, etc.).
    return { drawerOpen: false, setDrawerOpen: () => {} };
  }
  return ctx;
}