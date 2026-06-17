"use client";

import React, { createContext, useContext, ReactNode } from "react";

interface ThemeContextType {
  darkMode: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Force dark mode always on
  const darkMode = true;

  // Apply dark class immediately
  if (typeof document !== 'undefined') {
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
  }

  return (
    <ThemeContext.Provider value={{ darkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}