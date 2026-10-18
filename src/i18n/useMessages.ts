import { useIntl } from 'react-intl';

import messages from './en.json';

export function useMessages() {
  const intl = useIntl();

  return (
    id: keyof typeof messages,
    values?: Record<
      string,
      string | number | boolean | Date | null | undefined
    >,
  ) => intl.formatMessage({ id }, values);
}
