"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

/**
 * @typedef {("light" | "dark" | "emerald" | "ruby" | "blue" | "green" | "orange" | "custom")} Theme
 * @description Defines the possible theme types for the application.
 */
type Theme = "light" | "dark" | "emerald" | "ruby" | "blue" | "green" | "orange" | "custom";

/**
 * @interface ThemeContextType
 * @description Defines the shape of the context value provided by ThemeProvider.
 * @property {Theme} theme - The current active theme.
 * @property {(theme: Theme) => void} setTheme - Function to update the current theme.
 */
interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

// Create a context for managing the theme.
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * @component ThemeProvider
 * @description Provides theme context to its children, allowing them to access and change the application's theme.
 * Manages theme state, persists it to local storage, and applies CSS classes/variables to the document.
 * @param {Object} props - The component props.
 * @param {ReactNode} props.children - The child components to be rendered within the theme context.
 * @returns {JSX.Element} The ThemeContext Provider wrapping the children.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  // State to hold the current theme, initialized from local storage or defaults to 'dark'.
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as Theme) || 'dark';
    }
    return 'dark';
  });

  /**
   * @function useEffect
   * @description Effect hook to apply theme changes to the document's root element.
   * Updates CSS classes and variables based on the selected theme, including custom themes.
   * Persists the selected theme to local storage.
   */
  useEffect(() => {
    if (theme === "custom") {
      // Apply custom CSS variables if the theme is 'custom'.
      const customPrimary = localStorage.getItem("custom-primary");
      const customPrimaryForeground = localStorage.getItem("custom-primary-foreground");
      const customRing = localStorage.getItem("custom-ring");

      if (customPrimary) document.documentElement.style.setProperty('--primary', customPrimary);
      if (customPrimaryForeground) document.documentElement.style.setProperty('--primary-foreground', customPrimaryForeground);
      if (customRing) document.documentElement.style.setProperty('--ring', customRing);
    } else {
      // Remove custom CSS variables if switching away from 'custom' theme.
      document.documentElement.style.removeProperty('--primary');
      document.documentElement.style.removeProperty('--primary-foreground');
      document.documentElement.style.removeProperty('--ring');
    }

    // Remove all existing theme classes and add the new one.
    document.documentElement.classList.remove('light', 'dark', 'emerald', 'ruby', 'blue', 'green', 'orange', 'custom');
    document.documentElement.classList.add(theme);
    // Save the current theme to local storage.
    localStorage.setItem('theme', theme);
  }, [theme]);

  /**
   * @function setTheme
   * @description Updates the theme state.
   * @param {Theme} newTheme - The new theme to set.
   */
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    // Provide the theme and setTheme function to the context consumers.
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * @function useTheme
 * @description A custom hook to consume the ThemeContext.
 * Throws an error if used outside of a ThemeProvider.
 * @returns {ThemeContextType} The current theme and the function to set the theme.
 * @throws {Error} If used outside of a ThemeProvider.
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
