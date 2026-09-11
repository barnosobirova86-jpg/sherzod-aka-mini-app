import { createContext, useContext, useEffect, useState } from 'react';
import { tg } from '../telegram.js';

const ThemeContext = createContext(null);
const STORAGE_KEY = 'kisva_theme';

function initialTheme() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
  } catch {
    /* ignore */
  }
  // Telegram temasiga moslash
  if (tg?.colorScheme === 'dark') return 'dark';
  return 'light';
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(initialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;

    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }

    const bg = theme === 'dark' ? '#0e0e11' : '#ffffff';
    try {
      tg?.setHeaderColor?.(bg);
      tg?.setBackgroundColor?.(bg);
    } catch {
      /* eski versiyalarda mavjud emas */
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
