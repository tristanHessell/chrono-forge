import { useEffect } from 'react';
import { IntlProvider } from 'react-intl';

import messages from './en.json';

export function GameIntlProvider({ children }: { children: React.ReactNode }) {
  // English is the initial catalog; unsupported browser languages fall back to it.
  const locale =
    navigator.languages.find((language) => /^en(?:-|$)/i.test(language)) ??
    'en';

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <IntlProvider defaultLocale="en" locale={locale} messages={messages}>
      {children}
    </IntlProvider>
  );
}
