import { useState, useEffect } from 'react';

export type Theme = 'light' | 'dark' | 'auto';
export type ResolvedTheme = 'light' | 'dark';

export function useTheme(theme: Theme = 'auto'): ResolvedTheme {
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light');

  useEffect(() => {
    const resolveTheme = (): ResolvedTheme => {
      if (theme === 'auto') {
        // Check system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
          return 'dark';
        }
        
        // Check stored preference
        const stored = localStorage.getItem('theme');
        if (stored === 'dark' || stored === 'light') {
          return stored as ResolvedTheme;
        }
        
        return 'light';
      }
      
      return theme;
    };

    const updateTheme = () => {
      const newTheme = resolveTheme();
      setResolvedTheme(newTheme);
      
      // Update document class for Tailwind dark mode
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    updateTheme();

    // Listen for system theme changes
    if (theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => updateTheme();
      
      mediaQuery.addEventListener('change', handleChange);
      
      return () => {
        mediaQuery.removeEventListener('change', handleChange);
      };
    }
  }, [theme]);

  return resolvedTheme;
}