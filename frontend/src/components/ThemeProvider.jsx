import { useEffect } from 'react';
import { getSettings } from '../utils/settings';

export default function ThemeProvider({ children }) {
  useEffect(() => {
    const applyTheme = () => {
      const settings = getSettings();
      const mode = settings?.system?.themeMode || 'light';

      if (mode === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    applyTheme();

    const handleStorage = (event) => {
      if (event.key === 'smart-campus-settings') {
        applyTheme();
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return children;
}
