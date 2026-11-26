import { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('theme') || 'dark';
    } catch {
      return 'dark';
    }
  });
  const hasMountedRef = useRef(false);

  useEffect(() => {
    const root = document.documentElement;
    const isToggle = hasMountedRef.current;
    hasMountedRef.current = true;

    if (isToggle) {
      root.classList.add('theme-switching');
    }

    root.classList.toggle('dark', theme === 'dark');
    try {
      localStorage.setItem('theme', theme);
    } catch {
      // ignore storage quota errors
    }

    if (!isToggle) return undefined;

    // Flush layout and clear instant-snap class after single frame so interactive hovers still animate
    void root.offsetHeight;
    const raf = requestAnimationFrame(() => {
      root.classList.remove('theme-switching');
    });
    return () => cancelAnimationFrame(raf);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const value = useMemo(
    () => ({ theme, toggleTheme, isDark: theme === 'dark' }),
    [theme, toggleTheme]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
