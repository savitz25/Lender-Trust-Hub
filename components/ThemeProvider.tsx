'use client';

import { createContext, useContext, useEffect, useState } from 'react';

/**
 * Trust Hub marketing chrome is always light (Insurance/Move parity).
 * We intentionally do NOT honor OS dark mode or invert the site header.
 */
type Theme = 'light';

const ThemeContext = createContext<{
  theme: Theme;
  resolved: 'light';
  setTheme: (t: Theme) => void;
}>({ theme: 'light', resolved: 'light', setTheme: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme] = useState<Theme>('light');

  useEffect(() => {
    // Force light: remove any previous dark class / theme preference for chrome
    document.documentElement.classList.remove('dark');
    document.documentElement.style.colorScheme = 'light';
    try {
      localStorage.setItem('lth-theme', 'light');
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolved: 'light',
        setTheme: () => {
          /* light-only — ignore dark requests for brand consistency */
        },
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
