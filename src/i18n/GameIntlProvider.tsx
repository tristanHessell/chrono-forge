import { type ReactNode, useEffect } from 'react';
import { IntlProvider } from 'react-intl';

import messages from './en.json';

export function GameIntlProvider ({ children }: { children: ReactNode }) {
  // English is the initial catalog; unsupported browser languages fall back to it.
  const locale =
    navigator.languages.find((language) => /^en(?:-|$)/i.test(language)) ??
    'en';

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <IntlProvider locale={locale} defaultLocale="en" messages={messages}>
      {children}
    </IntlProvider>
  );
}
