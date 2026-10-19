import { useEffect, useState } from 'react';

import { useMessages } from '../i18n/useMessages';
import { parseTheme, savedTheme, saveTheme, type Theme } from '../theme';

export function ThemeToggle() {
  const t = useMessages();
  const [theme, setTheme] = useState<Theme>(
    () => parseTheme(document.documentElement.dataset.theme) ?? 'light',
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

  return (
    <label className="theme-choice">
      {t('theme.label')}
      <select
        aria-label={t('theme.label')}
        value={theme}
        onChange={(event) => {
          const next = parseTheme(event.target.value);

          if (next) {
            saveTheme(next);
            setTheme(next);
          }
        }}
      >
        {(['light', 'dark', 'greyscale-light', 'greyscale-dark'] as const).map(
          (value) => (
            <option key={value} value={value}>
              {t(`theme.${value}`)}
            </option>
          ),
        )}
      </select>
    </label>
  );
}
