/**
 * Theme hook for managing dark/light mode
 */

import { useEffect, useState } from 'react';

export type Theme = 'dark' | 'light' | 'system';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('dark'); // Default to dark
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Apply dark class by default
    const root = window.document.documentElement;
    root.classList.add('dark');
  }, []);

  const setThemeValue = (newTheme: Theme) => {
    const root = window.document.documentElement;

    if (newTheme === 'dark') {
      root.classList.add('dark');
    } else if (newTheme === 'light') {
      root.classList.remove('dark');
    } else {
      // System theme - could implement later if needed
      root.classList.add('dark'); // Default to dark for now
    }

    setTheme(newTheme);
  };

  return {
    theme,
    setTheme: setThemeValue,
    mounted,
  };
}

