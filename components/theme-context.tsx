"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = "light" | "dark" | "emerald" | "ruby";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as Theme) || 'dark';
    }
    return 'dark';
  });

  useEffect(() => {
    if (theme === "custom") {
      const customPrimary = localStorage.getItem("custom-primary");
      const customPrimaryForeground = localStorage.getItem("custom-primary-foreground");
      const customRing = localStorage.getItem("custom-ring");

      if (customPrimary) document.documentElement.style.setProperty('--primary', customPrimary);
      if (customPrimaryForeground) document.documentElement.style.setProperty('--primary-foreground', customPrimaryForeground);
      if (customRing) document.documentElement.style.setProperty('--ring', customRing);
    } else {
      document.documentElement.style.removeProperty('--primary');
      document.documentElement.style.removeProperty('--primary-foreground');
      document.documentElement.style.removeProperty('--ring');
    }

    document.documentElement.classList.remove('light', 'dark', 'emerald', 'ruby', 'blue', 'green', 'orange', 'custom');
    document.documentElement.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
