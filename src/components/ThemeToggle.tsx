import { useEffect, useState } from 'react';

import { useMessages } from '../i18n/useMessages';
import { savedTheme, storageKey, type Theme } from '../theme';

export function ThemeToggle() {
  const t = useMessages();
  const [theme, setTheme] = useState<Theme>(() =>
    document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light',
  );

  useEffect(() => {
    const preference = matchMedia('(prefers-color-scheme: dark)');
    const followSystem = () => {
      if (!savedTheme()) {
        const next = preference.matches ? 'dark' : 'light';

        document.documentElement.dataset.theme = next;
        setTheme(next);
      }
    };

    preference.addEventListener('change', followSystem);

    return () => preference.removeEventListener('change', followSystem);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';

    document.documentElement.dataset.theme = next;
    setTheme(next);
    try {
      localStorage.setItem(storageKey, next);
    } catch {
      // The theme still works when browser storage is unavailable.
    }
  };

  return (
    <button
      className="history-button theme-toggle"
      type="button"
      aria-label={t('theme.darkLabel')}
      aria-pressed={theme === 'dark'}
      onClick={toggleTheme}
      title={t('theme.switch', { theme: theme === 'dark' ? 'light' : 'dark' })}
    >
      <span aria-hidden="true">{theme === 'dark' ? '☾' : '☀'}</span>{' '}
      {t('theme.name', { theme })}
    </button>
  );
}
