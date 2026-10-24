import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';

import { themeMessages } from '../i18n/messageDescriptors';
import { parseTheme, savedTheme, saveTheme, type Theme } from '../theme';
import themeToggleStyles from './ThemeToggle.module.css';

export function ThemeToggle() {
  const intl = useIntl();
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

    return () => {
      preference.removeEventListener('change', followSystem);
    };
  }, []);

  return (
    <label className={themeToggleStyles.themeChoice}>
      {intl.formatMessage({ id: 'theme.label', defaultMessage: 'Theme' })}
      <select
        aria-label={intl.formatMessage({
          id: 'theme.label',
          defaultMessage: 'Theme',
        })}
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
              {intl.formatMessage(themeMessages[value])}
            </option>
          ),
        )}
      </select>
    </label>
  );
}
